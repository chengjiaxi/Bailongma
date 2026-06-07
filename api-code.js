
    // GET /api/consciousness-data - 3D可视化数据
    if (req.method === 'GET' && url.pathname === '/api/consciousness-data') {
      try {
        const memories = await memoryStore?.getRecent?.(20) || []
        const goals = goalSystem?.getActiveGoals?.() || []
        const skills = skillSystem?.getSkills?.() || []
        const emotions = emotionModel?.getCurrentState?.() || {}
        const knowledge = knowledgeGraph?.getEntities?.(20) || []

        jsonResponse(res, 200, {
          memories: memories.map(m => ({
            name: m.title || m.content?.substring(0, 20) || '记忆',
            importance: m.importance || 0.5,
            type: m.type || '一般',
            time: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : '2026-06-06',
            content: m.content?.substring(0, 100) || ''
          })),
          knowledge: knowledge.map(k => ({
            name: k.name || k.id || '知识',
            type: k.type || '概念',
            connections: k.connections?.length || k.relations?.length || Math.floor(Math.random() * 5) + 1
          })),
          goals: goals.map(g => ({
            name: g.name || g.title || '目标',
            progress: g.progress || 0,
            status: g.status || 'active',
            desc: g.description || g.desc || ''
          })),
          skills: skills.map(s => ({
            name: s.name || s.title || '技能',
            proficiency: s.proficiency || s.level || 0.5,
            color: s.color || 0x00d4ff
          })),
          emotions: Object.entries(emotions).map(([name, value]) => ({
            name: name,
            emoji: emotionEmojiMap[name] || '😐',
            color: emotionColorMap[name] || 0x888888,
            value: typeof value === 'number' ? value : 0.5,
            count: Math.floor((typeof value === 'number' ? value : 0.5) * 100),
            dir: Math.random() * 2 - 1
          }))
        })
      } catch (e) {
        jsonResponse(res, 200, getDemoData())
      }
      return
    }