// Genesis - ContextAgent 上下文管理 Agent
// 专职负责焦点栈管理、上下文构建、话题追踪与窗口裁剪

import { BaseAgent } from './base-agent.js'
import { MessageType, createMessage, Priority } from '../shared/types.js'

export class ContextAgent extends BaseAgent {
  constructor(id = 'context', config = {}) {
    super(id, config)
    /** @type {Array<{topic: string, ts: number, metadata: object}>} */
    this._focusStack = []
    this._maxFocusDepth = config.maxFocusDepth || 10
    this._contextWindowMs = config.contextWindowMs || 30 * 60 * 1000 // 30 min
  }

  async onInit(ctx) {
    await super.onInit(ctx)
    ctx.bus.subscribe(MessageType.CONTEXT_UPDATE, this._onContextUpdate.bind(this))
    ctx.bus.subscribe(MessageType.CONTEXT_REQUEST, this._onContextRequest.bind(this))
  }

  async onMessage(msg) {
    await super.onMessage(msg)
    const action = msg.payload?.action

    switch (action) {
      case 'push-focus':
        return this._pushFocus(msg)
      case 'pop-focus':
        return this._popFocus(msg)
      case 'get-context':
        return this._getContext(msg)
      case 'build-context':
        return this._buildContext(msg)
      case 'trim-window':
        return this._trimWindow(msg)
      default:
        this._publishResult(msg, { error: `Unknown action: ${action}` })
    }
  }

  // ── 焦点栈操作 ──────────────────────────────────────────────────

  async _pushFocus(msg) {
    const { topic, metadata = {} } = msg.payload || {}
    if (!topic) return this._publishResult(msg, { error: 'Missing topic' })

    // 去重：如果栈顶已是同一 topic，只更新时间
    const top = this._focusStack[this._focusStack.length - 1]
    if (top && top.topic === topic) {
      top.ts = Date.now()
      Object.assign(top.metadata, metadata)
      return this._publishResult(msg, { pushed: true, depth: this._focusStack.length, deduplicated: true })
    }

    // 溢出保护
    if (this._focusStack.length >= this._maxFocusDepth) {
      this._focusStack.shift()
    }

    this._focusStack.push({ topic, ts: Date.now(), metadata })
    this._publishResult(msg, { pushed: true, depth: this._focusStack.length })
  }

  async _popFocus(msg) {
    const popped = this._focusStack.pop()
    this._publishResult(msg, { popped: popped?.topic || null, depth: this._focusStack.length })
  }

  async _getContext(msg) {
    this._publishResult(msg, {
      stack: this._focusStack.map(f => ({ topic: f.topic, age: Date.now() - f.ts })),
      depth: this._focusStack.length,
    })
  }

  async _buildContext(msg) {
    const { messages = [], maxTokens = 4000 } = msg.payload || {}
    const now = Date.now()
    const cutoff = now - this._contextWindowMs

    // 按时间裁剪
    const recent = messages.filter(m => (m.timestamp || 0) >= cutoff)

    // 附带焦点栈信息
    const activeFocus = this._focusStack.length > 0
      ? this._focusStack[this._focusStack.length - 1]
      : null

    this._publishResult(msg, {
      messages: recent,
      activeFocus: activeFocus?.topic || null,
      focusDepth: this._focusStack.length,
      windowMs: this._contextWindowMs,
    })
  }

  async _trimWindow(msg) {
    const { windowMs } = msg.payload || {}
    if (windowMs) this._contextWindowMs = windowMs
    this._publishResult(msg, { windowMs: this._contextWindowMs })
  }

  // ── 事件处理 ─────────────────────────────────────────────────────

  async _onContextUpdate(msg) {
    // 外部上下文变化时自动压栈
    const topic = msg.payload?.topic
    if (topic) {
      await this._pushFocus({ ...msg, payload: { action: 'push-focus', topic, metadata: msg.payload?.metadata } })
    }
  }

  async _onContextRequest(msg) {
    await this._getContext(msg)
  }

  _publishResult(msg, result) {
    this.ctx?.bus?.publish(createMessage(MessageType.TOOL_RESULT, this.id, msg.source, {
      correlationId: msg.id,
      result,
    }, { priority: Priority.NORMAL }))
  }
}

export const genesisAgent = {
  id: 'context',
  name: 'ContextAgent',
  role: 'worker',
  capabilities: ['context_build', 'prompt_inject'],
  priority: 1,
  create: () => new ContextAgent(),
}
