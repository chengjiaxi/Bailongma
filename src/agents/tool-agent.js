// Genesis - ToolAgent 工具执行 Agent
// 专职负责工具调用的安全执行、沙箱隔离与结果收集

import { BaseAgent } from './base-agent.js'
import { MessageType, Priority } from '../shared/types.js'

export class ToolAgent extends BaseAgent {
  constructor() {
    super('tool-agent', {
      maxConcurrent: 5,
      defaultTimeoutMs: 30_000,
      allowedCategories: ['shell', 'filesystem', 'web', 'media', 'memory'],
    })

    /** @type {Map<string, {tool: string, args: object, startedAt: number, status: string}>} */
    this._activeCalls = new Map()
    /** @type {Array<{tool: string, args: object, result: any, durationMs: number, ts: number}>} */
    this._callHistory = []
    this._callSeq = 0
  }

  // ═══════════════════════════════════════════════════════
  // 生命周期
  // ═══════════════════════════════════════════════════════

  async onInit(ctx) {
    await super.onInit(ctx)

    ctx.bus.on(MessageType.TASK_ASSIGN, (msg) => {
      if (msg.to === this.id) this._handleToolCall(msg)
    })
    ctx.bus.on(MessageType.REQUEST, (msg) => {
      if (msg.to === this.id && msg.payload?.action === 'tool_call') {
        this._handleToolCall(msg)
      }
    })
    ctx.bus.on(MessageType.SHUTDOWN, () => this._abortAll())

    console.log('[ToolAgent] 工具执行 Agent 就绪')
  }

  async onShutdown() {
    this._abortAll()
    await super.onShutdown()
  }

  // ═══════════════════════════════════════════════════════
  // 工具执行
  // ═══════════════════════════════════════════════════════

  /**
   * 执行工具调用
   * @param {string} tool - 工具名称
   * @param {object} args - 工具参数
   * @param {object} [options] - 执行选项
   * @returns {Promise<{ok: boolean, result?: any, error?: string}>}
   */
  async execute(tool, args, options = {}) {
    if (this._activeCalls.size >= this.config.maxConcurrent) {
      return { ok: false, error: 'concurrent_limit', detail: `最多同时执行 ${this.config.maxConcurrent} 个工具` }
    }

    const callId = `call-${++this._callSeq}`
    const timeout = options.timeoutMs || this.config.defaultTimeoutMs
    const startedAt = Date.now()

    this._activeCalls.set(callId, { tool, args, startedAt, status: 'running' })

    try {
      // 通过沙箱执行（如果可用），否则直接调用
      const result = this._sandbox
        ? await this._sandbox.run(tool, args, { timeoutMs: timeout })
        : await this._directExecute(tool, args, timeout)

      const durationMs = Date.now() - startedAt
      this._activeCalls.delete(callId)
      this._recordHistory(tool, args, result, durationMs)

      return { ok: true, result }
    } catch (err) {
      const durationMs = Date.now() - startedAt
      this._activeCalls.delete(callId)
      this._recordHistory(tool, args, null, durationMs)

      return { ok: false, error: err.message || 'tool_execution_failed' }
    }
  }

  /**
   * 直接执行（无沙箱隔离，开发/降级模式）
   * @private
   */
  async _directExecute(tool, args, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Tool ${tool} timed out after ${timeoutMs}ms`)), timeoutMs)
      try {
        // 占位：实际执行逻辑由 module-loader 或 executor 桥接
        clearTimeout(timer)
        resolve({ tool, args, mode: 'direct', note: '桥接到 executor 待实现' })
      } catch (e) {
        clearTimeout(timer)
        reject(e)
      }
    })
  }

  // ═══════════════════════════════════════════════════════
  // 消息处理
  // ═══════════════════════════════════════════════════════

  /** @private */
  async _handleToolCall(msg) {
    const { tool, args, options, requestId } = msg.payload || {}
    if (!tool) {
      this.send(MessageType.TASK_FAILED, msg.from, { requestId, error: 'missing tool name' })
      return
    }

    const result = await this.execute(tool, args, options)
    const msgType = result.ok ? MessageType.TASK_RESULT : MessageType.TASK_FAILED
    this.send(msgType, msg.from, { requestId, ...result })
  }

  /** @private */
  _abortAll() {
    for (const [id, call] of this._activeCalls) {
      call.status = 'aborted'
    }
    this._activeCalls.clear()
  }

  /** @private */
  _recordHistory(tool, args, result, durationMs) {
    this._callHistory.push({ tool, args, result, durationMs, ts: Date.now() })
    // 保留最近 200 条
    if (this._callHistory.length > 200) this._callHistory.splice(0, this._callHistory.length - 200)
  }

  // ═══════════════════════════════════════════════════════
  // 状态查询
  // ═══════════════════════════════════════════════════════

  getActiveCalls() {
    return [...this._activeCalls.values()]
  }

  getCallHistory(limit = 20) {
    return this._callHistory.slice(-limit)
  }

  getStats() {
    const total = this._callHistory.length
    const failures = this._callHistory.filter(c => !c.result?.ok).length
    const avgDuration = total > 0
      ? this._callHistory.reduce((s, c) => s + c.durationMs, 0) / total
      : 0
    return { total, failures, avgDurationMs: Math.round(avgDuration), activeCalls: this._activeCalls.size }
  }
}

export const genesisAgent = {
  id: 'tool-agent',
  name: 'ToolAgent',
  role: 'worker',
  capabilities: ['tool_call', 'tool_result'],
  priority: 2,
  create: () => new ToolAgent(),
}
