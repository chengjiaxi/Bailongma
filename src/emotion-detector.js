// Emotion Detector - 情绪感知
// 根据用户用词、标点、语速判断情绪，调整回复风格
const EMOTION_PATTERNS = {
  urgent: {
    keywords: ['快点', '马上', '立刻', '赶紧', '急', '快', 'hurry', 'urgent', 'asap', 'now'],
    punctuation: ['!!!', '！！', '!?', '？！'],
    maxLength: 30, // 短消息+感叹号=急
    weight: 1.5
  },
  angry: {
    keywords: ['什么鬼', '搞什么', '有病', '烦', '气死', '无语', '服了', 'wtf', 'damn', 'annoying'],
    punctuation: ['!!!', '！！', '!?', '？！'],
    weight: 2.0
  },
  happy: {
    keywords: ['哈哈', '不错', '太好了', 'nice', 'great', 'awesome', '棒', '开心', '赞', '好耶'],
    punctuation: ['^^', ':)', '😊', '😄', '🎉'],
    weight: 1.2
  },
  confused: {
    keywords: ['什么意思', '不懂', '为什么', '咋回事', 'huh', 'what', 'confused', '不明白', '没懂'],
    punctuation: ['???', '？？', '?', '？'],
    weight: 1.3
  },
  casual: {
    keywords: ['随便', '都行', '无所谓', '嗯', '哦', '好吧', 'whatever', 'meh'],
    punctuation: ['~', '～', '...', '。。'],
    weight: 0.8
  }
}

// 检测情绪
export function detectEmotion(text = '') {
  if (!text) return { emotion: 'neutral', confidence: 0, style: 'normal' }

  const scores = {}
  const textLower = text.toLowerCase()
  const textLen = text.length

  for (const [emotion, pattern] of Object.entries(EMOTION_PATTERNS)) {
    let score = 0

    // 关键词匹配
    for (const kw of pattern.keywords) {
      if (textLower.includes(kw)) {
        score += pattern.weight
      }
    }

    // 标点匹配
    for (const p of pattern.punctuation) {
      if (text.includes(p)) {
        score += pattern.weight * 0.8
      }
    }

    // 短消息+感叹号 → urgent
    if (emotion === 'urgent' && textLen < pattern.maxLength && text.includes('!')) {
      score += pattern.weight
    }

    scores[emotion] = score
  }

  // 找到最高分
  let maxEmotion = 'neutral'
  let maxScore = 0
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      maxEmotion = emotion
    }
  }

  // 置信度
  const confidence = Math.min(maxScore / 3, 1)

  // 映射到回复风格
  const styleMap = {
    urgent: 'concise',      // 简洁直接
    angry: 'calm',          // 冷静安抚
    happy: 'warm',          // 温暖回应
    confused: 'patient',    // 耐心解释
    casual: 'relaxed',      // 轻松随意
    neutral: 'normal'       // 正常
  }

  return {
    emotion: maxEmotion,
    confidence: Math.round(confidence * 100) / 100,
    style: styleMap[maxEmotion],
    scores
  }
}

// 根据情绪生成回复风格提示
export function buildEmotionPrompt(text = '') {
  const result = detectEmotion(text)
  if (result.emotion === 'neutral' || result.confidence < 0.3) return ''

  const styleHints = {
    concise: '用户现在很急，回复要极其简短，直接给答案，不要任何铺垫或解释。',
    calm: '用户情绪不太好，保持冷静平和的语气，不要对抗，就事论事。',
    warm: '用户心情不错，可以适当轻松回应，但不要过度热情。',
    patient: '用户可能没理解，耐心解释清楚，用最简单的说法。',
    relaxed: '用户很随意，回复也可以轻松一些，不用太正式。'
  }

  const hint = styleHints[result.style]
  if (!hint) return ''

  return `\n## Emotion Context\n检测到用户情绪：${result.emotion}（置信度${Math.round(result.confidence * 100)}%）\n建议回复风格：${hint}\n`
}
