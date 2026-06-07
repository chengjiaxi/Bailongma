// Genesis Kernel - Message Bus
// Agent 间消息路由总线

import { EventEmitter } from 'events'
import { MessageType, KERNEL_ID, WILDCARD_ID, Priority } from '../shared/types.js'

export class MessageBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(200)
    /** @type {Map<string, {handler: Function, priority: number}[]>} */
    this._routes = new Map()
    /** @type {import('../shared/types.js').Message[]} */
    this._deadLetter = []
    this._deadLetterMax = 500
    /** @type {Map<string, {resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout>}>} */
    this._pending = new Map()
    this._stats = { sent: 0, delivered: 0, deadLettered: 0, timeout: 0 }
  }

  /**
   * Agent 注册接收消息
   * @param {string} agentId
   * @param {Function} handler - (message) => void
   * @param {number} [priority=Priority.NORMAL]
   */
  subscribe(agentId, handler, priority = Priority.NORMAL) {
    if (!this._routes.has(agentId)) this._routes.set(agentId, [])
    this._routes.get(agentId).push({ handler, priority })
    this._routes.get(agentId).sort((a, b) => a.priority - b.priority)
  }

  /**
   * 取消订阅
   */
  unsubscribe(agentId, handler) {
    const list = this._routes.get(agentId)
    if (!list) return
    const idx = list.findIndex(r => r.handler === handler)
    if (idx >= 0) list.splice(idx, 1)
    if (list.length === 0) this._routes.delete(agentId)
  }

  /**
   * 发送消息（核心路由）
   * @param {import('../shared/types.js').Message} msg
   */
  send(msg) {
    this._stats.sent++

    // 广播
    if (msg.to === WILDCARD_ID) {
      for (const [agentId, routes] of this._routes) {
        if (agentId === msg.from) continue // 不发给自己
        for (const r of routes) {
          this._deliver(r.handler, msg, agentId)
        }
      }
      return
    }

    // 定向发送
    const routes = this._routes.get(msg.to)
    if (routes && routes.length > 0) {
      for (const r of routes) {
        this._deliver(r.handler, msg, msg.to)
      }
      return
    }

    // 无人认领 -> 死信
    this._deadLetter.push(msg)
    if (this._deadLetter.length > this._deadLetterMax) {
      this._deadLetter.shift()
    }
    this._stats.deadLettered++
    this.emit('dead_letter', msg)
  }

  /**
   * 请求-响应模式（带超时）
   * @param {string} from
   * @param {string} to
   * @param {*} payload
   * @param {number} [timeoutMs=30000]
   * @returns {Promise<import('../shared/types.js').Message>}
   */
  request(from, to, payload, timeoutMs = 30_000) {
    return new Promise((resolve, reject) => {
      const { createMessage } = require('../shared/types.js')
      const msg = createMessage(MessageType.REQUEST, from, to, payload)
      const timer = setTimeout(() => {
        this._pending.delete(msg.id)
        this._stats.timeout++
        reject(new Error("MessageBus request timeout: ${from} -> ${to} (${timeoutMs}ms)"))
      }, timeoutMs)
      this._pending.set(msg.id, { resolve, reject, timer })
      this.send(msg)
    })
  }

  /**
   * 回复消息
   */
  reply(originalMsg, from, payload) {
    const { createMessage } = require('../shared/types.js')
    const replyMsg = createMessage(MessageType.RESPONSE, from, originalMsg.from, payload, {
      replyTo: originalMsg.id,
    })

    // 如果是 request 模式的回复，直接 resolve
    const pending = this._pending.get(originalMsg.id)
    if (pending) {
      clearTimeout(pending.timer)
      this._pending.delete(originalMsg.id)
      pending.resolve(replyMsg)
    }

    this.send(replyMsg)
  }

  /** @private */
  _deliver(handler, msg, agentId) {
    try {
      handler(msg)
      this._stats.delivered++
    } catch (err) {
      this.emit('delivery_error', { agentId, msg, error: err })
    }
  }

  /** 获取统计 */
  getStats() {
    return { ...this._stats, pendingRequests: this._pending.size, deadLetters: this._deadLetter.length }
  }

  /** 获取死信（调试用） */
  getDeadLetters(limit = 20) {
    return this._deadLetter.slice(-limit)
  }

  /** 关闭总线 */
  shutdown() {
    // 清理所有 pending requests
    for (const [id, p] of this._pending) {
      clearTimeout(p.timer)
      p.reject(new Error('MessageBus shutting down'))
    }
    this._pending.clear()
    this._routes.clear()
    this._deadLetter = []
    this.removeAllListeners()
  }
}
