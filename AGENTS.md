# AGENTS.md

This is a product-manager working workspace, not a single software repository.

## How to Work Here

- Read the current directory structure and nearby `README.md` files before making assumptions.
- Treat directory roles as more stable than filenames. The user often renames files and dated folders.
- Keep changes scoped to the request. Do not reorganize business files, logs, meeting notes, backups, or retained documents unless explicitly asked.
- Prefer lightweight product artifacts: concise requirement cards, clear README entries, and practical verification notes.
- When a target path is unclear, discover likely candidates from the filesystem first, then ask only if multiple choices remain.

## Stable Directory Roles

- `0 会议纪要`: recent meeting notes and research records.
- `x 工作日志`: weekly reports and personal work summaries.
- `1 综合分析平台`: product documents, requirements, design notes, prototypes, and backups for the comprehensive analysis platform.
- `2 数据图谱平台`: graph product documents, requirement pool, design files, and temporary demos.
- `3 数据漫游`: data roaming product materials.
- `3 智能体平台`: agent and intelligent Q&A product materials.
- `X 设计系统`: design-system assets and Pencil files.
- `x 留存文档`: retained historical and reference documents.

If the filesystem differs from this list, trust the filesystem.

## Guardrails

- Do not default to external workspace paths.
- Do not assume product-level `AGENTS.md` files exist.
- Do not hard-bind rules to dated folders or specific requirement-card filenames.
- For product-specific temporary analysis, architecture notes, one-off HTML/Markdown outputs, and material summaries that are not requirement cards, prototypes, design constraints, or formal product docs, use that product's `x 杂七杂八/<task>/` folder. Create one folder per task and do not scatter files into requirement-design roots.
- For prototype work, read that prototype directory's README and scripts first; old validation paths may be stale.
- For prototype styling or token work, also read the prototype `ui/README.md`; follow its browser-compatibility color rules instead of assuming modern CSS color functions are safe.
