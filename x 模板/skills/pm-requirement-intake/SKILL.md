---
name: pm-requirement-intake
description: Capture early product requirement signals into a lightweight 待梳理 card while preserving the user's original wording. Use when the user says 记录个需求, 先记一下, 新需求, 先把背景记录下来, 需求还没想清楚, or provides rough notes/screenshots/chat context that need intake, source preservation, current-material lookup, impact/risk collection, and open questions. Do not use when the user asks for first-principles analysis, product-director review, final card polishing, status changes, or file renaming.
---

# PM Requirement Intake

Use this skill when a requirement is just entering the workspace. The goal is to **capture faithfully, collect context, and surface open questions**, not to prematurely decide the final solution.

## 1. Trigger Boundary

Use this skill for:

- “记录个需求”
- “先记一下”
- “有个新需求”
- “先把背景记录下来”
- “这个需求还没想清楚”
- rough WeChat notes, meeting notes, screenshots, or PM-transcribed user feedback

Do not use this skill for:

- “第一性原理”, “一起讨论”, “产品总监评审”, “是不是过度设计”
- “精简”, “更新需求卡”, “转待设计/待开发”, “改状态和命名”
- final card polish after scope is already decided

## 2. Intake Principles

1. Preserve the user's original wording as much as possible.
2. Mark what is raw input, what is your initial PM understanding, and what still needs confirmation.
3. Inspect nearby existing cards, prototype/code, README, or relevant materials before writing when files are available.
4. Collect impact areas and risks broadly, but do not force final decisions.
5. Keep the card lightweight and usually `待梳理`.

## 3. Work Steps

1. Identify the target product/module and likely requirement directory.
2. Read existing related demand cards or prototype snippets if they are relevant.
3. Draft a `待梳理` card with:
   - original requirement / background
   - initial PM understanding
   - target scenario
   - preliminary scope
   - impacted modules / risks
   - pending questions
4. If the user explicitly asks to write/update files, create or update the card. Otherwise, show the draft in chat.

## 4. Output Shape

Use the local card style:

```markdown
# 需求名称

**产品**：
**状态**：待梳理
**更新**：
**关联材料**：

---

## 1. 原始需求 / 背景

## 2. 初步理解

## 3. 目标场景

## 4. 初步范围

## 5. 影响面与风险

## 待确认问题
```

Remove empty sections when the requirement is simple, but keep enough raw context to avoid losing the user's intent.
