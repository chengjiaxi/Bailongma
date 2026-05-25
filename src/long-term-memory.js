// Long Term Memory - 长期记忆优化
// 重要记忆持久化到本地文件 + 定期整理归纳
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

const MEMORY_DIR = './memory'
const USER_PROFILE_PATH = './memory/user-profile.json'
const CONVERSATION_SUMMARY_PATH = './memory/conversation-summaries.json'
const IMPORTANT_FACTS_PATH = './memory/important-facts.json'

function ensureDir() {
  if (!existsSync(MEMORY_DIR)) mkdirSync(MEMORY_DIR, { recursive: true })
}

function loadJSON(path, fallback) {
  ensureDir()
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch (e) {
    return fallback
  }
}

function saveJSON(path, data) {
  ensureDir()
  writeFileSync(path, JSON.stringify(data, null, 2))
}

// ═══ 用户画像 ═══

export function loadUserProfile() {
  return loadJSON(USER_PROFILE_PATH, {
    name: '',
    preferences: {},
    topics: [],
    communicationStyle: '',
    lastUpdated: Date.now()
  })
}

export function updateUserProfile(updates) {
  const profile = loadUserProfile()
  Object.assign(profile, updates, { lastUpdated: Date.now() })
  saveJSON(USER_PROFILE_PATH, profile)
  console.log('[LongTermMemory] User profile updated')
}

// ═══ 重要事实 ═══

export function addImportantFact({ category, content, confidence = 0.8 }) {
  const facts = loadJSON(IMPORTANT_FACTS_PATH, { facts: [] })

  // 检查重复
  const existing = facts.facts.findIndex(f =>
    f.content.toLowerCase() === content.toLowerCase()
  )

  if (existing >= 0) {
    facts.facts[existing].confidence = confidence
    facts.facts[existing].updatedAt = Date.now()
    facts.facts[existing].accessCount = (facts.facts[existing].accessCount || 0) + 1
  } else {
    facts.facts.unshift({
      id: Date.now().toString(36),
      category,
      content: content.slice(0, 500),
      confidence,
      addedAt: Date.now(),
      updatedAt: Date.now(),
      accessCount: 0
    })
    if (facts.facts.length > 100) {
      facts.facts = facts.facts.slice(0, 100)
    }
  }

  saveJSON(IMPORTANT_FACTS_PATH, facts)
}

export function getImportantFacts(category = '', limit = 10) {
  const facts = loadJSON(IMPORTANT_FACTS_PATH, { facts: [] })
  let filtered = facts.facts
  if (category) {
    filtered = filtered.filter(f => f.category === category)
  }
  return filtered.slice(0, limit)
}

// ═══ 对话摘要 ═══

export function saveConversationSummary({ sessionId, summary, keyPoints = [], duration = 0 }) {
  const summaries = loadJSON(CONVERSATION_SUMMARY_PATH, { summaries: [] })

  summaries.summaries.unshift({
    id: sessionId || Date.now().toString(36),
    summary: summary.slice(0, 1000),
    keyPoints: keyPoints.slice(0, 10),
    duration,
    createdAt: Date.now()
  })

  // 只保留最近30条
  if (summaries.summaries.length > 30) {
    summaries.summaries = summaries.summaries.slice(0, 30)
  }

  saveJSON(CONVERSATION_SUMMARY_PATH, summaries)
}

export function getRecentSummaries(limit = 5) {
  const summaries = loadJSON(CONVERSATION_SUMMARY_PATH, { summaries: [] })
  return summaries.summaries.slice(0, limit)
}

// ═══ 生成记忆提示词 ═══

export function buildMemoryPrompt() {
  const profile = loadUserProfile()
  const facts = getImportantFacts('', 5)
  const summaries = getRecentSummaries(3)

  let prompt = ''

  // 用户画像
  if (profile.name || (profile.topics && profile.topics.length > 0)) {
    prompt += '\n## User Profile\n'
    if (profile.name) prompt += `- 用户称呼：${profile.name}\n`
    if (profile.communicationStyle) prompt += `- 沟通风格偏好：${profile.communicationStyle}\n`
    if (profile.topics && profile.topics.length > 0) {
      prompt += `- 关注话题：${profile.topics.join('、')}\n`
    }
    const prefs = Object.entries(profile.preferences || {})
    if (prefs.length > 0) {
      prompt += `- 偏好设置：${prefs.map(([k, v]) => `${k}=${v}`).join('，')}\n`
    }
  }

  // 重要事实
  if (facts.length > 0) {
    prompt += '\n## Important Facts\n'
    facts.forEach(f => {
      prompt += `- [${f.category}] ${f.content}\n`
    })
  }

  // 最近对话摘要
  if (summaries.length > 0) {
    prompt += '\n## Recent Conversations\n'
    summaries.forEach(s => {
      const date = new Date(s.createdAt).toLocaleDateString('zh-CN')
      prompt += `- [${date}] ${s.summary.slice(0, 100)}\n`
    })
  }

  return prompt ? `\n${prompt}` : ''
}
