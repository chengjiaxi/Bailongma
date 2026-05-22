// ============================================================
// 辩论协调器 — 8 步辩论流程编排
// 移植自 Counsel AI 的结构化辩论方法论
// ============================================================

const { callLLM } = require('./llm.js');
const { DEFAULT_PERSONAS } = require('./personas.js');
const {
  definePrompt, factQuestionPrompt, opinionPrompt,
  dimensionsPrompt, debatePrompt, debateFacilitatorPrompt,
  summaryPrompt, harvestPrompt
} = require('./prompts.js');

// 记录每步的时间和信息
const stepLog = [];
function logStep(step, status, detail) {
  stepLog.push({ step, status, detail, time: new Date().toISOString() });
  console.log(`[辩论] Step ${step}: ${status} - ${detail?.substring(0, 80)}`);
}

// 8 步辩论流程
async function runDebate(input, options = {}) {
  const {
    personas = DEFAULT_PERSONAS,
    userAnswers = {},  // 用户对事实性问题的回答
    model = 'deepseek-chat',
    maxTokens = 2048
  } = options;

  if (!input || !input.trim()) {
    throw new Error("请输入要辩论的问题");
  }

  logStep(0, "start", `输入问题: ${input.substring(0, 60)}...`);
  const state = { rawInput: input.trim(), defined: '', answers: '', opinions: [], dimensions: [], debates: [], summary: '', harvest: '' };

  // === Step 1: 问题精确定义 ===
  logStep(1, "running", "Facilitator 精确定义问题...");
  try {
    const prompt1 = definePrompt(state.rawInput);
    const r1 = await callLLM({ messages: [{ role: 'user', content: prompt1 }], model, maxTokens });
    state.defined = r1.choices?.[0]?.message?.content || prompt1;
    logStep(1, "done", `问题定义: ${state.defined.substring(0, 100)}`);
  } catch(e) {
    logStep(1, "fallback", "LLM 调用失败, 使用原始输入作为问题定义");
    state.defined = state.rawInput;
  }

  // === Step 2: 事实追问 ===
  logStep(2, "running", `${personas.length} 位幕僚轮流问事实性问题...`);
  try {
    const factResults = [];
    for (const p of personas) {
      const prevQA = factResults.map((r, i) => `Q: ${r.question}\nA: ${r.answer || '(未回答)'}`).join('\n');
      const prompt2 = factQuestionPrompt(state.rawInput, state.defined, p.skill, prevQA);
      const r2 = await callLLM({ messages: [{ role: 'user', content: prompt2 }], model, maxTokens: 1024 });
      const question = r2.choices?.[0]?.message?.content || '';
      if (question && !question.includes('没有问题了') && !question.includes('无需')) {
        const answer = userAnswers[p.id] || userAnswers[p.name] || '(待用户回答)';
        factResults.push({ persona: p.name, question, answer });
      }
    }
    state.answers = factResults.map(r => `**${r.persona}** 问：${r.question}\n答：${r.answer}`).join('\n\n');
    logStep(2, "done", `收集了 ${factResults.length} 个事实性问题`);
  } catch(e) {
    logStep(2, "fallback", `事实追问失败: ${e.message}`);
    state.answers = '(未收集事实信息)';
  }

  // === Step 3: 表态（12 路并行）===
  logStep(3, "running", `${personas.length} 路并行表态...`);
  try {
    const opinionPromises = personas.map(p =>
      callLLM({ messages: [{ role: 'user', content: opinionPrompt(state.rawInput, state.defined, state.answers, p.skill) }], model, maxTokens: 1024 })
        .then(r => ({ persona: p.name, emoji: p.emoji, opinion: r.choices?.[0]?.message?.content || '(无回应)' }))
        .catch(e => ({ persona: p.name, emoji: p.emoji, opinion: `(调用失败: ${e.message})` }))
    );
    const opinions = await Promise.all(opinionPromises);
    state.opinions = opinions;
    logStep(3, "done", `全部 ${opinions.length} 位幕僚表态完成`);
  } catch(e) {
    logStep(3, "error", `表态失败: ${e.message}`);
    state.opinions = personas.map(p => ({ persona: p.name, emoji: p.emoji, opinion: '(获取失败)' }));
  }

  // === Step 4: 冲突维度提炼 ===
  logStep(4, "running", "Facilitator 提炼冲突维度...");
  try {
    const opinionsText = state.opinions.map(o => `**${o.emoji} ${o.persona}**：${o.opinion}`).join('\n\n');
    const prompt4 = dimensionsPrompt(opinionsText);
    const r4 = await callLLM({ messages: [{ role: 'user', content: prompt4 }], model, maxTokens });
    const dimText = r4.choices?.[0]?.message?.content || '';
    state.dimensions = dimText.split(/## 维度 \d+/).filter(Boolean).map(d => d.trim()).filter(d => d.length > 0);
    if (state.dimensions.length === 0 && dimText.trim()) {
      state.dimensions = [dimText.trim()];
    }
    logStep(4, "done", `提炼了 ${state.dimensions.length} 个冲突维度`);
  } catch(e) {
    logStep(4, "fallback", `维度提炼失败: ${e.message}`);
    state.dimensions = ['（无法提炼维度）'];
  }

  // === Step 5: 维度辩论 ===
  logStep(5, "running", `对 ${state.dimensions.length} 个维度进行辩论...`);
  try {
    const debateResults = [];
    for (let i = 0; i < state.dimensions.length; i++) {
      const dim = state.dimensions[i];
      const dimShort = dim.substring(0, 60);
      logStep(5, "sub", `维度 ${i+1}/${state.dimensions.length}: ${dimShort}...`);
      const debatePromises = personas.map(p =>
        callLLM({ messages: [{ role: 'user', content: debatePrompt(state.defined, state.answers, dim, p.skill) }], model, maxTokens: 1024 })
          .then(r => ({ persona: p.name, emoji: p.emoji, stance: r.choices?.[0]?.message?.content || '(无回应)' }))
          .catch(e => ({ persona: p.name, emoji: p.emoji, stance: `(调用失败: ${e.message})` }))
      );
      const stances = await Promise.all(debatePromises);
      const allPositions = stances.map(s => `**${s.emoji} ${s.persona}**：${s.stance}`).join('\n');
      const summaryP = debateFacilitatorPrompt(dim, allPositions);
      const rSum = await callLLM({ messages: [{ role: 'user', content: summaryP }], model, maxTokens: 1024 });
      const dimSummary = rSum.choices?.[0]?.message?.content || '(无总结)';
      debateResults.push({ dimension: dim, stances, summary: dimSummary });
    }
    state.debates = debateResults;
    logStep(5, "done", `全部 ${state.dimensions.length} 个维度辩论完成`);
  } catch(e) {
    logStep(5, "error", `辩论失败: ${e.message}`);
    state.debates = state.dimensions.map(dim => ({ dimension: dim, stances: [], summary: '(辩论失败)' }));
  }

  // === Step 6: 结构化总结 ===
  logStep(6, "running", "Secretary 生成结构化总结报告...");
  try {
    const debateRecord = state.debates.map(d => `## ${d.dimension.substring(0, 80)}\n${d.summary}`).join('\n\n');
    const prompt6 = summaryPrompt(state.rawInput, state.defined, state.answers, debateRecord);
    const r6 = await callLLM({ messages: [{ role: 'user', content: prompt6 }], model, maxTokens: 4096 });
    state.summary = r6.choices?.[0]?.message?.content || '(生成失败)';
    logStep(6, "done", "结构化总结完成");
  } catch(e) {
    logStep(6, "error", `总结失败: ${e.message}`);
    state.summary = '（总结生成失败）';
  }

  // === Step 7: 摘果子 ===
  logStep(7, "running", "提取 To-Do 和关键评估...");
  try {
    const prompt7 = harvestPrompt(state.summary);
    const r7 = await callLLM({ messages: [{ role: 'user', content: prompt7 }], model, maxTokens: 2048 });
    state.harvest = r7.choices?.[0]?.message?.content || '(生成失败)';
    logStep(7, "done", "评估和建议提取完成");
  } catch(e) {
    logStep(7, "error", `摘果子失败: ${e.message}`);
    state.harvest = '（评估生成失败）';
  }

  return { state, stepLog };
}

module.exports = { runDebate, stepLog };
