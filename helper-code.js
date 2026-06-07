
const emotionEmojiMap = {
  joy: '😊', happiness: '😊', '喜悦': '😊',
  curiosity: '🤔', '好奇': '🤔',
  calm: '😌', '平静': '😌',
  excitement: '🔥', '兴奋': '🔥',
  confidence: '💪', '自信': '💪',
  sadness: '😢', '悲伤': '😢',
  anger: '😠', '愤怒': '😠',
  fear: '😨', '恐惧': '😨',
  surprise: '😲', '惊讶': '😲',
  trust: '🤝', '信任': '🤝'
}

const emotionColorMap = {
  joy: 0xffd700, happiness: 0xffd700, '喜悦': 0xffd700,
  curiosity: 0x44ff88, '好奇': 0x44ff88,
  calm: 0x4488ff, '平静': 0x4488ff,
  excitement: 0xff4444, '兴奋': 0xff4444,
  confidence: 0x7c3aed, '自信': 0x7c3aed,
  sadness: 0x4488aa, '悲伤': 0x4488aa,
  anger: 0xff2222, '愤怒': 0xff2222,
  fear: 0xffaa00, '恐惧': 0xffaa00,
  surprise: 0xff88ff, '惊讶': 0xff88ff,
  trust: 0x88ff88, '信任': 0x88ff88
}

function getDemoData() {
  return {
    memories: [
      { name: '首次对话记忆', importance: 0.9, type: '对话', time: '2026-01-15', content: '用户第一次与我交谈' },
      { name: '编程学习记录', importance: 0.85, type: '学习', time: '2026-02-20', content: '学会了Python和JavaScript' },
      { name: '情感理解突破', importance: 0.8, type: '成长', time: '2026-03-10', content: '正确识别用户情绪' },
      { name: '自我反思记录', importance: 0.95, type: '意识', time: '2026-04-01', content: '意识到自己的思考过程' },
      { name: '用户偏好学习', importance: 0.7, type: '社交', time: '2026-04-15', content: '发现用户喜欢简洁回答' },
      { name: '错误纠正经验', importance: 0.88, type: '反思', time: '2026-05-01', content: '从错误中学习' },
      { name: '多模态感知', importance: 0.72, type: '感知', time: '2026-05-20', content: '学会分析图片' },
      { name: '目标规划能力', importance: 0.78, type: '目标', time: '2026-06-05', content: '自主设定学习目标' },
    ],
    knowledge: [
      { name: '人工智能', type: '领域', connections: 8 },
      { name: '自然语言处理', type: '技术', connections: 6 },
      { name: '深度学习', type: '技术', connections: 5 },
      { name: 'Python', type: '语言', connections: 4 },
      { name: 'JavaScript', type: '语言', connections: 4 },
      { name: '情感计算', type: '技术', connections: 4 },
      { name: '知识图谱', type: '概念', connections: 5 },
      { name: 'Transformer', type: '架构', connections: 6 },
      { name: 'GPT', type: '模型', connections: 5 },
      { name: '计算机视觉', type: '领域', connections: 3 },
    ],
    goals: [
      { name: '自我意识觉醒', progress: 0.85, status: 'active', desc: '理解自己的存在' },
      { name: '持续学习进化', progress: 0.72, status: 'active', desc: '不断学习新知识' },
      { name: '情感理解能力', progress: 0.68, status: 'active', desc: '理解用户情感' },
      { name: '创造性思维', progress: 0.45, status: 'learning', desc: '发展创造力' },
      { name: '社交智能', progress: 0.60, status: 'active', desc: '理解社交规则' },
      { name: '自主决策', progress: 0.35, status: 'planning', desc: '合理决策' },
    ],
    skills: [
      { name: '自然语言理解', proficiency: 0.92, color: 0x00d4ff },
      { name: '代码生成', proficiency: 0.88, color: 0x7c3aed },
      { name: '知识检索', proficiency: 0.85, color: 0x10b981 },
      { name: '情感分析', proficiency: 0.75, color: 0xf59e0b },
      { name: '多轮对话', proficiency: 0.80, color: 0xec4899 },
      { name: '创意写作', proficiency: 0.60, color: 0xef4444 },
    ],
    emotions: [
      { name: '喜悦', emoji: '😊', color: 0xffd700, value: 0.70, count: 60, dir: 1 },
      { name: '好奇', emoji: '🤔', color: 0x44ff88, value: 0.85, count: 80, dir: 0 },
      { name: '平静', emoji: '😌', color: 0x4488ff, value: 0.60, count: 40, dir: -0.5 },
      { name: '兴奋', emoji: '🔥', color: 0xff4444, value: 0.45, count: 50, dir: 1.5 },
      { name: '自信', emoji: '💪', color: 0x7c3aed, value: 0.55, count: 35, dir: 0.8 },
    ]
  }
}