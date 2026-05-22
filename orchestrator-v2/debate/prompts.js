// ============================================================
// 辩论提示词模板 -- 移植自 Counsel AI, 适配 orchestrator-v2
// 8 步辩论流程的每一步 prompt
// ============================================================

// Step 1: 问题精确定义 -- Facilitator 引导用户明确问题
function definePrompt(rawInput, history) {
  const hist = history ? `\n## 之前的对话\n${history}` : '';
  return `## 原始问题\n${rawInput}${hist}\n---\n你是一个问题精确定义专家。你的任务是通过对话帮助用户把模糊的问题变成清晰、可辩论的议题。\n\n规则：\n- 如果问题已经清晰明确（有具体情境、决策选项、判断标准），回复"问题已清晰"并给出精确定义。\n- 如果问题模糊，提出 1-2 个问题引导用户补充关键信息。\n- 不要评价问题好坏，只需帮助聚焦。`;
}

// Step 2: 事实追问 -- 每个幕僚从自己视角问事实性问题
function factQuestionPrompt(rawInput, defined, personaSkill, previousQA) {
  const prev = previousQA ? `\n## 之前的问答\n${previousQA}\n\n（注意：不要重复已经问过的问题）` : '';
  return `## 原始问题\n${rawInput}\n\n## 精确定义\n${defined}${prev}\n\n## 你的视角\n${personaSkill}\n\n---\n你只能问事实性问题。规则：\n- 只问可核实的事实性问题（数据、时间、人物、行动、数量）\n- 不要给建议、评价、判断\n- 0-2 个问题，不要贪多\n- 每个问题单独一行\n- 如果信息已足够支持判断，直接回复"没有问题了"`;
}

// Step 3: 表态 -- 每个幕僚从自己视角给出独立判断
function opinionPrompt(rawInput, defined, answers, personaSkill) {
  return `## 原始问题\n${rawInput}\n\n## 精确定义\n${defined}\n\n## 事实信息\n${answers}\n\n## 你的视角\n${personaSkill}\n\n---\n请从你的独特视角出发，给出对这个问题的独立判断和建议。150字以内，直接给结论，不要客套。提供 1-2 个核心论点。`;
}

// Step 4: 冲突维度提炼 -- Facilitator 从表态中提炼 3-6 个冲突维度
function dimensionsPrompt(opinionsText) {
  return `以下是各位幕僚对这个问题的表态：\n\n${opinionsText}\n\n---\n请从这些表态中识别 3-6 个核心冲突维度。\n\n**什么是好的冲突维度**：幕僚们在某个具体问题上存在实质性分歧——比如优先级排序的差异、对风险承受度的不同判断、内部 vs 外部资源的取舍、短期 vs 长期的权衡等。即使结论一致，如果在"因为什么"或"权衡什么"上存在实质分歧，那也是好的冲突维度。\n\n**输出格式**，每个维度：\n## 维度 N\n冲突核心：（一句话概括这个维度上的分歧是什么）\n建议焦点：（这个维度的核心论点是什么）\n\n要求：\n- 3-6 个维度，不要更多\n- 每个维度是全部幕僚共同探讨的问题，不要分配给子小组\n- 维度之间不重叠\n- 只输出维度列表，不要额外说明`;
}

// Step 5: 辩论 -- 幕僚在某维度上发表立场
function debatePrompt(defined, answers, dimension, personaSkill) {
  return `## 精确定义\n${defined}\n\n## 事实信息\n${answers}\n\n## 当前辩论维度\n${dimension}\n\n## 你的视角\n${personaSkill}\n\n---\n请针对「${dimension}」这个维度，阐述你的立场（支持/反对/中间）和核心理由。100字以内，直接说观点和理由。`;
}

// Facilitator 总结某个维度的辩论
function debateFacilitatorPrompt(dimension, allPositions) {
  return `各位幕僚就「${dimension}」维度的辩论发言：\n\n${allPositions}\n\n---\n请总结这个维度的核心冲突：\n**核心矛盾**：（一句话）\n**支持方核心观点**：（一句话）\n**反对方核心观点**：（一句话）`;
}

// Step 6: Secretary 结构化总结
function summaryPrompt(rawInput, defined, answers, debateRecord) {
  return `## 原始问题\n${rawInput}\n\n## 精确定义\n${defined}\n\n## 事实信息\n${answers}\n\n## 辩论记录\n${debateRecord}\n\n---\n请生成一份结构化的辩论总结报告（Markdown 格式）：\n\n# 辩论总结报告\n\n## 问题定义\n（一句话重述精确定义的问题）\n\n## 关键冲突维度\n（每个维度：冲突核心 + 正反方观点 + 分析）\n\n## 共识与分歧\n- **共识点**：\n- **核心分歧**：\n\n## 总体评估\n（综合评估这个决策的复杂度、风险和建议方向）`;
}

// Step 7: 摘果子 -- 评估 + To-Do
function harvestPrompt(summary) {
  return `## 辩论总结报告\n${summary}\n\n---\n请从幕僚们的辩论中提取 actionable 的建议：\n\n## 关键评估\n1. 优点 / 机会（1-2 点）\n2. 盲点 / 风险（1-2 点）\n3. 总体判断：（一句话）\n\n## To-Do 清单\n- [ ] （可执行动作1）\n- [ ] （可执行动作2）\n- [ ] （可执行动作3）\n...\n\n## 值得记住的洞察\n- （来自幕僚的洞见1）\n- （来自幕僚的洞见2）`;
}

module.exports = { definePrompt, factQuestionPrompt, opinionPrompt, dimensionsPrompt, debatePrompt, debateFacilitatorPrompt, summaryPrompt, harvestPrompt };
