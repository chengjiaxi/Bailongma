// Task Continuity - 任务连续性
// 自动保存任务进度 → 重启后可恢复
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'

const TASKS_DIR = './memory/tasks'

function ensureDir() {
  if (!existsSync(TASKS_DIR)) mkdirSync(TASKS_DIR, { recursive: true })
}

function taskPath(id) {
  return `${TASKS_DIR}/${id}.json`
}

// 保存/更新任务
export function saveTask({ id, title, description = '', status = 'in_progress', progress = 0, steps = [], context = '' }) {
  ensureDir()

  const task = {
    id: id || Date.now().toString(36),
    title: title.slice(0, 200),
    description: description.slice(0, 1000),
    status, // pending | in_progress | completed | paused
    progress,
    steps,
    context: context.slice(0, 2000),
    updatedAt: Date.now(),
    createdAt: existsSync(taskPath(id)) ? undefined : Date.now()
  }

  // 如果文件已存在，保留createdAt
  if (existsSync(taskPath(task.id))) {
    try {
      const existing = JSON.parse(readFileSync(taskPath(task.id), 'utf-8'))
      task.createdAt = existing.createdAt
    } catch (e) {}
  }

  writeFileSync(taskPath(task.id), JSON.stringify(task, null, 2))
  console.log(`[TaskContinuity] Saved: ${task.title.slice(0, 30)} (${status})`)
  return task
}

// 加载任务
export function loadTask(id) {
  const path = taskPath(id)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch (e) {
    return null
  }
}

// 获取所有未完成任务
export function getPendingTasks() {
  ensureDir()
  const files = readdirSync(TASKS_DIR).filter(f => f.endsWith('.json'))

  const tasks = files.map(f => {
    try {
      return JSON.parse(readFileSync(`${TASKS_DIR}/${f}`, 'utf-8'))
    } catch (e) {
      return null
    }
  }).filter(t => t && (t.status === 'in_progress' || t.status === 'paused'))

  return tasks.sort((a, b) => b.updatedAt - a.updatedAt)
}

// 完成任务
export function completeTask(id) {
  const task = loadTask(id)
  if (task) {
    task.status = 'completed'
    task.progress = 100
    task.completedAt = Date.now()
    writeFileSync(taskPath(id), JSON.stringify(task, null, 2))
  }
}

// 删除任务
export function deleteTask(id) {
  const path = taskPath(id)
  if (existsSync(path)) {
    unlinkSync(path)
  }
}

// 生成任务连续性提示词
export function buildTaskContinuityPrompt() {
  const pending = getPendingTasks()
  if (pending.length === 0) return ''

  const taskList = pending.slice(0, 3).map(t => {
    const updated = new Date(t.updatedAt).toLocaleDateString('zh-CN')
    const stepInfo = t.steps ? `（${t.steps.filter(s => s.done).length}/${t.steps.length}步完成）` : ''
    return `- [${t.status}] ${t.title} — 进度${t.progress}%${stepInfo}（${updated}更新）\n  ${t.description.slice(0, 80)}`
  }).join('\n\n')

  return `\n## Pending Tasks\n以下是有未完成的任务，如果用户继续相关话题，主动衔接：\n${taskList}\n`
}
