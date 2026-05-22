const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

class SessionStore {
  constructor(dbDir) {
    this.dbDir = dbDir;
    this.dbPath = path.join(dbDir, 'sessions.sqlite');
    this.db = null;
  }

  async init() {
    if (!fs.existsSync(this.dbDir)) fs.mkdirSync(this.dbDir, { recursive: true });
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      const buf = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buf);
    } else {
      this.db = new SQL.Database();
    }
    this.db.run('PRAGMA journal_mode=WAL');
    this.db.run('PRAGMA foreign_keys=ON');
    this.db.run("CREATE TABLE IF NOT EXISTS sessions (" +
      "id TEXT PRIMARY KEY, parent_id TEXT, status TEXT DEFAULT 'created', " +
      "task TEXT, context TEXT, result TEXT, summary TEXT, " +
      "token_count INTEGER DEFAULT 0, is_compressed INTEGER DEFAULT 0, " +
      "events TEXT DEFAULT '[]', " +
      "created_at TEXT DEFAULT (datetime('now')), " +
      "updated_at TEXT DEFAULT (datetime('now')), " +
      "FOREIGN KEY (parent_id) REFERENCES sessions(id))");
    this.db.run("CREATE TABLE IF NOT EXISTS messages (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, " +
      "role TEXT NOT NULL, content TEXT, tool_calls TEXT, tool_call_id TEXT, " +
      "token_count INTEGER DEFAULT 0, " +
      "created_at TEXT DEFAULT (datetime('now')), " +
      "FOREIGN KEY (session_id) REFERENCES sessions(id))");
    this._save();
  }

  _save() {
    const data = this.db.export();
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    fs.writeFileSync(this.dbPath, buf);
  }

  createSession(id, task, context, parentId) {
    if (parentId === undefined) parentId = null;
    this.db.run('INSERT OR REPLACE INTO sessions (id, parent_id, task, context, status) VALUES (?, ?, ?, ?, ?)',
      [id, parentId, task, JSON.stringify(context || {}), 'created']);
    this._save();
  }

  getSession(id) {
    const stmt = this.db.exec('SELECT rowid, * FROM sessions WHERE id = ?', [id]);
    if (!stmt.length || !stmt[0].values.length) return null;
    const cols = stmt[0].columns;
    const vals = stmt[0].values[0];
    return cols.reduce(function(o, c, i) { o[c] = vals[i]; return o; }, {});
  }

  updateSession(id, updates) {
    var allowed = ['status','task','context','result','summary','token_count','is_compressed','parent_id'];
    var sets = [];
    var params = [];
    for (var key in updates) {
      if (allowed.indexOf(key) >= 0) {
        sets.push(key + ' = ?');
        params.push(typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
      }
    }
    if (!sets.length) return;
    sets.push("updated_at = datetime('now')");
    params.push(id);
    this.db.run('UPDATE sessions SET ' + sets.join(', ') + ' WHERE id = ?', params);
    this._save();
  }

  updateStatus(id, status, result) {
    if (result) {
      this.db.run("UPDATE sessions SET status = ?, result = ?, updated_at = datetime('now') WHERE id = ?",
        [status, JSON.stringify(result), id]);
    } else {
      this.db.run("UPDATE sessions SET status = ?, updated_at = datetime('now') WHERE id = ?",
        [status, id]);
    }
    this._save();
  }

  deleteSession(id) {
    this.db.run('DELETE FROM messages WHERE session_id = ?', [id]);
    this.db.run('DELETE FROM sessions WHERE id = ?', [id]);
    this._save();
  }

  listSessions(limit, offset) {
    if (limit === undefined) limit = 20;
    if (offset === undefined) offset = 0;
    var stmt = this.db.exec('SELECT id, parent_id, status, task, summary, token_count, is_compressed, created_at, updated_at FROM sessions ORDER BY created_at DESC LIMIT ' + limit + ' OFFSET ' + offset);
    if (!stmt.length) return [];
    var cols = stmt[0].columns;
    return stmt[0].values.map(function(v) { return cols.reduce(function(o, c, i) { o[c] = v[i]; return o; }, {}); });
  }

  getSessionChain(id) {
    var chain = [];
    var current = this.getSession(id);
    while (current) {
      chain.unshift(current);
      if (current.parent_id) current = this.getSession(current.parent_id);
      else break;
    }
    return chain;
  }

  appendEvent(id, event) {
    var row = this.db.exec('SELECT events FROM sessions WHERE id = ?', [id]);
    if (row.length > 0) {
      var events = JSON.parse(row[0].values[0][0] || '[]');
      events.push(event);
      this.db.run("UPDATE sessions SET events = ?, updated_at = datetime('now') WHERE id = ?", [JSON.stringify(events), id]);
      this._save();
    }
  }

  addMessage(sessionId, role, content, extras) {
    if (!extras) extras = {};
    this.db.run('INSERT INTO messages (session_id, role, content, tool_calls, tool_call_id, token_count) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, role, content, extras.toolCalls ? JSON.stringify(extras.toolCalls) : null, extras.toolCallId || null, extras.tokenCount || 0]);
    this._save();
    if (extras.tokenCount) {
      this.db.run("UPDATE sessions SET token_count = token_count + ?, updated_at = datetime('now') WHERE id = ?", [extras.tokenCount, sessionId]);
      this._save();
    }
  }

  getMessages(sessionId, limit) {
    if (limit === undefined) limit = 100;
    var stmt = this.db.exec('SELECT id, role, content, tool_calls, token_count, created_at FROM messages WHERE session_id = ? ORDER BY id ASC LIMIT ?', [sessionId, limit]);
    if (!stmt.length) return [];
    var cols = stmt[0].columns;
    return stmt[0].values.map(function(v) { return cols.reduce(function(o, c, i) { o[c] = v[i]; return o; }, {}); });
  }

  countMessages(sessionId) {
    var stmt = this.db.exec('SELECT COUNT(*) as cnt FROM messages WHERE session_id = ?', [sessionId]);
    return stmt.length ? stmt[0].values[0][0] : 0;
  }

  getTotalTokenCount(sessionId) {
    var stmt = this.db.exec('SELECT SUM(token_count) as total FROM messages WHERE session_id = ?', [sessionId]);
    return (stmt.length && stmt[0].values[0][0]) ? stmt[0].values[0][0] : 0;
  }

  searchSessions(query, limit) {
    if (limit === undefined) limit = 10;
    var likeQ = '%' + query + '%';
    var stmt = this.db.exec('SELECT id, task, summary, status, created_at FROM sessions WHERE task LIKE ? OR summary LIKE ? ORDER BY created_at DESC LIMIT ?', [likeQ, likeQ, limit]);
    if (!stmt.length) return [];
    var cols = stmt[0].columns;
    return stmt[0].values.map(function(v) { return cols.reduce(function(o, c, i) { o[c] = v[i]; return o; }, {}); });
  }

  searchMessages(query, limit) {
    if (limit === undefined) limit = 20;
    var likeQ = '%' + query + '%';
    var stmt = this.db.exec('SELECT session_id, role, content FROM messages WHERE content LIKE ? ORDER BY id DESC LIMIT ?', [likeQ, limit]);
    if (!stmt.length) return [];
    var cols = stmt[0].columns;
    return stmt[0].values.map(function(v) { return cols.reduce(function(o, c, i) { o[c] = v[i]; return o; }, {}); });
  }

  compressSession(id, summary) {
    this.db.run("UPDATE sessions SET is_compressed = 1, summary = ?, status = 'compressed', updated_at = datetime('now') WHERE id = ?", [summary, id]);
    this._save();
  }

  getCompressibleSessions(threshold) {
    if (threshold === undefined) threshold = 100;
    var stmt = this.db.exec("SELECT s.id, s.task, COUNT(m.id) as msg_count, s.created_at FROM sessions s LEFT JOIN messages m ON m.session_id = s.id WHERE s.is_compressed = 0 AND s.status = 'completed' GROUP BY s.id HAVING msg_count > ? ORDER BY msg_count DESC", [threshold]);
    if (!stmt.length) return [];
    var cols = stmt[0].columns;
    return stmt[0].values.map(function(v) { return cols.reduce(function(o, c, i) { o[c] = v[i]; return o; }, {}); });
  }

  getStats() {
    var stmt = this.db.exec("SELECT COUNT(*) as total_sessions, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed, SUM(token_count) as total_tokens, SUM(CASE WHEN is_compressed=1 THEN 1 ELSE 0 END) as compressed FROM sessions");
    if (!stmt.length) return {};
    var vals = stmt[0].values[0];
    var cols = stmt[0].columns;
    return cols.reduce(function(o, c, i) { o[c] = vals[i]; return o; }, {});
  }

  searchEverything(query, limit) {
    if (limit === undefined) limit = 10;
    var results = { sessions: [], messages: [] };
    try { results.sessions = this.searchSessions(query, limit); results.messages = this.searchMessages(query, limit * 2); } catch (e) {}
    return results;
  }

  close() {
    if (this.db) { this._save(); this.db.close(); }
  }
}

module.exports = SessionStore;