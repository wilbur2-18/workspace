---
name: pm-requirement-card
description: Write, polish, compress, and maintain lightweight PM requirement cards after the requirement direction is mostly known. Use when the user says 更新需求卡, 写入文件, 精简, 润色, 转待设计, 转待开发, 改状态, 改命名, or asks to convert existing discussion into a concise card. Handles card structure, naming, status flow, acceptance criteria, and file updates. Do not use for early raw intake or first-principles requirement analysis unless the user explicitly asks to write the card.
---

# PM Requirement Card

Use this skill to turn an agreed or mostly clear product requirement into a concise requirement card, or to maintain existing card files and statuses.

Always read the sibling file `需求卡模板.md` in this skill directory before drafting or editing a card. Use it as the shape reference, but do not copy instruction text into the final card.

## 1. Trigger Boundary

Use this skill for:

- “更新需求卡”
- “写入文件”
- “精简一下”
- “润色这张卡”
- “转待设计 / 转待开发 / 已上线”
- “改状态和命名”
- “把刚才讨论的写进卡里”
- “根据原型调整需求卡”
- “设计做完了，回看需求卡”
- “对齐当前 demo / 原型 / UI”

Do not use this skill for:

- raw “记录个需求” intake unless the user explicitly asks to create a file now
- “第一性原理”, “一起讨论”, “是不是过度设计”
- broad discovery before the requirement direction is known

## 2. Gather Current Facts

Before writing:

1. Read the target card or source material.
2. Read nearby `README.md` or directory guidance when working inside a PM workspace.
3. If prototype/code is relevant, inspect the current materials rather than relying on old paths.
4. If several candidates exist, choose by current path/context; ask only when multiple targets are equally plausible.
5. If one unresolved business decision would materially change scope, state rules, acceptance criteria, or status, use `pm-ask-me` first and ask exactly one focused question before editing.

Distinguish:

1. confirmed fact
2. reasonable inference
3. needs confirmation

Do not present inference as confirmed fact.

## 3. Card Maturity And Status

Use the user's status flow:

| Prefix | Status | Card style |
| --- | --- | --- |
| `1待梳理：` | 待梳理 | background, initial scope, open questions |
| `2待设计：` | 待设计 | requirement scope clear, interaction/UI pending |
| `3待开发：` | 待开发 | rules/design clear enough for development |
| `x 已上线：` | 已上线 | historical record |

When status changes, update:

1. filename prefix
2. internal `**状态**`
3. obvious markdown links or references

## 4. Compression Rules

The requirement card is not a transcript. Keep only what product, design, engineering, and QA need.

1. Prefer 50-80 lines for simple requirements.
2. Delete discussion history, reasoning trails, repeated examples, and alternate plans unless the user asks to keep them.
3. Keep rules near the feature they govern.
4. Do not keep “待确认问题” for settled rules.
5. Use one compact table when it replaces multiple repetitive paragraphs.
6. Prefer practical unified rules over many semantically precise special cases.

## 5. Design Calibration Mode

Use this mode when the interaction/UI design or prototype is already updated and the requirement card must be aligned to the actual design.

This is not a status rollback. It happens between `待设计` and `待开发`:

```text
待设计 -> design/prototype completed -> calibrate requirement card -> 待开发
```

Workflow:

1. Read the existing requirement card.
2. Read or inspect the current prototype, screenshot, demo code, or design notes.
3. Classify prototype facts before editing: product/business rules, interaction/UI design, and prototype/demo implementation details.
4. Put only product/business rules and necessary acceptance criteria into the card. Do not turn button icons, colors, hover behavior, chip sizes, layout slots, mock data, or demo shortcuts into requirement text unless the user explicitly asks.
5. If the prototype conflicts with the card, decide whether it is a real product-rule change or only a prototype/demo limitation. Demo limitations must not override the requirement card.
6. Compare the card against the actual design.
7. Remove requirements that were not implemented in the design.
8. Update confirmed wording, user-visible labels, field names, modal titles, states, and interaction rules only when they materially affect product behavior or acceptance.
9. Replace old assumptions with the actual design result.
10. Remove settled `待确认问题`.
11. If the design is clear enough for engineering, update the card to `待开发`; otherwise keep it `待设计`.

Keep the goal stable, but let product rules follow the final design. Keep detailed UI styling and prototype-only mechanics in design notes or prototype comments, not in the requirement card.

## 6. Preferred Structure

```markdown
# 需求名称

**产品**：
**状态**：
**更新**：
**关联材料**：

---

## 1. 需求背景

## 2. 目标场景

## 3. 本次做什么

## 4. 本次不做什么

## 5. 验收口径
```

Optional:

- `关键决策`: only for settled tradeoffs that affect implementation/design
- `待确认问题`: only for open points that affect scope, implementation, or acceptance

## 7. Writing Rules

1. Write in Chinese when the user works in Chinese.
2. Use product language, not implementation language.
3. Keep cards short but not vague.
4. Do not add speculative features.
5. Do not turn a card into a heavy PRD.
6. Do not use generic acceptance lines like “正常展示”, “符合预期”, or “体验良好”.

## 8. Acceptance Criteria

Acceptance criteria must be verifiable:

1. user sees a specified object/count/status/action
2. user clicks/selects/submits/deletes/etc. and the system changes in a specified way
3. counts/status/results match stated口径
4. edge cases follow stated behavior

## 9. File Editing Boundaries

Default to conversation output unless the user clearly asks to modify files.

When editing:

1. keep changes scoped to the named card/template/skill
2. preserve unrelated user edits
3. discover target files from the filesystem when unclear
4. update both active skill and project backup when maintaining skills and a backup convention exists
