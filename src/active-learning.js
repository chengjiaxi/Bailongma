// Active Learning - 主动学习机制
// 对话中发现知识盲区 → 主动记录 → 后台补充学习
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

const LEARNING_PATH = './memory/learning-queue.json'
const MAX_QUEUE = 30

function ensureDir() {
  const dir = './memory'
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function loadQueue() {
  ensureDir()
  if (!existsSync(LEARNING_PATH)) return { topics: [], learned: [], lastUpdated: Date.now() }
  try {
    return JSON.parse(readFileSync(LEARNING_PATH, 'utf-8'))
  } catch (e) {
    return { topics: [], learned: [], lastUpdated: Date.now() }
  }
}

function saveQueue(queue) {
  queue.lastUpdated = Date.now()
  writeFileSync(LEARNING_PATH, JSON.stringify(queue, null, 2))
}

// 记录一个待学习的话题
export function addLearningTopic({ topic, context = '', source = 'conversation', priority = 1 }) {
  const queue = loadQueue()

  // 检查是否已存在
  const existing = queue.topics.findIndex(t =>
    t.topic.toLowerCase().includes(topic.toLowerCase()) ||
    topic.toLowerCase().includes(t.topic.toLowerCase())
  )

  if (existing >= 0) {
    queue.topics[existing].count++
    queue.topics[existing].priority = Math.min(priority + 1, 5)
    queue.topics[existing].lastSeen = Date.now()
  } else {
    queue.topics.unshift({
      id: Date.now().toString(36),
      topic: topic.slice(0, 200),
      context: context.slice(0, 300),
      source,
      priority,
      count: 1,
      addedAt: Date.now(),
      lastSeen: Date.now(),
      status: 'pending'
    })
    if (queue.topics.length > MAX_QUEUE) {
      queue.topics = queue.topics.slice(0, MAX_QUEUE)
    }
  }

  saveQueue(queue)
  console.log(`[ActiveLearning] Queued: ${topic.slice(0, 50)}`)
}

// 标记话题已学习
export function markAsLearned(topicId, summary = '') {
  const queue = loadQueue()
  const idx = queue.topics.findIndex(t => t.id === topicId)
  if (idx >= 0) {
    const topic = queue.topics.splice(idx, 1)[0]
    queue.learned.unshift({
      ...topic,
      learnedAt: Date.now(),
      summary: summary.slice(0, 500),
      status: 'learned'
    })
    if (queue.learned.length > 50) {
      queue.learned = queue.learned.slice(0, 50)
    }
    saveQueue(queue)
  }
}

// 获取待学习话题列表
export function getPendingTopics(limit = 5) {
  const queue = loadQueue()
  return queue.topics
    .filter(t => t.status === 'pending')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
}

// 生成主动学习提示词
export function buildActiveLearningPrompt() {
  const pending = getPendingTopics(3)
  if (pending.length === 0) return ''

  const topicList = pending.map(t => {
    const date = new Date(t.addedAt).toLocaleDateString('zh-CN')
    return `- [优先级${t.priority}] ${t.topic}（出现${t.count}次，${date}记录）`
  }).join('\n')

  return `\n## Active Learning Queue\n以下是我识别到的知识盲区，在相关对话中主动补充：\n${topicList}\n当用户提到相关话题时，优先使用已有知识；如果仍然不确定，坦诚说明。\n`
}

// 获取学习统计
export function getLearningStats() {
  const queue = loadQueue()
  return {
    pending: queue.topics.filter(t => t.status === 'pending').length,
    learned: queue.learned.length,
    total: queue.topics.length + queue.learned.length
  }
}
