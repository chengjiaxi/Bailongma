const fs = require('fs');
const path = require('path');

// ContextCompressor — automatic context window compression
// Monitors session token usage and produces structured summaries
// when token budgets are exceeded. Supports iterative compression
// (compressed sessions can be further compressed).
class ContextCompressor {
  constructor(config) {
    this.config = config || {};
    this.maxTokensBeforeCompress = config.maxTokensBeforeCompress || 20000;
    this.minCompressionGain = config.minCompressionGain || 0.1; // 10% minimum gain
    this.summaryTemplate = config.summaryTemplate || this._defaultTemplate();
  }

  _defaultTemplate() {
    return {
      activeTask: '',
      goal: '',
      progress: [],
      decisions: [],
      blockers: [],
      openQuestions: [],
      keyFiles: [],
      remainingWork: [],
      notes: ''
    };
  }

  // Check if a session needs compression
  shouldCompress(sessionStore, sessionId) {
    var tokenCount = sessionStore.getTotalTokenCount(sessionId);
    return tokenCount > this.maxTokensBeforeCompress;
  }

  // Compress a session: produce summary and mark as compressed
  async compress(sessionStore, sessionId, childSessionId) {
    var session = sessionStore.getSession(sessionId);
    if (!session) return null;

    var messages = sessionStore.getMessages(sessionId);
    var summary = this._buildSummary(session, messages);

    // Mark current session as compressed
    sessionStore.compressSession(sessionId, summary.summary, childSessionId);

    // If there was a previous compression, propagate context
    if (session.parent_id) {
      var parentChain = sessionStore.getSessionChain(sessionId);
      summary.compressionChain = parentChain.length;
    }

    return summary;
  }

  // Build a structured summary from session data and messages
  _buildSummary(session, messages) {
    var summary = JSON.parse(JSON.stringify(this.summaryTemplate));

    // Extract from session metadata
    summary.activeTask = session.task || '';
    if (session.summary) {
      summary.notes = session.summary;
    }

    // Extract from messages (last N messages for most recent context)
    var recentMsgs = messages.slice(-20);

    for (var i = 0; i < recentMsgs.length; i++) {
      var msg = recentMsgs[i];
      var content = msg.content || '';

      // Look for decision patterns
      var decisionMatch = content.match(/决定|选择|采用|使用|改用|确定|确认.*方案/i);
      if (decisionMatch) {
        var snippet = content.slice(Math.max(0, decisionMatch.index - 20), decisionMatch.index + 40);
        summary.decisions.push(snippet);
      }

      // Look for blocker patterns
      var blockerMatch = content.match(/阻塞|卡住|问题|错误|失败|报错|无法|不能|不行/i);
      if (blockerMatch) {
        var snippet = content.slice(Math.max(0, blockerMatch.index - 20), blockerMatch.index + 40);
        summary.blockers.push(snippet);
      }

      // Look for file references
      var fileMatch = content.match(/[A-Za-z]:\\[^\s,，。；;：:！!？?（）()\[\]【】{}"']+/g);
      if (fileMatch) {
        for (var j = 0; j < fileMatch.length; j++) {
          if (summary.keyFiles.indexOf(fileMatch[j]) < 0) {
            summary.keyFiles.push(fileMatch[j]);
          }
        }
      }

      // Look for progress markers
      if (content.includes('完成') || content.includes('成功') || content.includes('通过')) {
        summary.progress.push(content.slice(0, 80));
      }
    }

    // Deduplicate and trim
    summary.decisions = this._unique(summary.decisions).slice(0, 10);
    summary.blockers = this._unique(summary.blockers).slice(0, 10);
    summary.keyFiles = this._unique(summary.keyFiles).slice(0, 15);
    summary.progress = this._unique(summary.progress).slice(0, 10);

    // Build condensed summary string
    var summaryStr = 'Task: ' + (summary.activeTask || 'N/A');
    if (summary.progress.length) summaryStr += ' | Progress: ' + summary.progress.length + ' items';
    if (summary.decisions.length) summaryStr += ' | Decisions: ' + summary.decisions.length;
    if (summary.blockers.length) summaryStr += ' | Blockers: ' + summary.blockers.length;
    if (summary.keyFiles.length) summaryStr += ' | Files: ' + summary.keyFiles.length;
    summary.summary = summaryStr;

    return summary;
  }

  // Estimate token count for a string (approx: 1 token ~= 2 CJK chars or 4 ASCII chars)
  estimateTokens(text) {
    if (!text) return 0;
    var cjkCount = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
    var asciiCount = text.length - cjkCount;
    return Math.ceil(cjkCount / 1.5) + Math.ceil(asciiCount / 4);
  }

  // Check compression effectiveness (anti-thrash)
  compressionGain(sessionStore, sessionId) {
    var before = sessionStore.getTotalTokenCount(sessionId);
    var session = sessionStore.getSession(sessionId);
    if (!before || !session) return 0;

    var summaryLen = this.estimateTokens(session.summary || '');
    if (before === 0) return 0;

    return (before - summaryLen) / before;
  }

  _unique(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      if (result.indexOf(arr[i]) < 0) result.push(arr[i]);
    }
    return result;
  }
}

module.exports = ContextCompressor;