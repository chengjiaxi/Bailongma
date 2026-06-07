// Genesis Kernel - Process Manager
// Agent 生命周期管理：spawn → run → monitor → shutdown

import { EventEmitter } from 'events'
import { AgentState, MessageType, KERNEL_ID, Priority } from '../shared/types.js'

/**
 * @typedef {object} AgentProcess
 * @property {string} id
 * @property {string} name
 * @property {string} state - AgentState
 * @property {object} descriptor - AgentDescriptor
 * @property {object} instance - BaseAgent instance
 * @property {number} startedAt
 * @property {number} lastActivityAt
 * @property {number} errorCount
 * @property {Error|null} lastError
 * @property {object|null} metrics - { messagesProcessed, avgResponseMs, ... }
 */

export class ProcessManager extends EventEmitter {
  /**
   * @param {import('./message-bus.js').MessageBus} bus
   */
  constructor(bus) {
    super()
    this.setMaxListeners(100)
    /** @type {Map<string, AgentProcess>} */
    this._agents = new Map()
    this._bus = bus
    this._shuttingDown = false

    // 监听 Agent 生命周期消息
    this._bus.subscribe(KERNEL_ID, (msg) => {
      if (msg.type === AGENT_ERROR) this._handleAgentError(msg)
    })
  }

  /**
   * 注册并启动一个 Agent
   * @param {import('../shared/types.js').AgentDescriptor} descriptor
   * @param {object} agentInstance - BaseAgent 实例
   * @returns {Promise<void>}
   */
  async spawn(descriptor, agentInstance) {
    if (this._agents.has(descriptor.id)) {
      throw new Error(`Agent already spawned: ${descriptor.id}`)
    }

    const proc = {
      id: descriptor.id,
      name: descriptor.name,
      state: AgentState.CREATED,
      descriptor,
      instance: agentInstance,
      startedAt: 0,
      lastActivityAt: 0,
      errorCount: 0,
      lastError: null,
      metrics: { messagesProcessed: 0, totalResponseMs: 0 },
    }

    this._agents.set(descriptor.id, proc)

    // 订阅该 Agent 的消息
    this._bus.subscribe(descriptor.id, (msg) => {
      proc.lastActivityAt = Date.now()
      proc.metrics.messagesProcessed++
      this._routeToAgent(proc, msg)
    }, descriptor.priority ?? Priority.NORMAL)

    // 生命周期钩子
    this._transition(proc, AgentState.STARTING)
    try {
      await agentInstance.onInit({
        bus: this._bus,
        processManager: this,
        descriptor,
      })
      this._transition(proc, AgentState.RUNNING)
      proc.startedAt = Date.now()
      proc.lastActivityAt = Date.now()

      // 广播诞生
      this._bus.send({
        id: `msg_${Date.now()}_spawn_${descriptor.id}`,
        type: MessageType.AGENT_SPAWN,
        from: KERNEL_ID,
        to: '*',
        payload: { agentId: descriptor.id, name: descriptor.name, role: descriptor.role },
        ts: Date.now(),
        priority: Priority.HIGH,
        ttl: 30_000,
      })
    } catch (err) {
      proc.state = AgentState.ERROR
      proc.lastError = err
      proc.errorCount++
      this.emit('agent_spawn_error', { agentId: descriptor.id, error: err })
      throw err
    }
  }

  /**
   * 停止单个 Agent
   */
  async shutdown(agentId) {
    const proc = this._agents.get(agentId)
    if (!proc) return

    this._transition(proc, AgentState.STOPPING)
    try {
      await proc.instance.onShutdown()
      this._transition(proc, AgentState.STOPPED)
    } catch (err) {
      proc.state = AgentState.ERROR
      proc.lastError = err
      this.emit('agent_shutdown_error', { agentId, error: err })
    }

    this._bus.unsubscribe(agentId)
    this._agents.delete(agentId)
  }

  /**
   * 关闭所有 Agent
   */
  async shutdownAll() {
    this._shuttingDown = true
    const ids = [...this._agents.keys()]
    // 按优先级排序，低优先级先停
    ids.sort((a, b) => {
      const pa = this._agents.get(a)?.descriptor?.priority ?? Priority.NORMAL
      const pb = this._agents.get(b)?.descriptor?.priority ?? Priority.NORMAL
      return pb - pa // 高数字（低优先级）先停
    })

    for (const id of ids) {
      await this.shutdown(id).catch(err => {
        console.error(`[ProcessManager] Error shutting down ${id}:`, err.message)
      })
    }
    this._shuttingDown = false
  }

  /**
   * 获取 Agent 进程信息
   */
  getProcess(agentId) {
    const proc = this._agents.get(agentId)
    if (!proc) return null
    return {
      id: proc.id,
      name: proc.name,
      state: proc.state,
      startedAt: proc.startedAt,
      lastActivityAt: proc.lastActivityAt,
      errorCount: proc.errorCount,
      lastError: proc.lastError?.message || null,
      metrics: { ...proc.metrics },
    }
  }

  /**
   * 列出所有 Agent
   */
  listProcesses() {
    const result = []
    for (const [id, proc] of this._agents) {
      result.push(this.getProcess(id))
    }
    return result
  }

  /**
   * 获取统计摘要
   */
  getStats() {
    let running = 0, errored = 0, starting = 0
    for (const proc of this._agents.values()) {
      if (proc.state === AgentState.RUNNING) running++
      if (proc.state === AgentState.ERROR) errored++
      if (proc.state === AgentState.STARTING) starting++
    }
    return { total: this._agents.size, running, errored, starting }
  }

  // ── 内部方法 ──────────────────────────────────────────────────

  /** @private */
  _transition(proc, newState) {
    const old = proc.state
    proc.state = newState
    this.emit('state_change', { agentId: proc.id, from: old, to: newState })
  }

  /** @private */
  _routeToAgent(proc, msg) {
    try {
      proc.instance.onMessage(msg)
    } catch (err) {
      proc.errorCount++
      proc.lastError = err
      this.emit('agent_error', { agentId: proc.id, msg, error: err })

      // 错误过多自动降级
      if (proc.errorCount >= 5 && proc.state === AgentState.RUNNING) {
        this._transition(proc, AgentState.ERROR)
        this._bus.send({
          id: `msg_${Date.now()}_err_${proc.id}`,
          type: MessageType.AGENT_ERROR,
          from: KERNEL_ID,
          to: KERNEL_ID,
          payload: { agentId: proc.id, error: err.message, errorCount: proc.errorCount },
          ts: Date.now(),
          priority: Priority.CRITICAL,
          ttl: 120_000,
        })
      }
    }
  }

  /** @private */
  _handleAgentError(msg) {
    const { agentId } = msg.payload || {}
    this.emit('agent_error_reported', { agentId, error: msg.payload?.error })
  }
}
