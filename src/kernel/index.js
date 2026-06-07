// Genesis Kernel - 入口
// 微内核启动编排：初始化总线 → 加载 Agent → 注册 → 启动心跳

import { MessageBus } from './message-bus.js'
import { ProcessManager } from './process-manager.js'
import { Sandbox } from './sandbox.js'
import { discoverAgents } from './module-loader.js'
import { MessageType, KERNEL_ID, createMessage, Priority } from '../shared/types.js'

export class Kernel {
  constructor() {
    this.bus = new MessageBus()
    this.processManager = new ProcessManager(this.bus)
    /** @type {Map<string, Sandbox>} */
    this._sandboxes = new Map()
    this._heartbeatTimer = null
    this._booted = false
    this._bootTime = 0
  }

  /**
   * 启动内核
   * @param {object} [opts]
   * @param {string[]} [opts.only] - 仅启动这些 Agent
   * @param {string[]} [opts.exclude] - 排除这些 Agent
   * @param {object} [opts.sandboxDefaults] - 沙箱默认配置
   */
  async boot(opts = {}) {
    if (this._booted) {
      console.warn('[Kernel] 已启动，忽略重复 boot')
      return
    }

    this._bootTime = Date.now()
    console.log('[Kernel] Genesis 微内核启动中...')

    // 广播 BOOT 消息
    this.bus.send(createMessage(MessageType.BOOT, KERNEL_ID, '*', {
      kernelVersion: 'genesis-v1',
      bootTime: this._bootTime,
    }, { priority: Priority.CRITICAL }))

    // 发现并加载 Agent 模块
    const modules = await discoverAgents({
      only: opts.only,
      exclude: opts.exclude,
    })
    console.log(`[Kernel] 发现 ${modules.length} 个 Agent 模块`)

    // 逐个 spawn
    for (const mod of modules) {
      try {
        const agent = mod.create()

        // 创建沙箱
        const sandboxConfig = { ...opts.sandboxDefaults, ...agent.sandboxConfig }
        const sandbox = new Sandbox(mod.id, sandboxConfig)
        this._sandboxes.set(mod.id, sandbox)

        // 注入沙箱到 Agent
        agent._sandbox = sandbox

        await this.processManager.spawn({
          id: mod.id,
          name: mod.name,
          role: mod.role,
          capabilities: mod.capabilities,
          priority: mod.priority,
          config: {},
          sandbox: sandboxConfig,
        }, agent)

        console.log(`[Kernel] ✓ Agent ${mod.name} (${mod.id}) 已启动`)
      } catch (err) {
        console.error(`[Kernel] ✗ Agent ${mod.name} (${mod.id}) 启动失败:`, err.message)
      }
    }

    // 启动心跳
    this._startHeartbeat()
    this._booted = true

    const stats = this.processManager.getStats()
    console.log(`[Kernel] 启动完成：${stats.running} 个 Agent 运行中，耗时 ${Date.now() - this._bootTime}ms`)

    return stats
  }

  /**
   * 关闭内核
   */
  async shutdown() {
    if (!this._booted) return

    console.log('[Kernel] 正在关闭...')
    this._stopHeartbeat()

    // 广播 SHUTDOWN
    this.bus.send(createMessage(MessageType.SHUTDOWN, KERNEL_ID, '*', {
      reason: 'kernel_shutdown',
    }, { priority: Priority.CRITICAL }))

    // 关闭所有 Agent
    await this.processManager.shutdownAll()

    // 关闭总线
    this.bus.shutdown()

    this._sandboxes.clear()
    this._booted = false
    console.log('[Kernel] 已关闭')
  }

  /**
   * 获取内核状态
   */
  getStatus() {
    return {
      booted: this._booted,
      uptimeMs: this._booted ? Date.now() - this._bootTime : 0,
      agents: this.processManager.getStats(),
      bus: this.bus.getStats(),
      sandboxes: [...this._sandboxes.entries()].map(([id, sb]) => ({
        id,
        ...sb.getTickStats(),
      })),
    }
  }

  /**
   * 向指定 Agent 发送任务
   */
  sendTask(to, action, params = {}) {
    const msg = createMessage(MessageType.TASK_ASSIGN, KERNEL_ID, to, { action, params }, {
      priority: Priority.HIGH,
    })
    this.bus.send(msg)
    return msg.id
  }

  // ── 内部 ──────────────────────────────────────────────

  /** @private */
  _startHeartbeat() {
    this._heartbeatTimer = setInterval(() => {
      this.bus.send(createMessage(MessageType.HEARTBEAT, KERNEL_ID, '*', {
        time: Date.now(),
        agents: this.processManager.getStats(),
      }, { priority: Priority.LOW, ttl: 10_000 }))

      // 重置沙箱 tick 计数
      for (const sb of this._sandboxes.values()) {
        sb.resetTick()
      }
    }, 30_000) // 30 秒心跳
  }

  /** @private */
  _stopHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer)
      this._heartbeatTimer = null
    }
  }
}

// 导出单例（供外部使用）
let _instance = null
export function getKernel() {
  if (!_instance) _instance = new Kernel()
  return _instance
}
