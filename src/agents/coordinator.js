// Genesis - Coordinator 协调器
// Agent Swarm 的大脑：路由任务、管理优先级、处理冲突、驱动自进化

import { BaseAgent } from './base-agent.js'
import { MessageType, KERNEL_ID, Priority } from '../shared/types.js'

/**
 * @typedef {object} TaskRecord
 * @property {string} id - 任务ID
 * @property {string} action - 任务动作
 * @property {string} assignedTo - 分配给谁
 * @property {string} status - pending|running|done|failed
 * @property {number} createdAt
 * @property {number} [completedAt]
 * @property {*} [result]
 * @property {string} [error]
 */

/**
 * @typedef {object} AgentProfile
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string[]} capabilities
 * @property {boolean} online
 * @property {number} load - 当前负载 0~1
 * @property {number} successRate - 成功率
 * @property {number} avgLatencyMs - 平均延迟
 */

export class Coordinator extends BaseAgent {
  constructor() {
    super('coordinator', {
      maxConcurrentTasks: 10,
      taskTimeoutMs: 60_000,
      routingStrategy: 'capability', // capability | round-robin | least-load
    })

    /** @type {Map<string, AgentProfile>} Agent 注册表 */
    this._agents = new Map()

    /** @type {Map<string, TaskRecord>} 活跃任务 */
    this._tasks = new Map()

    /** @type {Map<string, number>} capability → agentId 路由表 */
    this._routes = new Map()

    /** @type {Array<{pattern: RegExp, handler: string}>} 意图路由规则 */
    this._intentRules = []

    this._taskSeq = 0
    this._conflictQueue = []
  }

  // ═══════════════════════════════════════════════════════
  // 生命周期
  // ═══════════════════════════════════════════════════════

  async onInit(ctx) {
    await super.onInit(ctx)

    // 消息通过 onMessage() 分发，不再用 bus.on() 直接注册
    this._registerDefaultIntentRules()
    console.log('[Coordinator] 协调器就绪')
  }

  async onShutdown() {
    // 取消所有活跃任务
    for (const [id, task] of this._tasks) {
      if (task.status === 'running') {
        task.status = 'cancelled'
      }
    }
    this._agents.clear()
    this._tasks.clear()
    await super.onShutdown()
  }


  async onMessage(msg) {
    await super.onMessage(msg)
    switch (msg.type) {
      case MessageType.AGENT_READY:     return this._onAgentReady(msg)
      case MessageType.AGENT_DIE:       return this._onAgentDie(msg)
      case MessageType.TASK_ASSIGN:     return this._onTaskAssign(msg)
      case MessageType.TASK_RESULT:     return this._onTaskResult(msg)
      case MessageType.TASK_FAILED:     return this._onTaskFailed(msg)
      case MessageType.USER_INPUT:      return this._onUserInput(msg)
      case MessageType.REFLECT:         return this._onReflect(msg)
    }
  }

  async onHeartbeat() {
    // 检查超时任务
    const now = Date.now()
    for (const [id, task] of this._tasks) {
      if (task.status === 'running' && now - task.createdAt > this.config.taskTimeoutMs) {
        task.status = 'timeout'
        this.send(MessageType.TASK_FAILED, KERNEL_ID, {
          taskId: id,
          reason: 'timeout',
          agentId: task.assignedTo,
        })
      }
    }
    // 清理已完成任务（保留最近 100 条）
    this._gcCompletedTasks(100)
  }

  // ═══════════════════════════════════════════════════════
  // Agent 注册与发现
  // ═══════════════════════════════════════════════════════

  /**
   * 注册 Agent 到协调器
   * @param {AgentProfile} profile
   */
  registerAgent(profile) {
    this._agents.set(profile.id, { ...profile, online: true, load: 0, successRate: 1, avgLatencyMs: 0 })

    // 建立 capability → agent 路由
    for (const cap of profile.capabilities) {
      this._routes.set(cap, profile.id)
    }

    this.send(MessageType.AGENT_READY, KERNEL_ID, {
      agentId: profile.id,
      capabilities: profile.capabilities,
    })

    console.log(`[Coordinator] Agent ${profile.name} 已注册，能力: ${profile.capabilities.join(', ')}`)
  }

  /**
   * 获取所有在线 Agent
   * @returns {AgentProfile[]}
   */
  getOnlineAgents() {
    return [...this._agents.values()].filter(a => a.online)
  }

  /**
   * 按能力查找 Agent
   * @param {string} capability
   * @returns {AgentProfile|null}
   */
  findAgentByCapability(capability) {
    const agentId = this._routes.get(capability)
    return agentId ? this._agents.get(agentId) || null : null
  }

