const RoleTemplates = require('./role-templates.js');

class RoleRouter {
  constructor() {
    this.templates = new RoleTemplates();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await this.templates.init();
    this.initialized = true;
  }

  // Generate n-grams from Chinese text for matching
  _ngrams(text, minN = 2, maxN = 4) {
    const chars = text.replace(/[\s,，、。．；;：:！!？?（）()\[\]【】{}《》""''"'"\/\\\-_+*=#@&^%$§~`·…—\d]+/g, '');
    const grams = new Set();
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= chars.length - n; i++) {
        grams.add(chars.slice(i, i + n));
      }
    }
    return grams;
  }

  // Auto-select the best role for a given task description
  selectRole(taskDescription, preferredRoles = []) {
    // 1. If preferred roles specified, use them
    if (preferredRoles.length > 0) {
      const roles = preferredRoles.map(id => this.templates.getTemplate(id)).filter(Boolean);
      if (roles.length > 0) return roles;
    }

    const q = taskDescription.toLowerCase();

    // 2. Generate n-grams from the task query
    const queryGrams = this._ngrams(q, 2, 4);

    // Also extract English terms and standalone keywords
    const terms = q.split(/[\s,，、。．；;：:！!？?（）()\[\]【】{}《》""''"'"\/\\\-_+*=#@&^%$§~`·…—]+/)
      .filter(t => t.length > 1);

    // 3. Score each role
    const scores = new Map();
    for (const [id, role] of this.templates.roles) {
      const searchSpace = (role.name + ' ' + role.description + ' ' + role.id + ' ' + role.category).toLowerCase();
      let score = 0;

      // Score by n-gram overlap (for Chinese)
      const roleGrams = this._ngrams(searchSpace, 2, 4);
      let overlap = 0;
      for (const gram of queryGrams) {
        if (roleGrams.has(gram)) overlap++;
      }
      if (queryGrams.size > 0) {
        score += (overlap / queryGrams.size) * 100;
      }

      // Score by term matching (for English/mixed)
      for (const term of terms) {
        if (searchSpace.includes(term)) {
          score += term.length * 3;
          // Extra for name/id match
          if (role.name.toLowerCase().includes(term)) score += term.length * 2;
          if (role.id.toLowerCase().includes(term)) score += term.length;
        }
      }

      // Boost for full name match
      if (searchSpace.includes(q) && q.length > 4) {
        score += q.length * 5;
      }

      if (score > 0) scores.set(id, Math.round(score));
    }

    // 4. Return top matches (up to 5)
    const ranked = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => this.templates.getTemplate(id));

    return ranked;
  }

  // Decompose a complex task and assign roles to each sub-task
  async decomposeWithRoles(mainTask) {
    const lines = mainTask.split('\n').filter(l => l.trim());
    if (lines.length <= 1) {
      const roles = this.selectRole(mainTask);
      return [{
        id: 'sub_1',
        name: mainTask.slice(0, 60),
        target: mainTask,
        priority: 1,
        roles: roles
      }];
    }

    return lines.map((line, i) => {
      const trimmed = line.trim();
      const roles = this.selectRole(trimmed);
      return {
        id: 'sub_' + (i + 1),
        name: trimmed.slice(0, 60),
        target: trimmed,
        priority: i + 1,
        roles: roles
      };
    });
  }

  getTemplates() { return this.templates; }
}

module.exports = RoleRouter;
