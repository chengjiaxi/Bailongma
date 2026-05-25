// Error Memory - 错误记忆系统
// 记录每次用户纠正 → 保存到本地文件 → 相似场景自动引用
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

const ERROR_LOG_PATH = './memory/error-log.json'
const MAX_ERRORS = 100

function ensureDir() {
  const dir = './memory'
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function loadErrors() {
  ensureDir()
  if (!existsSync(ERROR_LOG_PATH)) return { errors: [], lastUpdated: Date.now() }
  try {
    return JSON.parse(readFileSync(ERROR_LOG_PATH, 'utf-8'))
  } catch (e) {
    return { errors: [], lastUpdated: Date.now() }
  }
}

function saveErrors(data) {
  data.lastUpdated = Date.now()
  writeFileSync(ERROR_LOG_PATH, JSON.stringify(data, null, 2))
}

// 记录一次错误/纠正
export function recordError({ category, trigger, correctAnswer, context = '', severity = 1 }) {
  const data = loadErrors()

  // 检查是否已有相似错误
  const existing = data.errors.findIndex(e =>
    e.trigger.toLowerCase().includes(trigger.toLowerCase()) ||
    trigger.toLowerCase().includes(e.trigger.toLowerCase())
  )

  if (existing >= 0) {
    data.errors[existing].count = (data.errors[existing].count || 1) + 1
    data.errors[existing].lastSeen = Date.now()
    data.errors[existing].correctAnswer = correctAnswer.slice(0, 500)
  } else {
    data.errors.unshift({
      id: Date.now().toString(36),
      category: category.slice(0, 50),
      trigger: trigger.slice(0, 200),
      correctAnswer: correctAnswer.slice(0, 500),
      context: context.slice(0, 300),
      severity,
      count: 1,
      createdAt: Date.now(),
      lastSeen: Date.now()
    })
    if (data.errors.length > MAX_ERRORS) {
      data.errors = data.errors.slice(0, MAX_ERRORS)
    }
  }

  saveErrors(data)
  console.log(`[ErrorMemory] Recorded: ${trigger.slice(0, 40)}`)
}

// 根据当前输入查找匹配的错误记录
export function findMatchingErrors(input, limit = 3) {
  const data = loadErrors()
  if (data.errors.length === 0) return []

  const inputLower = input.toLowerCase()
  const matches = data.errors
    .map(e => {
      let score = 0
      if (inputLower.includes(e.trigger.toLowerCase())) score += 3
      if (e.category && inputLower.includes(e.category.toLowerCase())) score += 2
      if (e.context && inputLower.includes(e.context.toLowerCase())) score += 1
      return { ...e, score }
    })
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, limit)

  return matches
}

// 生成错误记忆提示词
export function buildErrorMemoryPrompt(input = '') {
  if (!input) {
    const data = loadErrors()
    if (data.errors.length === 0) return ''
    // 返回最近的高频错误作为通用提醒
    const recent = data.errors
      .sort((a, b) => (b.count || 1) - (a.count || 1))
      .slice(0, 3)
    const list = recent.map(e =>
      `- [${e.category}] ${e.trigger} → ${e.correctAnswer.slice(0, 80)}`
    ).join('\n')
    return `\n## Error Memory (Past Corrections)\n以下是我曾经犯过的错误及纠正，避免重复：\n${list}\n`
  }

  const matches = findMatchingErrors(input, 3)
  if (matches.length === 0) return ''

  const list = matches.map(e =>
    `- [${e.category}] 当提到"${e.trigger}"时，正确答案是：${e.correctAnswer.slice(0, 100)}`
  ).join('\n')

  return `\n## Related Error Memory\n以下是与当前话题相关的历史纠正记录，请注意避免重复错误：\n${list}\n`
}

// 获取错误统计
export function getErrorStats() {
  const data = loadErrors()
  return {
    total: data.errors.length,
    categories: [...new Set(data.errors.map(e => e.category))],
    mostCommon: data.errors.sort((a, b) => (b.count || 1) - (a.count || 1)).slice(0, 5)
  }
}
