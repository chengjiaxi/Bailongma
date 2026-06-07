// Genesis - VoiceAgent 语音处理 Agent
// 专职负责 TTS 合成、ASR 识别、语音路由与信道适配

import { BaseAgent } from './base-agent.js'
import { MessageType, createMessage, Priority } from '../shared/types.js'

export class VoiceAgent extends BaseAgent {
  constructor(id = 'voice', config = {}) {
    super(id, config)
    /** @type {string|null} TTS 引擎标识 */
    this._ttsEngine = config.ttsEngine || null
    /** @type {string|null} ASR 引擎标识 */
    this._asrEngine = config.asrEngine || null
    /** @type {Map<string, object>} 音频缓存 */
    this._audioCache = new Map()
    this._audioCacheMaxSize = config.audioCacheMaxSize || 50
  }

  async onInit(ctx) {
    await super.onInit(ctx)
    ctx.bus.subscribe(MessageType.VOICE_INPUT, this._onVoiceInput.bind(this))
    ctx.bus.subscribe(MessageType.VOICE_OUTPUT, this._onVoiceOutput.bind(this))
  }

  async onMessage(msg) {
    await super.onMessage(msg)
    const action = msg.payload?.action

    switch (action) {
      case 'speak':
        return this._speak(msg)
      case 'transcribe':
        return this._transcribe(msg)
      case 'set-engine':
        return this._setEngine(msg)
      case 'get-status':
        return this._getStatus(msg)
      default:
        this._publishResult(msg, { error: `Unknown action: ${action}` })
    }
  }

  // ── TTS 合成 ─────────────────────────────────────────────────────

  async _speak(msg) {
    const { text, voice, speed, engine } = msg.payload || {}
    if (!text) return this._publishResult(msg, { error: 'Missing text' })

    const ttsEngine = engine || this._ttsEngine
    if (!ttsEngine) return this._publishResult(msg, { error: 'No TTS engine configured' })

    // 检查缓存
    const cacheKey = `${ttsEngine}:${voice || 'default'}:${text}`
    const cached = this._audioCache.get(cacheKey)
    if (cached) return this._publishResult(msg, { cached: true, ...cached })

    // 委托给执行层 — 通过消息总线发给 ToolAgent
    this.ctx?.bus?.publish(createMessage(MessageType.TOOL_REQUEST, this.id, 'tool', {
      tool: 'speak',
      args: { text, voice, speed, engine: ttsEngine },
      correlationId: msg.id,
    }, { priority: Priority.HIGH }))

    // 结果会通过 TOOL_RESULT 回来，这里不直接返回
  }

  async _transcribe(msg) {
    const { audioData, language, engine } = msg.payload || {}
    if (!audioData) return this._publishResult(msg, { error: 'Missing audio data' })

    const asrEngine = engine || this._asrEngine
    if (!asrEngine) return this._publishResult(msg, { error: 'No ASR engine configured' })

    // 委托给执行层
    this.ctx?.bus?.publish(createMessage(MessageType.TOOL_REQUEST, this.id, 'tool', {
      tool: 'transcribe',
      args: { audioData, language, engine: asrEngine },
      correlationId: msg.id,
    }, { priority: Priority.HIGH }))
  }

  // ── 配置 ─────────────────────────────────────────────────────────

  async _setEngine(msg) {
    const { tts, asr } = msg.payload || {}
    if (tts) this._ttsEngine = tts
    if (asr) this._asrEngine = asr
    this._publishResult(msg, { ttsEngine: this._ttsEngine, asrEngine: this._asrEngine })
  }

  async _getStatus(msg) {
    this._publishResult(msg, {
      ttsEngine: this._ttsEngine,
      asrEngine: this._asrEngine,
      cacheSize: this._audioCache.size,
      cacheMaxSize: this._audioCacheMaxSize,
    })
  }

  // ── 事件处理 ─────────────────────────────────────────────────────

  async _onVoiceInput(msg) {
    // 外部语音输入事件 → 转录
    await this._transcribe({ ...msg, payload: { action: 'transcribe', ...msg.payload } })
  }

  async _onVoiceOutput(msg) {
    // 外部语音输出事件 → 合成
    await this._speak({ ...msg, payload: { action: 'speak', ...msg.payload } })
  }

  _publishResult(msg, result) {
    this.ctx?.bus?.publish(createMessage(MessageType.TOOL_RESULT, this.id, msg.source, {
      correlationId: msg.id,
      result,
    }, { priority: Priority.NORMAL }))
  }
}

export const genesisAgent = {
  id: 'voice',
  name: 'VoiceAgent',
  role: 'worker',
  capabilities: ['voice_asr', 'voice_tts'],
  priority: 2,
  create: () => new VoiceAgent(),
}
