const fs = require('fs');
const path = require('path');

// Curator — background skill maintenance orchestrator
// Periodically reviews agent-created skills and memories for
// consolidation, staleness, and merge opportunities.
class Curator {
  constructor(config) {
    this.config = config || {};
    this.skillsDir = config.skillsDir || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.hermes', 'skills');
    this.reportDir = config.reportDir || path.join(__dirname, 'reports');
    this.staleDays = config.staleDays || 30;
    this.archiveDays = config.archiveDays || 90;
    this.enabled = config.enabled !== false;
  }

  async run(memoryProvider) {
    if (!this.enabled) return { status: 'disabled' };

    var report = {
      timestamp: new Date().toISOString(),
      staleSkills: [],
      archivedSkills: [],
      mergedSuggestions: [],
      memoryAnalysis: null
    };

    // 1. Check skill staleness
    try {
      var skills = this._scanSkills();
      report.staleSkills = this._checkStaleness(skills);
      report.archivedSkills = this._checkArchive(skills);
    } catch (e) {
      report.skillError = e.message;
    }

    // 2. Analyze memories for consolidation opportunities
    if (memoryProvider) {
      try {
        report.memoryAnalysis = this._analyzeMemories(memoryProvider);
      } catch (e) {
        report.memoryError = e.message;
      }
    }

    // 3. Generate report
    this._saveReport(report);

    return report;
  }

  _scanSkills() {
    if (!fs.existsSync(this.skillsDir)) return [];
    var entries = [];
    try {
      var items = fs.readdirSync(this.skillsDir, { withFileTypes: true });
      for (var i = 0; i < items.length; i++) {
        if (items[i].isDirectory() || items[i].name.endsWith('.md')) {
          var fullPath = path.join(this.skillsDir, items[i].name);
          var stat = fs.statSync(fullPath);
          entries.push({
            name: items[i].name,
            path: fullPath,
            isDir: items[i].isDirectory(),
            created: stat.birthtime,
            modified: stat.mtime,
            ageDays: (Date.now() - stat.mtime.getTime()) / 86400000
          });
        }
      }
    } catch (e) {}
    return entries;
  }

  _checkStaleness(skills) {
    return skills.filter(function(s) {
      return s.ageDays > this.staleDays && s.ageDays < this.archiveDays;
    }.bind(this)).map(function(s) {
      return { name: s.name, ageDays: Math.round(s.ageDays), action: 'mark-stale' };
    });
  }

  _checkArchive(skills) {
    return skills.filter(function(s) {
      return s.ageDays > this.archiveDays;
    }.bind(this)).map(function(s) {
      return { name: s.name, ageDays: Math.round(s.ageDays), action: 'archive' };
    });
  }

  _analyzeMemories(memoryProvider) {
    var stats = memoryProvider.getStats();
    var suggestions = [];

    // Check for memory type balance
    if (stats.byType) {
      var total = stats.total || 0;
      if (total > 50) {
        suggestions.push('记忆总数超过50条，建议整理合并相似条目');
      }
      var taskResults = stats.byType.task_result || 0;
      if (taskResults > 20) {
        suggestions.push('task_result 类型记忆过多(' + taskResults + '条)，建议按项目归类');
      }
    }

    return {
      totalMemories: stats.total || 0,
      byType: stats.byType || {},
      suggestions: suggestions
    };
  }

  _saveReport(report) {
    if (!fs.existsSync(this.reportDir)) fs.mkdirSync(this.reportDir, { recursive: true });
    var ts = new Date().toISOString().replace(/[:.]/g, '-');
    var reportPath = path.join(this.reportDir, 'curator-' + ts + '.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  }

  getReportHistory(limit) {
    if (limit === undefined) limit = 5;
    if (!fs.existsSync(this.reportDir)) return [];
    try {
      var files = fs.readdirSync(this.reportDir)
        .filter(function(f) { return f.startsWith('curator-') && f.endsWith('.json'); })
        .sort()
        .reverse()
        .slice(0, limit);
      var reports = [];
      for (var i = 0; i < files.length; i++) {
        try {
          reports.push(JSON.parse(fs.readFileSync(path.join(this.reportDir, files[i]), 'utf8')));
        } catch (e) {}
      }
      return reports;
    } catch (e) { return []; }
  }
}

module.exports = Curator;