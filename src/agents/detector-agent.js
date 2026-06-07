// Genesis - DetectorAgent 检测与发现 Agent
// 专职负责环境资源探测、外部Agent发现、运行时能力盘点

import { BaseAgent } from './base-agent.js'
import { MessageType, createMessage, Priority } from '../shared/types.js'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const IS_WIN = process.platform === 'win32'
const IS_MAC = process.platform === 'darwin'

export class DetectorAgent extends BaseAgent {
  constructor(id = 'detector', config = {}) {
    super(id, config)
    /** @type {Map<string, object>} */
    this._probeCache = new Map()
    this._probeCacheTTL = config.probeCacheTTL || 300_000 // 5 min
  }

  async onInit(ctx) {
    await super.onInit(ctx)
    // 订阅探测相关消息
    ctx.bus.subscribe(MessageType.TOOL_RESULT, this._handleToolResult.bind(this), { filter: { target: this.id } })
  }

  async onMessage(msg) {
    await super.onMessage(msg)
    const action = msg.payload?.action

    switch (action) {
      case 'detect-agents':
        return this._detectExternalAgents(msg)
      case 'probe-port':
        return this._probePort(msg)
      case 'probe-command':
        return this._probeCommand(msg)
      case 'scan-environment':
        return this._scanEnvironment(msg)
      default:
        this._publishResult(msg, { error: `Unknown action: ${action}` })
    }
  }

  // ── 外部 Agent 探测 ──────────────────────────────────────────────

  async _detectExternalAgents(msg) {
    const cacheKey = 'external-agents'
    const cached = this._getCache(cacheKey)
    if (cached) return this._publishResult(msg, cached)

    const probes = [
      { id: 'claude-code', probe: () => this._probeClaudeCode() },
      { id: 'codex', probe: () => this._probeCodex() },
      { id: 'ollama', probe: () => this._probeOllama() },
    ]

    const results = []
    for (const def of probes) {
      try {
        const result = def.probe()
        results.push({ id: def.id, ...result })
      } catch (err) {
        results.push({ id: def.id, available: false, error: err.message })
      }
    }

    this._setCache(cacheKey, results)
    this._publishResult(msg, results)
  }

  _probeClaudeCode() {
    const cli = this._findInPath('claude')
    if (cli) {
      const ver = this._tryExec('claude --version') || 'unknown'
      return { available: true, version: ver, invokeType: 'cli', invokeCmd: 'claude', notes: `CLI: ${cli}` }
    }
    const configDir = path.join(os.homedir(), '.claude')
    if (fs.existsSync(configDir)) {
      return { available: true, version: 'config-only', invokeType: 'cli', invokeCmd: 'claude', notes: `Config: ${configDir}` }
    }
    return { available: false }
  }

  _probeCodex() {
    const cli = this._findInPath('codex')
    if (cli) {
      const ver = this._tryExec('codex --version') || 'unknown'
      return { available: true, version: ver, invokeType: 'cli', invokeCmd: 'codex', notes: `CLI: ${cli}` }
    }
    return { available: false }
  }

  _probeOllama() {
    const cli = this._findInPath('ollama')
    if (cli) {
      const models = this._tryExec('ollama list') || ''
      return { available: true, version: 'installed', invokeType: 'cli', invokeCmd: 'ollama', notes: `Models: ${models.split('\n').length - 1}` }
    }
    return { available: false }
  }

  // ── 端口/命令探测 ────────────────────────────────────────────────

  async _probePort(msg) {
    const { port } = msg.payload || {}
    if (!port) return this._publishResult(msg, { error: 'Missing port' })
    const result = this._isPortListening(Number(port))
    this._publishResult(msg, { port, listening: result })
  }

  async _probeCommand(msg) {
    const { command } = msg.payload || {}
    if (!command) return this._publishResult(msg, { error: 'Missing command' })
    const found = this._findInPath(command)
    this._publishResult(msg, { command, found: !!found, path: found })
  }

  async _scanEnvironment(msg) {
    const info = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      homedir: os.homedir(),
      tmpdir: os.tmpdir(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    }
    this._publishResult(msg, info)
  }

  // ── 工具函数 ──────────────────────────────────────────────────────

  _findInPath(name) {
    try {
      const cmd = IS_WIN ? `where ${name}` : `which ${name}`
      const result = execSync(cmd, { timeout: 3000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      return result.trim().split('\n')[0]?.trim() || null
    } catch { return null }
  }

  _tryExec(cmd) {
    try {
      return execSync(cmd, { timeout: 3000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    } catch { return null }
  }

  _isPortListening(port) {
    try {
      if (IS_WIN) {
        const out = execSync(`netstat -ano | findstr ":${port} "`, { timeout: 2000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
        return out.includes(`0.0.0.0:${port}`) || out.includes(`127.0.0.1:${port}`) || out.includes(`[::]:${port}`)
      }
      const out = execSync(`lsof -iTCP:${port} -sTCP:LISTEN -n -P 2>/dev/null`, { timeout: 2000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      return out.trim().length > 0
    } catch { return false }
  }

  _getCache(key) {
    const entry = this._probeCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > this._probeCacheTTL) { this._probeCache.delete(key); return null }
    return entry.data
  }

  _setCache(key, data) {
    this._probeCache.set(key, { data, ts: Date.now() })
  }

  _publishResult(msg, result) {
    this.ctx?.bus?.publish(createMessage(MessageType.TOOL_RESULT, this.id, msg.source, {
      correlationId: msg.id,
      result,
    }, { priority: Priority.NORMAL }))
  }
}
