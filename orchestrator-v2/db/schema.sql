-- orchestrator-v2 会话持久化 SQLite  schema
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  task TEXT NOT NULL,
  status TEXT DEFAULT 'created',       -- created | running | paused | completed | failed
  context TEXT,                        -- JSON: 完整上下文
  result TEXT,                         -- JSON: 最终结果
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,                  -- think | tool_call | tool_result | message | progress
  data TEXT NOT NULL,                  -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  agent_name TEXT,
  level TEXT DEFAULT 'info',
  message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_events_session ON events(session_id);
