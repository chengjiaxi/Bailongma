// Genesis Kernel - Sandbox
// Agent 资源隔离与限制执行

/**
 * @typedef {object} SandboxConfig
 * @property {number} [maxMemoryMB=128] - 内存上限
 * @property {number} [maxCpuPercent=30] - CPU 占用上限
 * @property {number} [maxMessagesPerTick=50] - 单 tick 消息上限
 * @property {number} [maxToolCalls=20] - 单 tick 工具调用上限
 * @property {number} [timeoutMs=30_000] - 单次操作超时
 * @property {string[]} [allowedModules] - 允许 import 的模块白名单
 * @property {string[]} [blockedModules] - 禁止 import 的模块黑名单
 */

const DEFAULTS = {
  maxMemoryMB: 128,
  maxCpuPercent: 30,
  maxMessagesPerTick: 50,
  maxToolCalls: 20,
  timeoutMs: 30_000,
  allowedModules: null, // null = 全部允许
  blockedModules: ['child_process', 'fs', 'net', 'dgram', 'cluster'],
}

export class Sandbox {
  /**
   * @param {string} agentId
   * @param {SandboxConfig} [config]
   */
  constructor(agentId, config = {}) {
    this.agentId = agentId
    this.config = { ...DEFAULTS, ...config }
    this._messageCount = 0
    this._toolCallCount = 0
    this._violations = []
    this._tickStart = Date.now()
  }

  /**
   * 重置每 tick 计数器
   */
  resetTick() {
    this._messageCount = 0
    this._toolCallCount = 0
    this._tickStart = Date.now()
  }

  /**
   * 检查消息配额
   * @returns {{ allowed: boolean, reason?: string }}
   */
  checkMessageQuota() {
    if (this._messageCount >= this.config.maxMessagesPerTick) {
      const violation = { type: 'message_quota', agentId: this.agentId, at: Date.now() }
      this._violations.push(violation)
      return { allowed: false, reason: `消息配额耗尽 (${this.config.maxMessagesPerTick}/tick)` }
    }
    this._messageCount++
    return { allowed: true }
  }

  /**
   * 检查工具调用配额
   */
  checkToolCallQuota() {
    if (this._toolCallCount >= this.config.maxToolCalls) {
      const violation = { type: 'tool_call_quota', agentId: this.agentId, at: Date.now() }
      this._violations.push(violation)
      return { allowed: false, reason: `工具调用配额耗尽 (${this.config.maxToolCalls}/tick)` }
    }
    this._toolCallCount++
    return { allowed: true }
  }

  /**
   * 检查模块是否允许加载
   */
  checkModuleAccess(moduleName) {
    if (this.config.blockedModules?.includes(moduleName)) {
      const violation = { type: 'blocked_module', agentId: this.agentId, module: moduleName, at: Date.now() }
      this._violations.push(violation)
      return { allowed: false, reason: `模块 ${moduleName} 被沙箱禁止` }
    }
    if (this.config.allowedModules && !this.config.allowedModules.includes(moduleName)) {
      return { allowed: false, reason: `模块 ${moduleName} 不在白名单中` }
    }
    return { allowed: true }
  }

  /**
   * 包装异步操作，附加超时
   * @template T
   * @param {() => Promise<T>} fn
   * @param {string} [label]
   * @returns {Promise<T>}
   */
  async enforceTimeout(fn, label = 'operation') {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._violations.push({ type: 'timeout', agentId: this.agentId, label, at: Date.now() })
        reject(new Error(`Sandbox timeout: ${label} exceeded ${this.config.timeoutMs}ms`))
      }, this.config.timeoutMs)

      fn().then(
        (result) => { clearTimeout(timer); resolve(result) },
        (err) => { clearTimeout(timer); reject(err) }
      )
    })
  }

  /**
   * 获取违规记录
   */
  getViolations() {
    return [...this._violations]
  }

  /**
   * 清除违规记录
   */
  clearViolations() {
    this._violations = []
  }

  /**
   * 当前 tick 概况
   */
  getTickStats() {
    return {
      agentId: this.agentId,
      messagesThisTick: this._messageCount,
      toolCallsThisTick: this._toolCallCount,
      violations: this._violations.length,
      elapsedMs: Date.now() - this._tickStart,
    }
  }
}
