// Genesis - MemoryAgent 记忆管理 Agent
// 专职负责记忆的存储、检索、整合与遗忘

import { BaseAgent } from './base-agent.js'
import { MessageType, Priority } from '../shared/types.js'

/**
 * @typedef {object} MemoryEntry
 * @property {string} id
 * @property {string} content
 * @property {string[]} tags
 * @property {number} salience - 显著性 0~1
 * @property {number} createdAt
 * @property {number} lastAccessed
 * @property {number} accessCount
 */

export class MemoryAgent extends BaseAgent {
  constructor() {
    super('memory-agent', {
      maxEntries: 10_000,
      consolidationIntervalMs: 300_000, // 5 分钟整合一次
      forgettingThreshold: 0.1,         // 显著性低于此值的条目可被遗忘
      recallTopK: 10,
    })

    /** @type {Map<string, MemoryEntry>} */
    this._store = new Map()
    /** @type {Map<string, string[]>} 倒排索引: tag → entryId[] */
    this._tagIndex = new Map()
    this._consolidationTimer = null
  }

  // ═══════════════════════════════════════════════════════
  // 生命周期
  // ═══════════════════════════════════════════════════════

  async onInit(ctx) {
    await super.onInit(ctx)

    // 消息通过 onMessage() 分发，不再用 bus.on() 直接注册

    // 启动定期整合
    this._consolidationTimer = setInterval(
      () => this._consolidate(),
      this.config.consolidationIntervalMs
    )

    console.log('[MemoryAgent] 记忆管理 Agent 就绪')
  }


  async onMessage(msg) {
    await super.onMessage(msg)
    switch (msg.type) {
      case MessageType.REQUEST:      return this._handleRequest(msg)
      case MessageType.TASK_ASSIGN:  return this._handleTask(msg)
      case MessageType.HEARTBEAT:    return this._onHeartbeatTick()
      case MessageType.SHUTDOWN:     return this._cleanup()
    }
  }

  async onShutdown() {
    if (this._consolidationTimer) {
      clearInterval(this._consolidationTimer)
      this._consolidationTimer = null
    }
    this._store.clear()
    this._tagIndex.clear()
    await super.onShutdown()
  }

  // ═══════════════════════════════════════════════════════
  // 核心操作
  // ═══════════════════════════════════════════════════════

  /**
   * 存储记忆
   * @param {string} content - 记忆内容
   * @param {object} [opts]
   * @returns {MemoryEntry}
   */
  store(content, opts = {}) {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const entry = {
      id,
      content,
      tags: opts.tags || [],
      salience: opts.salience ?? 0.5,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
    }

    this._store.set(id, entry)
    this._indexEntry(entry)

    // 超过上限时淘汰低显著性条目
    if (this._store.size > this.config.maxEntries) {
      this._evict()
    }

    return entry
  }

  /**
   * 检索记忆（全文本 + 标签匹配）
   * @param {string} query - 查询文本
   * @param {object} [opts]
   * @returns {MemoryEntry[]}
   */
  recall(query, opts = {}) {
    const topK = opts.topK || this.config.recallTopK
    const queryLower = query.toLowerCase()
    const queryTags = opts.tags || []

    const scored = []

    for (const entry of this._store.values()) {
      let score = 0

      // 文本匹配（简单子串 + 关键词重叠）
      if (entry.content.toLowerCase().includes(queryLower)) {
        score += 0.6
      }
      const overlap = this._keywordOverlap(queryLower, entry.content.toLowerCase())
      score += overlap * 0.3

      // 标签匹配
      if (queryTags.length > 0) {
        const tagMatch = entry.tags.filter(t => queryTags.includes(t)).length
        score += (tagMatch / queryTags.length) * 0.4
      }

      // 显著性加权
      score *= entry.salience

      // 时间衰减
      const ageMs = Date.now() - entry.lastAccessed
      const decay = Math.exp(-ageMs / (24 * 3600 * 1000)) // 24h 半衰
      score *= (0.5 + 0.5 * decay)

      if (score > 0.05) {
        scored.push({ entry, score })
      }
    }

    scored.sort((a, b) => b.score - a.score)

    // 更新访问记录
    const results = scored.slice(0, topK).map(s => {
      s.entry.lastAccessed = Date.now()
      s.entry.accessCount++
      return s.entry
    })

    return results
  }

  /**
   * 提升记忆显著性
   * @param {string} id
   * @param {number} amount
   */
  reinforce(id, amount = 0.1) {
    const entry = this._store.get(id)
    if (entry) {
      entry.salience = Math.min(1, entry.salience + amount)
      entry.lastAccessed = Date.now()
    }
  }

  /**
   * 删除记忆
   * @param {string} id
   * @returns {boolean}
   */
  forget(id) {
    const entry = this._store.get(id)
    if (!entry) return false

    this._store.delete(id)
    this._removeFromIndex(entry)
    return true
  }

  // ═══════════════════════════════════════════════════════
  // 消息处理
  // ═══════════════════════════════════════════════════════

