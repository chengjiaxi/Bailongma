const fs = require('fs');
const path = require('path');

const AGENCY_DIR = path.resolve('D:/q/Bailongma/agency-agents-zh');

class RoleTemplates {
  constructor() {
    this.roles = new Map();   // roleId -> role definition
    this.byCategory = new Map(); // category -> [roleId, ...]
    this.byKeyword = new Map();  // keyword -> [roleId, ...]
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this._scanDirectory(AGENCY_DIR);
    this.initialized = true;
    console.log(`[RoleTemplates] Loaded ${this.roles.size} roles in ${this.byCategory.size} categories`);
  }

  _scanDirectory(dir, category = null) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subCategory = category ? `${category}/${entry.name}` : entry.name;
        if (!entry.name.startsWith('.')) {
          this._scanDirectory(fullPath, subCategory);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
        // Skip non-role files
        const skipFiles = ['CATALOG.md', 'UPSTREAM.md', 'CONTRIBUTING.md', 'LICENSE',
          'AGENT-LIST.md', 'EXECUTIVE-BRIEF.md', 'QUICKSTART.md', 'nexus-strategy.md'];
        if (skipFiles.includes(entry.name)) continue;
        if (entry.name.startsWith('bug') || entry.name.startsWith('feature') || entry.name.startsWith('new_agent') || entry.name.startsWith('PULL_REQUEST')) continue;

        this._parseRoleFile(fullPath, category);
      }
    }
  }

  _parseRoleFile(filePath, category) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const roleId = path.basename(filePath, '.md');
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

      let name = roleId;
      let description = '';
      let emoji = '🤖';
      let color = 'gray';
      let body = content;

      if (match) {
        const frontMatter = match[1];
        body = match[2].trim();
        const nameMatch = frontMatter.match(/^name:\s*(.+)$/m);
        if (nameMatch) name = nameMatch[1].trim();
        const descMatch = frontMatter.match(/^description:\s*(.+)$/m);
        if (descMatch) description = descMatch[1].trim();
        const emojiMatch = frontMatter.match(/^emoji:\s*(.+)$/m);
        if (emojiMatch) emoji = emojiMatch[1].trim();
        const colorMatch = frontMatter.match(/^color:\s*(.+)$/m);
        if (colorMatch) color = colorMatch[1].trim();
      }

      const role = {
        id: roleId,
        name,
        description,
        emoji,
        color,
        category: category || 'uncategorized',
        body,
        filePath,
        fullPrompt: body // The full markdown body serves as the system prompt template
      };

      this.roles.set(roleId, role);

      // Index by category
      const cat = category || 'uncategorized';
      if (!this.byCategory.has(cat)) this.byCategory.set(cat, []);
      this.byCategory.get(cat).push(roleId);

      // Index keywords from name and description
      const keywords = [...new Set(
        (name + ' ' + description + ' ' + roleId)
          .toLowerCase()
          .split(/[\s,，、()（）\/\\\-_]+/)
          .filter(k => k.length > 1)
      )];
      for (const kw of keywords) {
        if (!this.byKeyword.has(kw)) this.byKeyword.set(kw, new Set());
        this.byKeyword.get(kw).add(roleId);
      }
    } catch (e) {
      console.error(`[RoleTemplates] Error parsing ${filePath}: ${e.message}`);
    }
  }

  getTemplate(roleId) {
    const role = this.roles.get(roleId);
    if (!role) return null;
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      emoji: role.emoji,
      color: role.color,
      category: role.category,
      prompt: role.fullPrompt
    };
  }

  searchRoles(query) {
    const q = query.toLowerCase();
    const results = [];
    for (const role of this.roles.values()) {
      if (role.name.toLowerCase().includes(q) ||
          role.description.toLowerCase().includes(q) ||
          role.id.toLowerCase().includes(q) ||
          role.category.toLowerCase().includes(q)) {
        results.push({
          id: role.id,
          name: role.name,
          emoji: role.emoji,
          category: role.category,
          description: role.description
        });
      }
    }
    return results;
  }

  searchByKeywords(keywords) {
    const matched = new Set();
    for (const kw of keywords.map(k => k.toLowerCase()).filter(k => k.length > 1)) {
      const ids = this.byKeyword.get(kw);
      if (ids) ids.forEach(id => matched.add(id));
    }
    return [...matched].map(id => ({
      id,
      name: this.roles.get(id).name,
      emoji: this.roles.get(id).emoji,
      category: this.roles.get(id).category,
      description: this.roles.get(id).description
    }));
  }

  getCategories() {
    const result = [];
    for (const [cat, roleIds] of this.byCategory) {
      result.push({
        category: cat,
        count: roleIds.length,
        roles: roleIds.map(id => ({
          id,
          name: this.roles.get(id).name,
          emoji: this.roles.get(id).emoji
        }))
      });
    }
    return result.sort((a, b) => b.count - a.count);
  }

  getCategoryRoles(category) {
    const ids = this.byCategory.get(category);
    if (!ids) return [];
    return ids.map(id => this.getTemplate(id));
  }

  getRoleCount() {
    return this.roles.size;
  }
}

module.exports = RoleTemplates;
