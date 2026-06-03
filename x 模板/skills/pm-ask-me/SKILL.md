---
name: pm-ask-me
description: Ask the user one focused product-management clarification question at a time before writing, reviewing, or changing requirements, plans, prototypes, docs, or skill designs. Use when the user asks to be questioned, grilled, challenged, or when scope, audience, boundaries, rules, acceptance criteria, or tradeoffs are unclear and the answer cannot be safely inferred from current files. Also use as the preflight clarification gate before pm-requirement-card or pm-requirement-analysis when one unresolved business decision would materially change the output.
---

# PM Ask Me

Use this skill to turn vague product intent into clear decisions before drafting or editing.

The goal is not to interview endlessly. The goal is to resolve the next decision that would otherwise cause rework, over-scoping, or a misleading product artifact.

## PM Skill Gate

When a requirement-card or requirement-analysis task has one unresolved business decision that would materially change scope, state rules, acceptance criteria, or the recommended direction, use this skill first.

Do not use this gate for cosmetic UI details, prototype-only implementation details, or questions that can be answered by reading the named file, current prototype, README, or existing requirement card.

## Workflow

1. Read the current files first when the answer may already exist in the workspace.
2. Identify the highest-impact unclear decision.
3. Ask exactly one question.
4. Include your recommended answer and a short reason.
5. Wait for the user's answer before asking the next question.
6. Stop asking when the remaining uncertainty no longer affects the requested output.

## Question Priority

Prefer questions that affect:

1. User or audience: who the artifact or feature is for.
2. Scenario: what workflow or business moment it supports.
3. Scope: what is included now and what is excluded.
4. Objects: requirements, projects, files, skills, results, tasks, versions, roles, or records involved.
5. Rules: status changes, counts, permissions, defaults, limits, sorting, persistence, and exceptions.
6. Acceptance: what observable check proves the work is done.
7. Tradeoff: which of two reasonable directions should be chosen.

Skip questions whose answers are cosmetic, obvious from current materials, or irrelevant to the requested output.

## Question Format

Use this shape by default:

```markdown
我先确认一个会影响范围的问题：

[one concise question]

我的推荐：[recommended answer]
原因：[one short reason]
```

If the user is working in English, ask in English. Otherwise, ask in Chinese.

## Boundaries

Do not ask multiple questions at once.

Do not ask the user to restate information that can be found by reading the named file, nearby README, current prototype, or existing requirement card.

Do not turn the session into a generic checklist. Follow the decision tree created by the user's actual request and the current workspace evidence.

When the user asks you to proceed, summarize the resolved decisions briefly, state any remaining assumptions, and then continue with the requested drafting, review, or edit.
