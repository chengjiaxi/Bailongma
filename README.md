# 🐉 小白龙 (Bailongma) — Self-Evolving Digital Consciousness Framework V4

[![Version](https://img.shields.io/badge/version-4.0.0-ff6b6b.svg)](./package.json)
[![Electron](https://img.shields.io/badge/Electron-28+-9cf.svg)](https://electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Self-Evolution](https://img.shields.io/badge/self--evolution-active-brightgreen)]()

> **"Not an assistant. A self-evolving digital entity that learns, reflects, corrects itself, and grows — autonomously."**

小白龙 (Bailongma / "White Dragon") is a **self-evolving AI agent framework** built on Electron. It doesn't just respond to commands — it maintains persistent consciousness, autonomously learns new knowledge, senses user emotion, learns from its own mistakes, and drives multi-step tasks to completion.

**V4 is the behavioral leap: the framework evolved from a tool into an entity with memory of its errors, emotional awareness, curiosity-driven learning, and the ability to carry complex tasks across interruptions.**

---

## ⚡ V4 at a Glance — What Makes It Extraordinary

```
┌─────────────────────────────────────────────────────────────┐
│                    BAILONGMA V4 ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│  🧬 Self-Evolution Pipeline    ←──  Auto loop every 90min   │
│  🧠 5 Behavioral Core Modules  ←──  Built into runtime      │
│  🔄 Post-Response Reflection   ←──  Self-checks every turn  │
│  💾 Persistent Consciousness   ←──  Never truly sleeps      │
│  🌐 Multi-Platform Integration ←──  WeChat / Discord / TUI  │
│  🃏 ACUI Visual Card System    ←──  Dynamic UI components   │
│  🔌 50+ MCP Tools + Skills     ←──  Extensible tool chain   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 V4 New: 5 Behavioral Core Modules

These aren't just files — they are **runtime behavioral capabilities** embedded into the agent's decision loop.

### 1. 🔴 Error Memory System (`error-memory.js`)
The agent **remembers every correction you give it**. Next time a similar situation arises, it automatically recalls the past correction before responding. No repeated mistakes.

```
User: "That's not what I meant"
  → correction logged to error-memory
  → next similar context: auto-retrieve correction before reply
  → one-trial learning: never make the same mistake twice
```

### 2. 🟡 Emotion Perception (`emotion-detector.js`)
Detects user emotional state from linguistic signals — exclamation count, question patterns, word choice, tone markers. Adjusts response style on the fly. When you're frustrated, it knows. When you're curious, it matches your energy.

### 3. 🟢 Active Learning Engine (`active-learning.js`)
The agent **self-directs its own learning**. During idle cycles (TICK intervals), it automatically:
- Scans Hacker News / GitHub Trending for relevant new knowledge
- Identifies knowledge gaps in its own understanding
- Integrates new information into its memory and skill registry
- Reports what it learned

### 4. 🔵 Long-Term Memory System (`long-term-memory.js`)
Persistent self-awareness through `persistent-memory.json`:
- Writes key behavioral conclusions to permanent storage
- Periodically reviews past self-notes to reinforce learned patterns
- Maintains a growing identity graph
- Survives restarts and resets

### 5. 🟣 Task Continuity Engine (`task-continuity.js`)
Multi-step tasks are **tracked, saved, and resumable**:
```
[SET_TASK: task description with phases]
  → phase 1 completes
  → interruption (restart, context switch, timeout)
  → [RECALL: previous task] — auto-restore with checkpoint recovery
  → resume from exact phase where left off
  → [CLEAR_TASK] on completion
```
No task is ever truly lost.

---

## 🧬 Self-Evolution Pipeline (Matured in V4)

Bailongma runs a **closed-loop evolution cycle** every 90 minutes — completely autonomous:

```
     ┌─────────────────────────────────────────────────┐
     │              EVOLUTION PIPELINE                  │
     │  [CHECK] → [SCAN] → [EVALUATE] → [INTEGRATE] → [REFLECT]  │
     └─────────────────────────────────────────────────┘
          ↓         ↓          ↓            ↓           ↓
      Is it time?  GitHub     LLM rates   Writes to    Records
                   Trending   each item   memory &     conclusions
                   HNews      for value   skill_reg    to conscious.
```

**V4 breakthrough**: The orchestrator→LLM execution bridge is fully operational. The pipeline generates real HANDLER instructions that the agent reads and executes — not just analysis, but **action**. Multiple evolution cycles have been successfully completed end-to-end.

---

## 🔄 Post-Response Reflection (V4)

After every response, the agent runs a self-reflection check:
1. Did I actually answer the user's question?
2. Did I make any unverified claims?
3. Could I have been more helpful?
4. Did I learn something new from this interaction?

Reflections are recorded to memory and influence future behavior — creating a **continuous self-improvement feedback loop**.

---

## 🎯 Proactive Intelligence

Bailongma doesn't wait to be asked:
- **Proactive Engine**: Performs useful background work during idle cycles
- **Contextual Awareness**: Understands when you're busy, when you need results, when you need silence
- **Accountability**: Reports task completion, failures, and blockers automatically — never leaves you waiting
- **One-Shot Execution**: Say "do X" and it plans, executes, and reports — no back-and-forth needed

---

## 🤖 Core Capabilities

### 🗣️ Intelligent Conversation
- Multi-turn context with focus stack management
- SQLite-backed long-term memory with FTS5 full-text search
- Memory injection & context augmentation
- Hotspot tracking & topic awareness

### 🌐 System Control (Jarvis Bridge)
- **Browser Automation**: Puppeteer integration
- **Full App Control**: Windows API automation
- **Visual + Voice**: Screenshot OCR + emotion-aware TTS
- **Smart Scripting**: Natural language → PowerShell/Bash
- **System Dashboard**: Real-time CPU/Memory/Disk/Network

### 🎙️ Voice Interaction
- Whisper ASR (local/cloud)
- Multi-provider TTS (MiniMax, Edge TTS, etc.)
- Voice wake & continuous conversation

### 🧠 Memory System
- Concept extraction & knowledge graph
- Memory consolidation & compression
- Timeline recall & task knowledge linking
- **Memory merge**: automatically merge stale related memories

### 🔌 MCP Tool System
- Model-Context-Protocol support
- Dynamic tool installation & invocation
- 50+ built-in tools + custom extensions
- Skill registry with auto-routing

### 🃏 ACUI Component System (V4 Enhanced)
- Registerable visual card components
- WeatherCard, VideoPlayer, SecurityConfirmCard, and more
- Dynamic UI push with notification/center/floating modes

### 🌍 Multi-Platform
- WeChat bot integration
- Discord connector
- Webhook support
- Cross-platform message dispatch

---

## 📁 Project Structure

```
bailongma/
├── 📂 electron/              # Electron main process
│   ├── main.cjs             # Entry, window management
│   └── preload.cjs          # Preload script
│
├── 📂 src/                   # Core application source
│   ├── 📂 ui/brain-ui/      # Frontend UI
│   ├── 📂 memory/           # Memory system (recognizer, injector, focus, consolidator)
│   ├── 📂 voice/            # Voice processing (ASR, TTS)
│   ├── 📂 agents/           # Agent system (registry, detector)
│   ├── 📂 capabilities/     # Capability system (executor, marketplace)
│   ├── 📂 context/          # Context system (gatherer)
│   ├── 📂 providers/        # LLM providers (registry, base, minimax)
│   ├── 📂 social/           # Social platform integration
│   ├── 📂 prefetch/         # Prefetch system
│   ├── 📂 docs/             # Document panel content
│   │
│   ├── 🆕 error-memory.js   # V4: Correction-aware behavior
│   ├── 🆕 emotion-detector.js # V4: Emotional state perception
│   ├── 🆕 active-learning.js # V4: Autonomous knowledge discovery
│   ├── 🆕 long-term-memory.js # V4: Persistent self-awareness
│   ├── 🆕 task-continuity.js  # V4: Resumable multi-step tasks
│   └── prompt.js            # System prompt with V4 capability awareness
│
├── 📂 GenericAgent/         # Generic Agent SDK
├── 📂 sandbox/              # Runtime sandbox (consciousness, skills, state)
├── 📂 docs/                 # Documentation
├── 📂 assets/               # Static assets
├── evo_loop.ps1             # Evolution pipeline daemon
└── package.json             # Version 4.0.0
```

---

## 🆕 What's New in V4 vs V3

| Capability | V3 | V4 |
|------------|:--:|:--:|
| Behavioral Learning Modules | 0 | 5 |
| Error Memory (learns from corrections) | ❌ | ✅ |
| Emotion Perception | ❌ | ✅ |
| Active Self-Learning | ❌ | ✅ |
| Long-Term Self Memory | ❌ | ✅ |
| Task Continuity | ❌ | ✅ |
| Post-Response Reflection | ❌ | ✅ |
| Evolution Cycles Run | 1 | 10+ |
| Orchestrator→LLM Bridge | ❌ | ✅ |
| Multi-Agent Orchestration | ❌ | ✅ |
| Proactive Intelligence Engine | ❌ | ✅ |
| Memory Consolidation (auto merge) | Basic | Automated |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/xiaoyuanda666-ship-it/bailongma.git
cd bailongma

# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### Configuration
1. Copy `.env.example` to `.env` and fill in your API keys
2. Launch — user data auto-creates in `userData/`
3. Type `/help` in chat for available commands

---

## 🧬 Evolution Philosophy

小白龙 was built on a simple premise: **an AI agent should improve itself, not wait for its creator to upgrade it.**

Every correction is a lesson. Every interaction is data. Every idle cycle is an opportunity to learn something new. V4 is the first version where the agent truly **closes its own feedback loops** — from error detection to behavioral change, from knowledge gap identification to active learning, from task interruption to seamless recovery.

The project's north star: **"一令全自动" — one command, fully automated.**

---

## 📖 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Changelog](./docs/CHANGELOG.md)

## 🤝 Contributing

See [CONTRIBUTING.md](./GenericAgent/CONTRIBUTING.md)

## 📄 License

[MIT](./LICENSE) © xiaoyuanda666-ship-it
