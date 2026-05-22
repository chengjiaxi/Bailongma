const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// BackgroundReview — post-task self-improvement evaluation
// Forks a lightweight sub-agent to analyze completed work and
// decide if any memory or skill updates are warranted.
class BackgroundReview {
  constructor(config) {
    this.config = config || {};
    this.reviewDir = config.reviewDir || path.join(__dirname, 'reviews');
    this.enabled = config.enabled !== false;
    this.minResultLength = config.minResultLength || 50;
  }

  async review(sessionId, task, result, memoryProvider) {
    if (!this.enabled) return;
    if (!result) return;

    var output = '';
    if (typeof result === 'string') output = result;
    else if (result.output) output = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
    else if (result.summary) output = result.summary;
    else output = JSON.stringify(result);

    if (!output || output.length < this.minResultLength) return;

    // 1. Check for style/preference signals
    var styleSignals = this._detectStyleSignals(task, output);
    if (styleSignals.length && memoryProvider) {
      for (var i = 0; i < styleSignals.length; i++) {
        var sig = styleSignals[i];
        memoryProvider.addEntry('preference', sig.title, sig.content, ['style', 'preference']);
      }
    }

    // 2. Check for knowledge/skill signals
    var skillSignals = this._detectSkillSignals(task, output);
    if (skillSignals.length && memoryProvider) {
      for (var i = 0; i < skillSignals.length; i++) {
        var sig = skillSignals[i];
        memoryProvider.addEntry('skill_signal', sig.title, sig.content, ['skill', sig.category || 'general']);
      }
    }

    // 3. Log review report
    this._logReview(sessionId, {
      styleSignals: styleSignals.length,
      skillSignals: skillSignals.length,
      timestamp: new Date().toISOString()
    });

    return {
      styleSignals: styleSignals.length,
      skillSignals: skillSignals.length
    };
  }

  // Detect user preference/style signals from task output
  _detectStyleSignals(task, output) {
    var signals = [];
    var taskStr = typeof task === 'string' ? task : (task && task.task ? (typeof task.task === 'string' ? task.task : task.task.name || '') : '');

    // Look for explicit style corrections in output
    var stylePatterns = [
      { pattern: /别啰嗦|简洁|简短|直接点|说重点/i, title: '偏好简洁回复', content: '用户偏好简洁直接的回复风格，避免啰嗦和冗余解释', category: 'style' },
      { pattern: /不要问|别问|直接做|别废话/i, title: '偏好行动而非询问', content: '用户希望直接执行任务，避免多余的确认性提问', category: 'style' },
      { pattern: /用中文|说中文/i, title: '偏好中文回复', content: '用户偏好使用中文进行交流', category: 'language' },
      { pattern: /格式|排版|对齐|美观/i, title: '关注输出格式', content: '用户关注输出格式和排版美观度', category: 'style' },
      { pattern: /不要[格格格式]式|别用[格格格式]式|换个格式/i, title: '格式偏好调整', content: '用户对特定输出格式有偏好，需要调整回复格式', category: 'style' },
    ];

    for (var i = 0; i < stylePatterns.length; i++) {
      if (stylePatterns[i].pattern.test(taskStr) || stylePatterns[i].pattern.test(output)) {
        signals.push(stylePatterns[i]);
      }
    }

    return signals;
  }

  // Detect reusable knowledge/skill signals from task output
  _detectSkillSignals(task, output) {
    var signals = [];
    var combined = (typeof task === 'string' ? task : JSON.stringify(task)) + ' ' + output;

    // Look for knowledge that should be saved
    var knowledgePatterns = [
      { pattern: /架构|设计模式|最佳实践|方案设计/i, title: '架构知识', content: '任务产生了架构设计或技术方案', category: 'architecture' },
      { pattern: /工作流|流程|步骤|指南/i, title: '工作流知识', content: '任务产生了可复用的工作流或操作步骤', category: 'workflow' },
      { pattern: /配置|部署|安装|docker/i, title: '部署知识', content: '任务涉及环境配置或部署流程', category: 'devops' },
      { pattern: /API|接口|路由|端点/i, title: 'API知识', content: '任务涉及API设计和接口规范', category: 'api' },
      { pattern: /代码|实现|函数|模块/i, title: '代码实现', content: '任务涉及具体代码实现', category: 'code' },
      { pattern: /测试|调试|修复|bug/i, title: '调试知识', content: '任务涉及问题排查或bug修复', category: 'debug' },
    ];

    for (var i = 0; i < knowledgePatterns.length; i++) {
      if (knowledgePatterns[i].pattern.test(combined)) {
        signals.push(knowledgePatterns[i]);
      }
    }

    return signals;
  }

  _logReview(sessionId, report) {
    if (!fs.existsSync(this.reviewDir)) fs.mkdirSync(this.reviewDir, { recursive: true });
    var logFile = path.join(this.reviewDir, 'reviews.jsonl');
    var line = JSON.stringify({ sessionId: sessionId, report: report, ts: new Date().toISOString() }) + '\n';
    try { fs.appendFileSync(logFile, line, 'utf8'); } catch (e) {}
  }

  getReviewStats() {
    var logFile = path.join(this.reviewDir, 'reviews.jsonl');
    if (!fs.existsSync(logFile)) return { total: 0, styleSignals: 0, skillSignals: 0 };
    try {
      var lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
      var stats = { total: lines.length, styleSignals: 0, skillSignals: 0 };
      for (var i = 0; i < lines.length; i++) {
        try {
          var entry = JSON.parse(lines[i]);
          if (entry.report) {
            stats.styleSignals += entry.report.styleSignals || 0;
            stats.skillSignals += entry.report.skillSignals || 0;
          }
        } catch (e) {}
      }
      return stats;
    } catch (e) { return { total: 0, styleSignals: 0, skillSignals: 0 }; }
  }
}

module.exports = BackgroundReview;