// Genesis Kernel - Module Loader
// 动态 Agent 模块发现与加载

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AGENTS_DIR = path.resolve(__dirname, '../agents')

/**
 * @typedef {object} AgentModule
 * @property {string} id - Agent 唯一 ID
 * @property {string} name - 人类可读名
 * @property {string} role - 角色
 * @property {string[]} capabilities - 能力标签
 * @property {number} priority - Priority
 * @property {Function} create - () => BaseAgent 实例
 */

/**
 * 扫描 agents/ 目录，收集所有声明了 genesisAgent 元数据的模块
 * @param {object} [opts]
 * @param {string} [opts.agentsDir] - 自定义 Agent 目录
 * @param {string[]} [opts.only] - 仅加载这些 ID
 * @param {string[]} [opts.exclude] - 排除这些 ID
 * @returns {Promise<AgentModule[]>}
 */
export async function discoverAgents(opts = {}) {
  const dir = opts.agentsDir || AGENTS_DIR
  const modules = []

  if (!fs.existsSync(dir)) {
    console.warn(`[ModuleLoader] Agent 目录不存在: ${dir}`)
    return modules
  }

  const files = fs.readdirSync(dir).filter(f =>
    f.endsWith('.js') && !f.startsWith('index') && !f.startsWith('base-') && !f.startsWith('registry') && !f.startsWith('detector')
  )

  for (const file of files) {
    try {
      const filePath = path.join(dir, file)
      const mod = await import(pathToFileURL(filePath).href)

      // 约定：每个 Agent 模块导出 genesisAgent 元数据对象
      const meta = mod.genesisAgent
      if (!meta || !meta.id) continue

      if (opts.only && !opts.only.includes(meta.id)) continue
      if (opts.exclude && opts.exclude.includes(meta.id)) continue

      modules.push({
        id: meta.id,
        name: meta.name || file,
        role: meta.role || 'worker',
        capabilities: meta.capabilities || [],
        priority: meta.priority ?? 2,
        create: meta.create,
        file: filePath,
      })
    } catch (err) {
      console.warn(`[ModuleLoader] 加载 ${file} 失败:`, err.message)
    }
  }

  return modules
}

/**
 * 按 ID 动态加载单个 Agent 模块
 * @param {string} agentId
 * @returns {Promise<AgentModule|null>}
 */
export async function loadAgent(agentId) {
  const all = await discoverAgents({ only: [agentId] })
  return all[0] || null
}

/**
 * 获取已注册的 Agent 模块数量
 */
export async function getAgentCount() {
  const all = await discoverAgents()
  return all.length
}
