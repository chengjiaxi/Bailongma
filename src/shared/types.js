// Genesis Shared Types & Constants
// 微内核+Agent Swarm 架构的共享类型定义

// ═══════════════════════════════════════════════════════
// 消息协议
// ═══════════════════════════════════════════════════════

/** @enum {string} 消息类型 */
export const MessageType = {
  // 系统级
  BOOT:           'BOOT',           // 内核启动
  SHUTDOWN:       'SHUTDOWN',       // 内核关闭
  HEARTBEAT:      'HEARTBEAT',      // 心跳

  // Agent 生命周期
  AGENT_SPAWN:    'AGENT_SPAWN',    // Agent诞生
  AGENT_READY:    'AGENT_READY',    // Agent就绪
  AGENT_DIE:      'AGENT_DIE',      // Agent死亡
  AGENT_ERROR:    'AGENT_ERROR',    // Agent异常

  // 任务调度
  TASK_ASSIGN:    'TASK_ASSIGN',    // 分配任务
  TASK_RESULT:    'TASK_RESULT',    // 任务结果
  TASK_FAILED:    'TASK_FAILED',    // 任务失败
  TASK_DELEGATE:  'TASK_DELEGATE',  // 任务委托

  // Agent 间通信
  REQUEST:        'REQUEST',        // 请求
  RESPONSE:       'RESPONSE',       // 响应
  BROADCAST:      'BROADCAST',      // 广播
  DIRECT:         'DIRECT',         // 点对点

  // 自进化
  REFLECT:        'REFLECT',        // 反思
  EVOLVE:         'EVOLVE',         // 进化
  SKILL_LEARN:    'SKILL_LEARN',    // 技能学习

  // 外部输入
  USER_INPUT:     'USER_INPUT',     // 用户输入
  TOOL_RESULT:    'TOOL_RESULT',    // 工具返回

  TOOL_REQUEST:   'TOOL_REQUEST',   // 工具调用请求

  // 上下文管理
  CONTEXT_UPDATE: 'CONTEXT_UPDATE', // 上下文变化
  CONTEXT_REQUEST:'CONTEXT_REQUEST',// 上下文查询

  // 语音
  VOICE_INPUT:    'VOICE_INPUT',    // 语音输入（ASR）
  VOICE_OUTPUT:   'VOICE_OUTPUT',   // 语音输出（TTS）
}

/** @enum {string} Agent 状态 */
export const AgentState = {
  CREATED:   'CREATED',
  STARTING:  'STARTING',
  RUNNING:   'RUNNING',
  PAUSED:    'PAUSED',
  STOPPING:  'STOPPING',
  STOPPED:   'STOPPED',
  ERROR:     'ERROR',
}

/** @enum {string} 进程优先级 */
export const Priority = {
  CRITICAL: 0,   // 内核级
  HIGH:     1,   // 核心Agent
  NORMAL:   2,   // 普通Agent
  LOW:      3,   // 后台任务
  IDLE:     4,   // 空闲时执行
}

// ═══════════════════════════════════════════════════════
// 消息工厂
// ═══════════════════════════════════════════════════════

let _msgSeq = 0

/**
 * 创建标准消息信封
 * @param {string} type - MessageType
 * @param {string} from - 发送者ID
 * @param {string} to - 接收者ID ('*' 表示广播)
 * @param {*} payload - 消息体
 * @param {object} [opts] - 可选参数
 * @returns {Message}
 */
export function createMessage(type, from, to, payload, opts = {}) {
  return {
    id: opts.id || `msg_${++_msgSeq}`,
    type,
    from,
    to,
    payload: payload ?? null,
    ts:      Date.now(),
    replyTo: opts.replyTo || null,
    priority: opts.priority ?? Priority.NORMAL,
    ttl:     opts.ttl ?? 60_000,  // 默认60秒过期
  }
}

// ═══════════════════════════════════════════════════════
// Agent 描述符
// ═══════════════════════════════════════════════════════

/**
 * @typedef {object} AgentDescriptor
 * @property {string} id - 唯一标识
 * @property {string} name - 人类可读名
 * @property {string} role - 角色 (coordinator/tool-user/memory-keeper/strategist/reflecter/executor)
 * @property {string[]} capabilities - 能力标签
 * @property {number} priority - Priority 枚举值
 * @property {object} [config] - Agent私有配置
 * @property {object} [sandbox] - 沙箱限制 { maxMemoryMB, maxCpuPercent, allowedModules }
 */

/**
 * 创建 Agent 描述符
 */
export function createAgentDescriptor(id, name, role, capabilities = [], opts = {}) {
  return {
    id,
    name,
    role,
    capabilities,
    priority: opts.priority ?? Priority.NORMAL,
    config:   opts.config ?? {},
    sandbox:  opts.sandbox ?? null,
  }
}

// ═══════════════════════════════════════════════════════
// 内部事件总线标识
// ═══════════════════════════════════════════════════════

export const KERNEL_ID   = '__kernel__'
export const WILDCARD_ID = '*'

