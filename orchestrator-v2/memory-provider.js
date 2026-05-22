const fs = require('fs');
const path = require('path');

class MemoryProvider {
  constructor(config) { this.config = config || {}; this.name = 'base'; }
  async initialize() { throw new Error('Not implemented'); }
  async prefetch(taskContext) { throw new Error('Not implemented'); }
  async syncTurn(taskContext, result) { throw new Error('Not implemented'); }
  async search(query, limit) { throw new Error('Not implemented'); }
  wrapContext(content) {
    if (!content || !content.length) return '';
    return '\n<memory-context>\n' + content.join('\n---\n') + '\n</memory-context>\n';
  }
  async shutdown() {}
}

class BuiltInMemoryProvider extends MemoryProvider {
  constructor(config) {
    super(config);
    this.name = 'built-in';
    var home = process.env.HOME || process.env.USERPROFILE || '.';
    this.memoryDir = config.memoryDir || path.join(home, '.hermes', 'memory');
    this.memoryFile = config.memoryFile || path.join(this.memoryDir, 'memories.json');
    this.memories = [];
    this.maxPrefetch = config.maxPrefetch || 5;
  }

  async initialize() {
    if (!fs.existsSync(this.memoryDir)) fs.mkdirSync(this.memoryDir, { recursive: true });
    if (fs.existsSync(this.memoryFile)) {
      try {
        var raw = fs.readFileSync(this.memoryFile, 'utf8');
        this.memories = JSON.parse(raw);
        if (!Array.isArray(this.memories)) this.memories = [];
      } catch (e) { this.memories = []; }
    }
    console.log('[Memory] Loaded ' + this.memories.length + ' memories from ' + this.memoryFile);
  }

  addEntry(type, title, content, tags) {
    var entry = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      type: type || 'general',
      title: title || '',
      content: content || '',
      tags: tags || [],
      created_at: new Date().toISOString(),
      accessed_at: new Date().toISOString(),
      access_count: 1
    };
    this.memories.push(entry);
    this._persist();
    return entry;
  }

  async prefetch(taskContext) {
    var query = '';
    if (typeof taskContext === 'string') {
      query = taskContext;
    } else if (taskContext && taskContext.task) {
      query = typeof taskContext.task === 'string' ? taskContext.task : (taskContext.task.name || taskContext.task.target || '');
    } else if (taskContext && taskContext.target) {
      query = taskContext.target;
    }

    if (!query || !this.memories.length) return [];

    var q = query.toLowerCase();
    var self = this;
    var scored = this.memories.map(function(m) {
      var score = 0;
      var searchSpace = (m.title + ' ' + m.content + ' ' + (m.tags || []).join(' ') + ' ' + m.type).toLowerCase();
      if (searchSpace.includes(q)) score += (searchSpace.split(q).length - 1) * 3;
      var words = q.split(/[\s,，、。．；;：:！!？?（）()\[\]【】]+/).filter(function(w) { return w.length > 1; });
      for (var j = 0; j < words.length; j++) {
        if (searchSpace.includes(words[j])) score += words[j].length;
      }
      score += Math.log((m.access_count || 1) + 1);
      return { entry: m, score: score };
    }).filter(function(s) { return s.score > 0; })
      .sort(function(a, b) { return b.score - a.score; })
      .slice(0, self.maxPrefetch);

    for (var i = 0; i < scored.length; i++) {
      scored[i].entry.access_count = (scored[i].entry.access_count || 1) + 1;
      scored[i].entry.accessed_at = new Date().toISOString();
    }
    if (scored.length) this._persist();

    return scored.map(function(s) { return s.entry; });
  }

  async syncTurn(taskContext, result) {
    if (!result) return;
    var summary = '';
    if (typeof result === 'string') summary = result;
    else if (result.summary) summary = result.summary;
    else if (result.output) summary = typeof result.output === 'string' ? result.output.slice(0, 500) : JSON.stringify(result.output).slice(0, 500);
    else summary = JSON.stringify(result).slice(0, 500);
    if (!summary || summary.length < 20) return;
    if (summary.includes('[LLM Error]') || summary.includes('no result')) return;

    var taskName = '';
    if (typeof taskContext === 'string') taskName = taskContext;
    else if (taskContext && taskContext.task) taskName = typeof taskContext.task === 'string' ? taskContext.task : (taskContext.task.name || '');

    this.addEntry('task_result', taskName.slice(0, 100), summary.slice(0, 1000), [taskName.slice(0, 30)]);
  }

  async search(query, limit) {
    if (limit === undefined) limit = 10;
    if (!query || !this.memories.length) return [];
    var q = query.toLowerCase();
    var results = [];
    for (var i = 0; i < this.memories.length; i++) {
      var m = this.memories[i];
      if ((m.title + ' ' + m.content + ' ' + (m.tags || []).join(' ')).toLowerCase().includes(q)) {
        results.push(m);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  async getContextBlock(taskContext) {
    var memories = await this.prefetch(taskContext);
    if (!memories || !memories.length) return '';
    var lines = memories.map(function(m) {
      return '[' + m.type + '] ' + (m.title ? m.title + ': ' : '') + m.content;
    });
    return this.wrapContext(lines);
  }

  getStats() {
    var byType = {};
    for (var i = 0; i < this.memories.length; i++) {
      var t = this.memories[i].type || 'unknown';
      byType[t] = (byType[t] || 0) + 1;
    }
    return { total: this.memories.length, byType: byType, file: this.memoryFile };
  }

  _persist() {
    try { fs.writeFileSync(this.memoryFile, JSON.stringify(this.memories, null, 2), 'utf8'); }
    catch (e) { console.error('[Memory] Persist error:', e.message); }
  }

  async shutdown() { this._persist(); }
}

module.exports = { MemoryProvider, BuiltInMemoryProvider };