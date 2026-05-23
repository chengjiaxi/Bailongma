# Skills 系统

遵循 Anthropic Agent Skills 规范改造。
每个技能 = 一个文件夹 + SKILL.md（YAML frontmatter + Markdown 指令）。

## 结构
```
skills/
├── README.md
├── template/
│   └── SKILL.md
├── self-evolution/
│   └── SKILL.md
├── project-analysis/
│   └── SKILL.md
└── ...
```

## SKILL.md 格式
```markdown
---
name: skill-name
description: 简短描述
---
# 指令
## 示例
## 指南
```

## 使用方式
- `skill_builder({action:"list"})` — 列出所有技能
- `skill_builder({action:"create", name:"xxx", description:"xxx", instructions:"..."})` — 创建新技能
- `skill_builder({action:"tree"})` — 查看文件树
