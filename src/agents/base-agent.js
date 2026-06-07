// Genesis - BaseAgent 基类
// 所有 Agent 的抽象基类，定义生命周期和通信接口

import { MessageType, KERNEL_ID, createMessage, Priority } from '../shared/types.js'

/**
 * @typedef {object} AgentContext
 * @property {import('../kernel/message-bus.js').MessageBus} bus
 * @property {import('../kernel/process-manager.js').ProcessManager} processManager
 * @property {import('../shared/types.js').AgentDescriptor} descriptor
 */

export class BaseAgent {
  /**
   * @param {string} id - Agent 唯一 ID
   * @param {object} [config] - 私有配置
   */
  constructor(id, config = {}) {
    this.id = id
    this.config = config
    /** @type {AgentContext|null} */
    this._ctx = null
    /** @type {import('../kernel/sandbox.js').Sandbox|null} */
    this._sandbox = null
    /** @type {Map<string, any>} */
    this._state = new Map()
    this._messageCount = 0
    this._startedAt = 0
  }

  // ═══════════════════════════════════════════════════════
  // 生命周期钩子（子类可覆盖）
  // ═══════════════════════════════════════════════════════

  /**
   * 初始化钩子 — Agent 启动时调用
   * @param {AgentContext} ctx
   * @returns {Promise<void>}
   */
  async onInit(ctx) {
    this._ctx = ctx
    this._startedAt = Date.now()
  }

  /**
   * 消息处理钩子 — 收到消息时调用
   * @param {import('../shared/types.js').Message} msg
   * @returns {Promise<void>}
   */
  async onMessage(msg) {
    this._messageCount++
  }

  /**
   * 关闭钩子 — Agent 停止前调用
   * @returns {Promise<void>}
   */
  async onShutdown() {
    // 清理资源
    this._state.clear()
    this._ctx = null
  }

  /**
   * 心跳钩子 — 每次内核心跳时调用
   * @returns {Promise<void>}
   */
  async onHeartbeat() {
    // 子类可覆盖
  }

  // ═══════════════════════════════════════════════════════
  // 通信 API
  // ═══════════════════════════════════════════════════════

  /**
   * 发送消息到总线
   * @param {string} type - MessageType
   * @param {string} to - 目标 Agent ID
   * @param {*} payload - 消息体
   * @param {object} [opts] - 可选参数
   */
  send(type, to, payload, opts = {}) {
    if (!this._ctx?.bus) {
      throw new Error(`Agent ${this.id} not initialized, cannot send`)
    }
    const msg = createMessage(type, this.id, to, payload, opts)
    this._ctx.bus.send(msg)
    return msg.id
  }

  /**
   * 回复消息
   * @param {import('../shared/types.js').Message} original - 原始消息
   * @param {*} payload - 回复内容
   * @param {object} [opts]
   */
  reply(original, payload, opts = {}) {
    return this.send(MessageType.RESPONSE, original.from, payload, {
      ...opts,
      replyTo: original.id,
    })
  }

  /**
   * 广播消息给所有 Agent
   * @param {string} type
   * @param {*} payload
   * @param {object} [opts]
   */
  broadcast(type, payload, opts = {}) {
    return this.send(type, '*', payload, opts)
  }

  /**
   * 向内核报告错误
   * @param {Error} err
   * @param {object} [context]
   */
  reportError(err, context = {}) {
    this.send(MessageType.AGENT_ERROR, KERNEL_ID, {
      agentId: this.id,
      error: err.message,
      stack: err.stack,
      context,
    }, { priority: Priority.CRITICAL })
  }

  // ═══════════════════════════════════════════════════════
  // 状态管理
  // ═══════════════════════════════════════════════════════

  /**
   * 设置状态
   */
  setState(key, value) {
    this._state.set(key, value)
  }

  /**
   * 获取状态
   */
  getState(key) {
    return this._state.get(key)
  }

  /**
   * 获取运行统计
   */
  getStats() {
    return {
      id: this.id,
      uptimeMs: this._startedAt ? Date.now() - this._startedAt : 0,
      messageCount: this._messageCount,
      stateKeys: [...this._state.keys()],
    }
  }

  // ═══════════════════════════════════════════════════════
  // 沙箱工具
  // ═══════════════════════════════════════════════════════

  /**
   * 检查沙箱资源限制
   * @returns {boolean}
   */
  checkSandbox() {
    if (!this._sandbox) return true
    return this._sandbox.checkLimit()
  }

  /**
   * 获取沙箱统计
   */
  getSandboxStats() {
    if (!this._sandbox) return null
    return this._sandbox.getTickStats()
  }
}