  /** @private */
  _handleRequest(msg) {
    const { action, params } = msg.payload
    let result = null

    switch (action) {
      case 'store':
        result = this.store(params.content, params)
        break
      case 'recall':
        result = this.recall(params.query, params)
        break
      case 'forget':
        result = this.forget(params.id)
        break
      case 'reinforce':
        this.reinforce(params.id, params.amount)
        result = { ok: true }
        break
      case 'stats':
        result = this.getStats()
        break
      default:
        result = { error: `unknown action: ${action}` }
    }

    this.reply(msg, result)
  }

  /** @private */
  _handleTask(msg) {
    const { taskId, action, params } = msg.payload

    try {
      let result
      switch (action) {
        case 'search_memory':
        case 'recall':
          result = this.recall(params.query, params)
          break
        case 'upsert_memory':
        case 'store':
          result = this.store(params.content, params)
          break
        case 'recall_memory':
          result = this.recall(params.query, { topK: 1, ...params })
          break
        default:
          result = { error: `unhandled task action: ${action}` }
      }
      this.send(MessageType.TASK_RESULT, msg.from, { taskId, result })
    } catch (err) {
      this.send(MessageType.TASK_FAILED, msg.from, { taskId, reason: err.message })
    }
  }

  // ═══════════════════════════════════════════════════════
  // 内部维护
  // ═══════════════════════════════════════════════════════

  /** @private 整合：合并相似记忆、衰减显著性 */
  _consolidate() {
    // 显著性自然衰减
    for (const entry of this._store.values()) {
      const ageMs = Date.now() - entry.lastAccessed
      const decayRate = 0.001 // 每次整合衰减 0.1%
      entry.salience = Math.max(0.01, entry.salience - decayRate * (ageMs / 60_000))
    }

    // 遗忘低显著性条目
    const toForget = []
    for (const [id, entry] of this._store) {
      if (entry.salience < this.config.forgettingThreshold && entry.accessCount === 0) {
        toForget.push(id)
      }
    }
    for (const id of toForget) {
      this.forget(id)
    }

    if (toForget.length > 0) {
      console.log(`[MemoryAgent] 整合完成，遗忘了 ${toForget.length} 条低显著性记忆`)
    }
  }

  /** @private 淘汰最旧的低显著性条目 */
  _evict() {
    const entries = [...this._store.values()]
      .sort((a, b) => a.salience - b.salience || a.lastAccessed - b.lastAccessed)

    const toRemove = entries.slice(0, Math.ceil(entries.length * 0.1))
    for (const entry of toRemove) {
      this._store.delete(entry.id)
      this._removeFromIndex(entry)
    }
  }

  /** @private 建立标签索引 */
  _indexEntry(entry) {
    for (const tag of entry.tags) {
      if (!this._tagIndex.has(tag)) this._tagIndex.set(tag, [])
      this._tagIndex.get(tag).push(entry.id)
    }
  }

  /** @private 移除标签索引 */
  _removeFromIndex(entry) {
    for (const tag of entry.tags) {
      const ids = this._tagIndex.get(tag)
      if (ids) {
        const idx = ids.indexOf(entry.id)
        if (idx !== -1) ids.splice(idx, 1)
        if (ids.length === 0) this._tagIndex.delete(tag)
      }
    }
  }

  /** @private 关键词重叠度 */
  _keywordOverlap(a, b) {
    const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2))
    const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2))
    if (wordsA.size === 0 || wordsB.size === 0) return 0
    let overlap = 0
    for (const w of wordsA) {
      if (wordsB.has(w)) overlap++
    }
    return overlap / Math.max(wordsA.size, wordsB.size)
  }

  /** @private 心跳处理 */
  _onHeartbeatTick() {
    // 可扩展：定期向 Coordinator 报告健康状态
  }

  /** @private 清理 */
  _cleanup() {
    this._consolidate()
  }

  /**
   * 获取记忆统计
   */
  getStats() {
    const base = super.getStats()
    return {
      ...base,
      totalEntries: this._store.size,
      tagCount: this._tagIndex.size,
      avgSalience: this._store.size > 0
        ? [...this._store.values()].reduce((s, e) => s + e.salience, 0) / this._store.size
        : 0,
    }
  }
}

// ═══════════════════════════════════════════════════════
// Agent 模块描述符（供 module-loader 发现）
// ═══════════════════════════════════════════════════════
export default {
  id: 'memory-agent',
  name: 'MemoryAgent',
  role: 'memory-keeper',
  capabilities: ['search_memory', 'upsert_memory', 'recall_memory', 'merge_memories', 'memory_consolidation'],
  priority: 1,
  create: () => new MemoryAgent(),
}

export const genesisAgent = {
  id: 'memory-agent',
  name: 'MemoryAgent',
  role: 'worker',
  capabilities: ['search_memory', 'upsert_memory', 'recall_memory', 'merge_memories', 'memory_consolidation'],
  priority: 1,
  create: () => new MemoryAgent(),
}
