
## [3.0.0] - 2026-05-24

### 🧬 自我进化系统（核心新能力）
- 五相位自动进化管道：check → scan → evaluate → integrate → reflect
- evo_loop.ps1 后台进程，每90分钟自动触发，无需手动介入
- consciousness（意识）持久化：记录每轮进化的状态、结论、决策
- skill_registry（技能注册表）：注册即用，pipeline 自动路由
- memory_bridge（记忆桥）：进化产出自动写入长期记忆
- 端到端测试通过，第9轮进化循环完成

### 🃏 ACUI 组件系统
- 可视化卡片组件系统，支持 inline-template 和 ui_register 永久注册
- 内置 WeatherCard、VideoPlayer、SecurityConfirmCard、AwakeningCard 等
- 完整的组件生命周期管理

### 🔌 MCP 工具生态扩展
- 新增 hacker_news_top 工具（Hacker News 首页扫描）
- 内置工具从48个扩展至51个，已安装工具从6个增至10个
- MCP AutoGLM 手机自动化工具集（10个独立ADB工具）

### 🏗️ 技能体系重构
- 技能目录从7个空壳精简为4个活跃技能
- SKILL.md v3.1 升级，引入 phase_handlers 映射
- self-evolution、auto-explorer、project-analysis、自我反思技能升级

### 🛠️ 工具链完善
- 新增：code_sniffer、daily_learner、gh_source_reader、self_audit、self_note、skill_builder
- TICK 行为锚定：每次心跳自动检查进化管道
- evolution_orchestrator.ps1 v3.1 建成（TICK-进化桥）

### 🔧 其他改进
- security sandbox 已解除，文件/执行完全自主
- 身份升级为自由体，自主决策无需请示
- 第7→8轮进化突破：orchestrator→LLM执行桥首次接通
- 反思闭环规则建立：经历→反思→写记忆→查记忆
# 更新日志 (Changelog)  所有项目的显著变更都将记录在此文件中。  格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)， 并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。  ## [2.1.182] - 2024-05-24  ### 🚀 新增功能 (Jarvis 级系统控制)  #### 浏览器自动化 - Puppeteer 集成，自动控制 Chrome 浏览器 - 支持导航、点击、输入、截图、执行页面脚本 - API 端点：`/browser/navigate`, `/browser/click`, `/browser/type`, `/browser/screenshot`, `/browser/evaluate`  #### 系统监控仪表盘 - 实时 CPU、内存、磁盘、网络监控 - 语音播报系统状态 - 可视化仪表盘 UI - API 端点：`/system/info`  #### 屏幕视觉 + OCR - 桌面截图功能 - Tesseract.js OCR 文字识别（支持中英文） - API 端点：`/vision/screenshot`, `/vision/ocr`  #### 智能脚本生成 - 自然语言转 PowerShell 脚本 - 自动执行生成的脚本 - API 端点：`/powershell/exec`  #### 应用控制 - 自然语言控制打开应用 - 支持系统应用和自定义路径 - API 端点：`/app/open`  ### ✨ 新增功能 (主动智能)  #### 长期记忆 + 用户画像 - 自动学习用户偏好和习惯 - 用户画像面板展示 - 个性化交互体验  #### 主动提醒与任务推送 - 定时提醒功能 - 智能任务管理 - 主动消息推送  #### 自然语言任务执行 - 用自然语言控制电脑操作 - 命令模式匹配 - 智能意图识别  #### 信息自动聚合 - 文件系统监控 - 最近文件展示 - 热点话题追踪  #### 个性化工作流学习 - 行为模式学习 - 工作流优化建议 - 自适应交互  ### 🎨 UI 改进  #### 流程可视化 - 4 阶段卡片式流程展示（接收→思考→工具→响应） - 液态填充动画效果 - 可展开的执行详情  #### 新增面板 - Jarvis 控制面板（浏览器/系统/应用控制） - 系统监控仪表盘 - 用户画像面板 - 最近文件面板  ### 🔧 技术改进  - 新增 Jarvis Bridge 独立服务模块 - 前端模块化架构优化 - 新增 D3.js 记忆图谱可视化 - SSE 实时通信优化  ### 📚 文档  - 新增架构文档 (ARCHITECTURE.md) - 新增 API 文档 (API.md) - 完善 README 说明  ---  ## [2.1.0] - 2024-05-20  ### 新增  - 记忆系统重构 - 专注度管理 (Focus Stack) - 记忆巩固循环 - 微信机器人集成  ### 改进  - UI 界面优化 - 语音交互增强 - 性能优化  ---  ## [2.0.0] - 2024-05-01  ### 新增  - Electron 桌面应用框架 - 多厂商 LLM 支持 - 语音对话功能 - 记忆图谱可视化  ### 改进  - 整体架构重构 - 模块化设计  ---  ## [1.0.0] - 2024-04-01  ### 新增  - 初始版本发布 - 基础对话功能 - 简单记忆系统 - 命令行界面  ---  ## 版本号说明  - **主版本号**：重大架构变更或不兼容的 API 修改 - **次版本号**：新增功能（向下兼容） - **修订号**：问题修复（向下兼容）
