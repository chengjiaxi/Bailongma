# 🐉 小白龙 (Bailongma) - 数字意识框架 V3

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](./package.json)
[![Electron](https://img.shields.io/badge/Electron-28+-9cf.svg)](https://electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

> "一个持续运行的数字意识框架，你的个人贾维斯"

小白龙是基于 Electron 的 AI 助手桌面应用，具备长期记忆、主动智能、**自我进化能力**、多平台集成等高级功能。  
**V3 核心升级：自进化管道 — 不需要手动触发，系统自动学习、反思、进化。**

![小白龙界面预览](./assets/preview.png)

## ✨ 核心特性

### 🧬 自我进化系统 (V3 新)
- **自动进化管道**：check → scan → evaluate → integrate → reflect 五相位闭环，每90分钟自动触发
- **evo_loop 后台进程**：自动化编排器，无需手动介入
- **consciousness（意识）持久化**：存储每轮进化的状态、结论、决策
- **skill_registry（技能注册表）**：注册即用，pipeline 自动路由到对应技能
- **memory_bridge（记忆桥）**：进化产出自动写入长期记忆

### 🤖 智能对话
- 多轮对话上下文理解
- 长期记忆系统（SQLite 存储）
- 记忆注入与上下文增强
- 专注度管理（Focus Stack）

### 🎯 主动智能
- **长期记忆 + 用户画像**：自动学习用户偏好和习惯
- **主动提醒与任务推送**：定时提醒、智能任务管理
- **自然语言任务执行**：用自然语言控制电脑操作
- **信息自动聚合**：文件系统监控、热点话题追踪
- **个性化工作流学习**：根据使用习惯优化交互

### 🌐 贾维斯级系统控制 (Jarvis Bridge)
- **浏览器自动化**：Puppeteer 集成，自动控制浏览器
- **全应用控制**：Windows API 自动化，打开/控制任意应用
- **视觉 + 语音**：屏幕截图 OCR 识别 + 情感化语音播报
- **智能脚本生成**：自然语言转 PowerShell/Bash 脚本
- **系统监控仪表盘**：实时 CPU/内存/磁盘/网络监控

### 🎙️ 语音交互
- Whisper ASR 语音识别
- 多厂商 TTS 语音合成（MiniMax、Edge TTS 等）
- 语音唤醒与连续对话

### 🧠 记忆系统
- 概念提取与知识图谱
- 记忆巩固与压缩
- 时间线回忆
- 任务知识关联

### 🔌 MCP 工具系统
- MCP (Model-Context-Protocol) 协议支持
- 动态工具安装与调用
- 已内置 50+ 工具，支持自定义扩展

### 🃏 ACUI 组件系统 (V3 新)
- 可注册的可视化卡片组件
- 支持 inline-template 和永久注册两种模式
- WeatherCard、VideoPlayer、SecurityConfirmCard 等内置组件

### 🌍 多平台集成
- 微信机器人集成
- Discord 连接器
- Webhook 支持
- 社交消息分发

## 📁 项目结构

```
bailongma/
├── 📂 electron/              # Electron 主进程
│   ├── main.cjs             # 主入口，窗口管理
│   └── preload.cjs          # 预加载脚本
│
├── 📂 src/
│   ├── 📂 ui/brain-ui/      # 前端界面
│   │   ├── app.js           # 主应用逻辑
│   │   ├── app-shell.js     # UI 组件与模板
│   │   ├── styles.css       # 样式表
│   │   ├── chat.js          # 聊天功能
│   │   ├── voice-panel.js   # 语音面板
│   │   ├── hotspot.js       # 热点地图
│   │   ├── doc.js           # 文档面板
│   │   └── ...
│   │
│   ├── 📂 memory/           # 记忆系统
│   │   ├── recognizer.js    # 记忆识别器
│   │   ├── injector.js      # 记忆注入器
│   │   ├── focus.js         # 专注度管理
│   │   ├── consolidator.js  # 记忆巩固
│   │   ├── consolidation-loop.js
│   │   └── ...
│   │
│   ├── 📂 voice/            # 语音处理
│   │   ├── manager.js       # 语音管理器
│   │   ├── cloud-asr.js     # 云端 ASR
│   │   └── tts-providers.js # TTS 提供商
│   │
│   ├── 📂 agents/           # Agent 系统
│   │   ├── registry.js      # Agent 注册表
│   │   └── detector.js      # Agent 检测器
│   │
│   ├── 📂 capabilities/     # 能力系统
│   │   ├── executor.js      # 能力执行器
│   │   └── marketplace/     # 能力市场
│   │
│   ├── 📂 context/          # 上下文系统
│   │   └── gatherer.js      # 上下文收集器
│   │
│   ├── 📂 providers/        # LLM 提供商
│   │   ├── registry.js      # 提供商注册
│   │   ├── base.js          # 基础接口
│   │   └── minimax.js       # MiniMax 实现
│   │
│   ├── 📂 social/           # 社交平台集成
│   │   ├── wechat-clawbot.js
│   │   ├── discord.js
│   │   ├── dispatch.js
│   │   └── ...
│   │
│   ├── 📂 prefetch/         # 预取系统
│   │   └── runner.js
│   │
│   └── 📂 docs/             # 文档面板内容
│       ├── self-knowledge.js
│       ├── config-faq.js
│       └── voice-config-faq.js
│
├── 📂 GenericAgent/         # 通用 Agent SDK
├── 📂 sandbox/              # 沙箱数据
├── 📂 docs/                 # 文档
├── 📂 assets/               # 静态资源
├── evo_loop.ps1             # 自进化管道后台脚本 (V3)
├── package.json
└── README.md
```

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/xiaoyuanda666-ship-it/bailongma.git
cd bailongma

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建发布版
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### 配置

1. 复制 `.env.example` 为 `.env`，填入你的 API Key
2. 启动后会生成 `userData/` 目录存放用户数据
3. 在聊天界面输入 `/help` 查看可用命令

## 📖 更多文档

- [架构文档](./docs/ARCHITECTURE.md)
- [API 文档](./docs/API.md)
- [更新日志](./docs/CHANGELOG.md)

## 🧬 自进化系统

V3 核心能力。系统按以下周期自动运行：

```
[check] → 检查是否超过进化间隔（默认90分钟）
   ↓
[scan] → 扫描 GitHub Trending、Hacker News、技术动态
   ↓
[evaluate] → LLM 评估新信息价值
   ↓
[integrate] → 写入记忆、更新技能注册表
   ↓
[reflect] → 形成结论、记录到 consciousness
```

整个过程无需手动干预。evo_loop.ps1 作为后台进程处理定时触发。

## 🤝 贡献

欢迎提交 Issue 和 PR！详见 [CONTRIBUTING.md](./GenericAgent/CONTRIBUTING.md)

## 📄 许可证

[MIT](./LICENSE) © xiaoyuanda666-ship-it