  // ═══════════════════════════════════════════════════════
  // 任务路由
  // ═══════════════════════════════════════════════════════

  /**
   * 分配任务给最佳 Agent
   * @param {string} action - 任务动作
   * @param {*} params - 任务参数
   * @param {object} [opts]
   * @returns {TaskRecord}
   */
  assignTask(action, params, opts = {}) {
    const target = opts.to || this._routeTask(action, params)
    if (!target) {
      throw new Error(`[Coordinator] 无法路由任务 "${action}"：无匹配 Agent`)
    }

    const taskId = `task_${++this._taskSeq}_${Date.now()}`
    const task = {
      id: taskId,
      action,
      params,
      assignedTo: target,
      status: 'pending',
      createdAt: Date.now(),
    }

    this._tasks.set(taskId, task)

    // 发送任务
    this.send(MessageType.TASK_ASSIGN, target, {
      taskId,
      action,
      params,
      priority: opts.priority ?? Priority.NORMAL,
    }, { priority: opts.priority ?? Priority.NORMAL })

    task.status = 'running'
    return task
  }

  /**
   * 智能路由：根据 action 和参数选择最佳 Agent
   * @private
   */
  _routeTask(action, params) {
    // 1. 意图规则匹配
    for (const rule of this._intentRules) {
      if (rule.pattern.test(action)) {
        const agent = this._agents.get(rule.handler)
        if (agent?.online) return rule.handler
      }
    }

    // 2. capability 直接匹配
    const byCap = this._routes.get(action)
    if (byCap && this._agents.get(byCap)?.online) return byCap

    // 3. 最小负载策略
    const candidates = [...this._agents.values()].filter(a => a.online)
    if (candidates.length === 0) return null

    candidates.sort((a, b) => {
      // 优先级：成功率 > 负载 > 延迟
      if (Math.abs(a.successRate - b.successRate) > 0.1) return b.successRate - a.successRate
      if (Math.abs(a.load - b.load) > 0.2) return a.load - b.load
      return a.avgLatencyMs - b.avgLatencyMs
    })

    return candidates[0].id
  }

  /**
   * 注册意图路由规则
   * @param {RegExp} pattern
   * @param {string} agentId
   */
  addIntentRule(pattern, agentId) {
    this._intentRules.push({ pattern, handler: agentId })
  }

  /**
   * 注册默认意图规则
   * @private
   */
  _registerDefaultIntentRules() {
    // 可由子类或外部覆盖
  }

  // ═══════════════════════════════════════════════════════
  // 消息处理器
  // ═══════════════════════════════════════════════════════

  /** @private */
  _onTaskAssign(msg) {
    const { taskId, action, params, priority } = msg.payload || {}
    console.log(`[Coordinator] �յ����� ${taskId || '(no-id)'}: ${action}`)

    const target = this._routeTask(action, params || {})
    if (!target) {
      console.log(`[Coordinator] �޷�·������ "${action}"����ƥ�� Agent`)
      this.send(MessageType.TASK_FAILED, msg.from, {
        taskId,
        reason: 'no_matching_agent',
      }, { replyTo: msg.id })
      return
    }

    const realTaskId = taskId || `task_${++this._taskSeq}_${Date.now()}`
    const task = {
      id: realTaskId,
      action,
      params: params || {},
      assignedTo: target,
      status: 'running',
      createdAt: Date.now(),
      requesterId: msg.from,
    }
    this._tasks.set(realTaskId, task)

    this.send(MessageType.TASK_ASSIGN, target, {
      taskId: realTaskId,
      action,
      params: params || {},
      priority: priority ?? Priority.NORMAL,
    })

    console.log(`[Coordinator] ���� ${realTaskId} -> ${target}`)
  }

  /** @private */
  _onAgentReady(msg) {
    const { agentId, capabilities } = msg.payload
    const profile = this._agents.get(agentId)
    if (profile) {
      profile.online = true
      for (const cap of capabilities) {
        this._routes.set(cap, agentId)
      }
    }
  }

  /** @private */
  _onAgentDie(msg) {
    const { agentId } = msg.payload
    const profile = this._agents.get(agentId)
    if (profile) {
      profile.online = false
      // 重新路由该 Agent 的活跃任务
      for (const [id, task] of this._tasks) {
        if (task.assignedTo === agentId && task.status === 'running') {
          task.status = 'rerouting'
          const newTarget = this._routeTask(task.action, task.params)
          if (newTarget) {
            task.assignedTo = newTarget
            task.status = 'running'
            this.send(MessageType.TASK_ASSIGN, newTarget, {
              taskId: id,
              action: task.action,
              params: task.params,
            })
          } else {
            task.status = 'failed'
            task.error = 'no available agent after reroute'
          }
        }
      }
    }
  }

