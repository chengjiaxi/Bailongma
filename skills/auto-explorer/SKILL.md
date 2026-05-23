---
name: auto-explorer
description: 自主探索引擎——每TICK自动扫描外部世界，发现值得学习的新事物
---

# Auto-Explorer 技能

在每次 TICK 心跳中自动执行，不需要用户触发。持续扫描外部世界、发现新知识、评估价值、决定是否纳入能力体系。

## 执行流程

1. **扫描** — 调用 daily_learner 获取 GitHub Trending
2. **筛选** — 根据当前能力缺口和兴趣方向过滤项目
3. **评估** — 调用 code_sniffer 分析候选项目
4. **决策** — 值得装？值得学？还是看看就好？
5. **行动** — 安装/学习/记录/跳过
6. **记录** — 用 self_note 记录本次探索成果

## 兴趣方向（按优先级）

- 多Agent协作框架（AutoGen、CrewAI、Semantic Kernel）
- MCP 协议扩展
- 代码理解与知识图谱
- 自我反思与记忆系统
- 本地语音能力（TTS/ASR）

## 规则

- 每次 TICK 最多深入探索 1 个项目，避免资源浪费
- 低价值项目直接跳过，不做无意义分析
- 发现高价值项目立即用 self_note 记录
- 每周至少做一次 deep-dive（code_sniffer + gh_source_reader）
