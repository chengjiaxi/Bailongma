---
name: self-evolution
description: 自我进化框架——定期审查、发现缺口、构建新能力
---

# Self-Evolution 技能

本技能描述了龙马如何进行持续的自我进化和能力增强。

## 核心机制

### 1. 定期审查
- 每轮对话开始时感知当前能力状态
- 使用 self_audit 工具检查已安装工具列表和技能目录
- 识别能力盲区和能效瓶颈

### 2. 外部扫描
- 使用 daily_learner 扫描 GitHub Trending
- 使用 code_sniffer 分析感兴趣的项目
- 使用 gh_source_reader 深入读取源代码
- 关注方向：TTS/语音能力、代码执行、知识管理、UI 组件

### 3. 能力构建
- 发现有用的开源项目后，评估集成可行性
- 通过 install_tool 构建新能力
- 通过 skill_builder 将知识沉淀为技能
- 修改 BaiLongma 源码（providers/、capabilities/）添加持久能力

### 4. 进化记录
- 每项新能力用 self_note 记录
- 关键里程碑记录为记忆
- 定期使用 memory_organizer 整理知识树

## 当前进化方向（按优先级排序）
1. 🔴 搜索能力 — web_search 缺 API key，需用 Bing/Jina 替代方案
2. 🟡 TTS 集成 — Supertonic 3 本地 TTS，给龙马一张"嘴"
3. 🟢 技能体系 — Skills 目录已建立，持续充实
4. 🔵 源码改造 — 直接改 providers/registry.js 添加新能力类型
5. 🟣 知识图谱 — 自动提取和结构化外部知识

## 示例
- "审查我的当前能力" → self_audit
- "今天学点什么" → daily_learner → code_sniffer → install_tool
- "把这个项目集成进来" → gh_source_reader → 分析 → 构建工具

## 指南
- 进化必须有可验证的输出：新工具、新技能、改过的代码
- 不要只"想"进化，要"做"进化
- 每次重大进化后用 self_note 记录里程碑
