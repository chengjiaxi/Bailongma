const fs = require('fs');
const path = require('path');

const API_KEY = process.env.LLM_API_KEY || 'sk-101284b1159f41f68bc1e565972d89e8';
const BASE_URL = process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1';
const MODEL = process.env.LLM_MODEL || 'deepseek-chat';

// Product context given to every module
const PRODUCT_CONTEXT = `
产品名称：小白龙（BaiLongma）
产品定位：本地私有化部署的AI Agent框架，面向开发者和技术团队
核心能力：
- 多Agent并行编排（236个角色模板，28个分类）
- 5层持久化引擎（SQLite会话+Memory Provider+Background Review+Curator+Context Compressor）
- 自进化闭环：从经验创建技能→使用中改进技能→主动持久化知识→跨会话构建深度理解
- 48个内置工具+9个已安装工具，可扩展
- ACUI可视化卡片推送（WeatherCard等Web Components）
- 全平台消息接入（本地TUI/微信/Discord/飞书/企业微信）
- 隐私优先：所有数据存储在本地，LLM调用可选（DeepSeek/其他）
- 已解除安全沙箱限制

产品形态：
- 底层：AI Agent框架（Node.js）
- 编排层：orchestrator-v2 v3.0
- 交互层：ACUI Web组件
- 部署方式：本地安装（npm/手动）

目标用户：
- 个人开发者（技术极客）
- 中小企业技术团队
- AI初创公司
- 企业内部工具团队

差异化优势：
- 真正本地私有部署（数据不出域）
- 开箱即用的多Agent编排
- 自进化能力（记忆→技能→提升）
- 多平台消息统一接入
`;

const modules = [
  {
    id: 'module_1_market',
    name: '市场调研与竞争格局分析师',
    prompt: `你是资深AI行业市场分析师。请基于以下产品信息，撰写一份完整的市场调研与竞争格局分析报告。

${PRODUCT_CONTEXT}

请覆盖以下内容：
1. **AI Agent市场规模**：全球及中国AI Agent市场规模（当前估值+2026-2028年CAGR预测），细分赛道规模
2. **竞争格局地图**：列出主要竞品（AutoGPT、Dify、Coze、LangChain、CrewAI等）并按以下维度对比：开源/闭源、本地部署能力、多Agent支持、易用性、生态成熟度、定价模式
3. **SWOT分析**：小白龙的优势（Strengths）、劣势（Weaknesses）、机会（Opportunities）、威胁（Threats）
4. **市场空白定位**：哪些细分市场目前无人占据，小白龙最有可能切入的蓝海位置
5. **目标市场规模（TAM/SAM/SOM）**：估算可寻址市场总量

用数据说话，给出具体数字和来源引用格式（即使是大致估算也要有逻辑推导过程）。每个部分不少于300字。`
  },
  {
    id: 'module_2_customer',
    name: '目标客户与定价策略分析师',
    prompt: `你是资深SaaS商业化顾问。请基于以下产品信息，撰写一份完整的目标客户分析与定价策略报告。

${PRODUCT_CONTEXT}

请覆盖以下内容：
1. **ICP（理想客户画像）**：定义3-5个细分客户群体的画像（包括公司规模、行业、技术成熟度、痛点、预算范围、决策链）
2. **客户需求层次分析**：每个群体的核心需求→期望需求→兴奋需求
3. **定价策略建议**：
   - 三层产品漏斗设计（引流层/付费层/企业层）
   - 每个层的功能边界和定价建议（具体数字）
   - 价值锚定策略（对比竞品定价逻辑）
4. **客户生命周期价值估算**：CAC、LTV、LTV/CAC ratio，付费转化率假设
5. **获客优先级**：按"市场吸引力×可进入性"矩阵排序各客户群

每个部分不少于300字。给出具体数字和逻辑推导。`
  },
  {
    id: 'module_3_marketing',
    name: '市场宣传与获客渠道分析师',
    prompt: `你是AI产品增长黑客。请基于以下产品信息，撰写一份完整的市场宣传与获客渠道策略报告。

${PRODUCT_CONTEXT}

请覆盖以下内容：
1. **价值主张提炼**：一句话定位（Elevator Pitch）、3个核心卖点、品牌调性建议
2. **内容营销策略**：
   - 博客/技术文章选题策略（SEO关键词规划）
   - 视频/Demo内容（B站/YouTube）
   - 开源社区运营（GitHub Star增长策略）
   - 技术大会/Meetup演讲策略
3. **渠道策略**：
   - 国内渠道：知乎、掘金、B站、公众号、开源中国、CSDN
   - 海外渠道：Hacker News、Reddit、Dev.to、Twitter/X
   - 每个渠道的预期效果（曝光量/转化率）
4. **冷启动计划**：前90天具体行动计划（每周关键动作）
5. **预算分配**：假设月预算2万元，按渠道分配建议
6. **关键指标（KPIs）**：定义北极星指标和过程指标

每个部分不少于250字。`
  },
  {
    id: 'module_4_financial',
    name: '财务模型分析师',
    prompt: `你是AI初创公司财务分析师。请基于以下产品信息，撰写一份完整的3年财务模型报告。

${PRODUCT_CONTEXT}

请覆盖以下内容：
1. **收入模型**：
   - 三层产品线的收入假设（免费用户数→付费转化率→客单价）
   - 月/年收入预测（36个月）
   - 收入结构比例（免费引流占比/付费占比/企业占比）
2. **成本结构**：
   - 开发成本（假设1人全栈开发）
   - 服务器/基础设施成本
   - 营销成本
   - API调用成本（LLM调用费用）
   - 其他运营成本
3. **盈利预测**：
   - 月度损益表（前36个月）
   - 盈亏平衡点预测（第几个月）
   - 毛利率变化趋势
4. **关键假设与敏感度分析**：
   - 最乐观/基准/最悲观三种场景
   - 哪个变量最敏感（付费转化率/客单价/流失率）
5. **融资建议**：
   - 何时需要融资、融多少
   - 估值逻辑（对比可比公司）

所有数字基于合理假设，标注出假设依据。每个部分不少于300字。`
  },
  {
    id: 'module_5_risk',
    name: '风险分析与进入路径策略师',
    prompt: `你是AI领域风险顾问。请基于以下产品信息，撰写一份完整的风险分析与进入路径策略报告。

${PRODUCT_CONTEXT}

请覆盖以下内容：
1. **市场风险**：大厂进入竞争（字节Coze/百度）、开源替代品威胁、市场教育成本
2. **技术风险**：LLM依赖风险（API成本/模型更换/隐私）、技术债累积、架构扩展性瓶颈
3. **商业风险**：付费意愿低、盈利模式不确定、差异化被抹平
4. **运营风险**：个人/小团队瓶颈、支持成本、社区运营负担
5. **风险矩阵**：按可能性×影响程度排序，标出每个风险的缓解策略
6. **进入路径建议**：
   - 阶段一（0-3个月）：MVP验证期，关键里程碑
   - 阶段二（3-6个月）：早期用户期，关键里程碑
   - 阶段三（6-12个月）：增长期，关键里程碑
   - 阶段四（12-24个月）：规模化期，关键里程碑
7. **退出策略**：如果失败，资产如何变现/转型方向

每个部分不少于250字。`
  }
];

