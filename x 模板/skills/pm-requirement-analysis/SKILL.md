---
name: pm-requirement-analysis
description: Analyze product requirements before final card writing. Use when the user asks to discuss, use first principles, think from product director/senior PM perspective, evaluate whether a requirement is overdesigned, split or merge requirements, use subagents/multi-role PM analysis, or do 先加法再减法. Produces a more correct and complete requirement direction or discussion card. Do not use for simple intake, final polishing, status/file renaming, or concise card compression.
---

# PM Requirement Analysis

Use this skill when the user wants to **think the requirement through**, not merely record or polish it.

## 1. Trigger Boundary

Use this skill for:

- “第一性原理”
- “一起讨论一下”
- “你怎么看”
- “产品总监角度”
- “是不是过度设计”
- “要不要拆分”
- “先加法再减法”
- “调度子代理 / 多角色梳理”

Do not use this skill for:

- “记录个需求” with only rough input
- “更新需求卡”, “精简一下”, “转待设计/待开发”
- pure file/status maintenance

## 2. Clarification Gate

Before analysis, read the current files when they may answer the question. If one unresolved business decision would materially change the analysis direction, scope, state rules, or acceptance criteria, use `pm-ask-me` first and ask exactly one focused question.

Do not use this gate for cosmetic UI details, prototype-only implementation details, or uncertainty that can be handled as an explicit assumption without changing the recommendation.

## 3. Thinking Principles

1. Start from the real user/workflow problem, not the requested UI control.
2. Separate raw facts, assumptions, and decisions.
3. Do additive thinking first: objects, states, operations, edge cases, affected modules, user costs, implementation costs.
4. Then reduce: remove low-value branches, unnecessary states, special-case wording, and implementation-heavy options.
5. Prefer practical consistency over semantic perfection.
6. The output can be more complete than the final card, but should not become a heavy PRD.

## 4. Multi-Role Mode

When the user explicitly asks for subagents or role simulation:

1. PM A focuses on interaction quality, UI entry points, wording, and user friction.
2. PM B focuses on functional completeness, object/status rules, edge cases, and acceptance.
3. The main agent acts as product director: first principles, consistency, implementation simplicity, and scope reduction.

If subagent tools are unavailable, simulate the same perspectives locally and state that briefly.

## 5. Review Checklist

Before giving conclusions, check:

1. What is the first-principles problem?
2. What must happen for the product to be safe/useful?
3. What can be omitted because it adds interruption, implementation branches, or unclear value?
4. Does the requirement need to be split because interaction models differ?
5. Which parts are ready for `待设计`, and which should remain `待梳理`?

## 6. Output

Prefer a concise analysis memo:

```markdown
**核心判断**

**建议范围**

**建议删除 / 弱化**

**建议补充**

**待确认问题**
```

If the user asks for a card, output a complete but not over-compressed requirement card. Leave final compression and status maintenance to `pm-requirement-card`.
