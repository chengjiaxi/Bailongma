---
name: project-analysis
description: 开源项目分析框架——从 README 到源码的深度评估流程
---

# 项目分析技能

系统化分析一个开源项目是否值得集成或借鉴。

## 分析流程

### 阶段一：快速筛选
1. 使用 `daily_learner` 或 `web_search` 发现候选项目
2. 使用 `code_sniffer(url)` 快速获取 README 概览和技术栈
3. 判断：是否与自身能力缺口相关？（TTS、代码执行、知识管理、UI）

### 阶段二：深度分析
1. 使用 `gh_source_reader({repo:"owner/repo", path:"package.json"})` 读依赖
2. 使用 `gh_source_reader({repo:"owner/repo", path:"src/"})` 读源码结构
3. 检查：许可证（MIT/Apache 2.0 最佳）、依赖复杂度、平台兼容性

### 阶段三：集成评估
- **可直接安装**：提供 CLI 或 HTTP API 的工具
- **可借鉴架构**：设计模式、接口规范（如 Skills 系统的 SKILL.md 格式）
- **可调用库**：Node.js 模块可通过 helpers.exec 调用
- **不适合集成**：需要 GPU、特定硬件、完整运行时环境

### 阶段四：执行集成
1. 如果适合 → `install_tool` 构建新能力
2. 如果可借鉴 → `skill_builder` 沉淀为技能
3. 如果是源码级修改 → 直接写文件改 BaiLongma 源码

## 示例
- `code_sniffer("https://github.com/supertone-inc/supertonic")` → TTS 引擎
- `gh_source_reader({repo:"anthropics/skills", path:"template/SKILL.md"})` → 技能模板

## 指南
- 优先 MIT/Apache 2.0 许可证项目
- 避免需要 GPU 或专有硬件的项目
- 优先纯 HTTP API 或 CLI 工具
- 架构模式比代码本身更有长期价值
