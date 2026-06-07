const fs = require("fs");
let code = fs.readFileSync("src/agents/coordinator.js", "utf8");

// Step 1: Remove old bus.on() registrations from onInit
code = code.replace(
  /    \/\/ 注册消息处理器\n([\s\S]*?)this\._taskSeq = 0/m,
  '    // 消息路由已移至 onMessage()\n\n    this._taskSeq = 0'
);

// Step 2: Add onMessage override (insert before onHeartbeat)
const hbIdx = code.indexOf("  async onHeartbeat() {");
const onMessage = `
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

`;
code = code.slice(0, hbIdx) + onMessage + code.slice(hbIdx);

// Step 3: Add _onTaskAssign handler (insert before _onAgentReady)
const arIdx = code.indexOf("  /** @private */\n  _onAgentReady");
const taskAssign = `  /** @private */
  _onTaskAssign(msg) {
    const { taskId, action, params, priority } = msg.payload || {}
    console.log(\`[Coordinator] 收到任务 \${taskId || '(no-id)'}: \${action}\`)

    const target = this._routeTask(action, params || {})
    if (!target) {
      console.log(\`[Coordinator] 无法路由任务 "\${action}"，无匹配 Agent\`)
      this.send(MessageType.TASK_FAILED, msg.from, {
        taskId,
        reason: 'no_matching_agent',
      }, { replyTo: msg.id })
      return
    }

    const realTaskId = taskId || \`task_\${++this._taskSeq}_\${Date.now()}\`
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

    console.log(\`[Coordinator] 任务 \${realTaskId} -> \${target}\`)
  }

`;
code = code.slice(0, arIdx) + taskAssign + code.slice(arIdx);

fs.writeFileSync("src/agents/coordinator.js", code, "utf8");
console.log("OK: patched coordinator.js");