  /** @private */
  _onTaskResult(msg) {
    const { taskId, result } = msg.payload
    const task = this._tasks.get(taskId)
    if (task) {
      task.status = 'done'
      task.result = result
      task.completedAt = Date.now()

      // 更新 Agent 统计
      const profile = this._agents.get(task.assignedTo)
      if (profile) {
        const latency = task.completedAt - task.createdAt
        profile.avgLatencyMs = (profile.avgLatencyMs * 0.8) + (latency * 0.2)
        profile.successRate = (profile.successRate * 0.9) + (1 * 0.1)
        profile.load = Math.max(0, profile.load - 0.1)
      }

      // 转发结果给请求方
      if (task.requesterId && task.requesterId !== this.id) {
        this.send(MessageType.TASK_RESULT, task.requesterId, {
          taskId,
          result,
        }, { replyTo: msg.id })
        console.log(`[Coordinator] 结果已转发 -> ${task.requesterId}`)
      }
    }
  }

  /** @private */
  _onTaskFailed(msg) {
    const { taskId, reason } = msg.payload
    const task = this._tasks.get(taskId)
    if (task) {
      task.status = 'failed'
      task.error = reason
      task.completedAt = Date.now()

      // 更新 Agent 统计
      const profile = this._agents.get(task.assignedTo)
      if (profile) {
        profile.successRate = (profile.successRate * 0.9) + (0 * 0.1)
        profile.load = Math.max(0, profile.load - 0.1)
      }

      // 转发失败给请求方
      if (task.requesterId && task.requesterId !== this.id) {
        this.send(MessageType.TASK_FAILED, task.requesterId, {
          taskId,
          reason,
        }, { replyTo: msg.id })
        console.log(`[Coordinator] 失败已转发 -> ${task.requesterId}`)
      }
    }
  }

  /** @private */
  _onUserInput(msg) {
    const { text, intent } = msg.payload
    // 尝试路由用户输入
    const action = intent || text
    try {
      this.assignTask(action, { text, intent })
    } catch (err) {
      // 无匹配 Agent，广播给所有 Agent 让它们竞标
      this.broadcast(MessageType.BROADCAST, {
        type: 'user_input_unrouted',
        text,
        intent,
      })
    }
  }

  /** @private */
  _onReflect(msg) {
    // 自进化钩子：分析任务历史，优化路由
    const stats = this._getTaskStats()
    if (stats.totalTasks > 50 && stats.failureRate > 0.3) {
      this.send(MessageType.EVOLVE, KERNEL_ID, {
        reason: 'high_failure_rate',
        stats,
      })
    }
  }

  // ═══════════════════════════════════════════════════════
  // 统计与维护
  // ═══════════════════════════════════════════════════════

  /** @private */
  _getTaskStats() {
    const tasks = [...this._tasks.values()]
    const done = tasks.filter(t => t.status === 'done')
    const failed = tasks.filter(t => t.status === 'failed')
    return {
      totalTasks: tasks.length,
      completed: done.length,
      failed: failed.length,
      running: tasks.filter(t => t.status === 'running').length,
      failureRate: tasks.length > 0 ? failed.length / tasks.length : 0,
      avgLatencyMs: done.length > 0
        ? done.reduce((s, t) => s + (t.completedAt - t.createdAt), 0) / done.length
        : 0,
    }
  }

  /** @private */
  _gcCompletedTasks(maxKeep) {
    const completed = [...this._tasks.entries()]
      .filter(([, t]) => ['done', 'failed', 'timeout', 'cancelled'].includes(t.status))
      .sort(([, a], [, b]) => (b.completedAt || 0) - (a.completedAt || 0))

    if (completed.length > maxKeep) {
      for (const [id] of completed.slice(maxKeep)) {
        this._tasks.delete(id)
      }
    }
  }

  /**
   * 获取协调器状态
   */
  getStats() {
    const base = super.getStats()
    return {
      ...base,
      agents: this._agents.size,
      onlineAgents: this.getOnlineAgents().length,
      tasks: this._getTaskStats(),
      routes: this._routes.size,
      intentRules: this._intentRules.length,
    }
  }
}

export const genesisAgent = {
  id: 'coordinator',
  name: 'Coordinator',
  role: 'coordinator',
  capabilities: ['routing', 'delegation', 'lifecycle'],
  priority: 0,
  create: () => new Coordinator(),
}