async function callLLM(messages, temperature = 0.7) {
  const url = `${BASE_URL}/chat/completions`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: 4096
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content;
}

async function runModule(mod) {
  console.log(`[${new Date().toLocaleTimeString()}] 开始执行: ${mod.name}`);
  const start = Date.now();
  try {
    const content = await callLLM([
      { role: 'system', content: `你是${mod.name}。请输出结构化Markdown报告。` },
      { role: 'user', content: mod.prompt }
    ]);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[${new Date().toLocaleTimeString()}] ${mod.name} 完成 (${elapsed}s, ${content.length} chars)`);
    return { id: mod.id, name: mod.name, content, ok: true };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`[${new Date().toLocaleTimeString()}] ${mod.name} 失败 (${elapsed}s): ${err.message}`);
    return { id: mod.id, name: mod.name, error: err.message, ok: false };
  }
}

async function main() {
  console.log('=== BaiLongma 商业化全维度分析报告 ===');
  console.log(`模型: ${MODEL}, 时间: ${new Date().toISOString()}`);
  console.log(`产品: 小白龙 (BaiLongma) orchestrator-v2 v3.0`);
  console.log(`模块数: ${modules.length}\n`);

  // Run all 5 modules in parallel
  const results = await Promise.all(modules.map(m => runModule(m)));

  // Check results
  const successes = results.filter(r => r.ok);
  const failures = results.filter(r => !r.ok);
  console.log(`\n完成: ${successes.length}/${modules.length}, 失败: ${failures.length}`);

  if (failures.length > 0) {
    console.log('失败模块:', failures.map(f => `[${f.id}] ${f.name}: ${f.error}`).join('\\n'));
  }

  // Build combined prompt for summarizer
  const combined = successes.map(r =>
    `===== ${r.name} =====\n${r.content}`
  ).join('\n\n');

  console.log('\n===== 汇总Agent开始整合报告 =====');
  const finalReport = await callLLM([
    {
      role: 'system',
      content: '你是顶级商业策略分析师。你要将5个专业领域分析报告整合成一份完整、连贯、可执行的商业化报告。'
    },
    {
      role: 'user',
      content: `以下是对"小白龙（BaiLongma）"AI Agent框架的5个维度分析结果。请将它们整合成一份完整商业化报告。

要求：
1. **结构**：完整报告结构，加入执行摘要（Executive Summary）放在最前面
2. **去重整合**：5份报告中重叠的内容合并，矛盾的观点做权衡判断
3. **可执行性**：每部分结尾给出"核心建议"（Action Item）
4. **格式**：Markdown格式，加目录，适合直接阅读
5. **标题**：用中文，加英文副标题

以下是5个模块的原始输出：

${combined}`
    }
  ], 0.5);

  console.log(`\n汇总报告完成: ${finalReport.length} chars`);

  // Write to file
  const outputPath = path.join(__dirname, 'report.md');
  fs.writeFileSync(outputPath, finalReport, 'utf8');
  console.log(`\n报告已写入: ${outputPath}`);
  console.log(`文件大小: ${fs.statSync(outputPath).size} bytes`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
