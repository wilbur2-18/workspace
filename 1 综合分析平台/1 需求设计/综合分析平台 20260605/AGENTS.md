# AGENTS.md

This directory is a high-fidelity static prototype for 综合分析平台. Work from the current files in this folder, not from older dated prototype paths.

## How to Work Here

- Treat `demo.html` as the runtime entry and load-order contract.
- Read `README.md` and `ui/README.md` before changing structure, styles, or checks.
- Keep changes scoped to the current prototype. Do not edit `.pen`, `runtime-theme.antdv.js`, or design-system documentation unless the user explicitly asks.
- Put shared runtime UI changes in `ui/runtime-ui.css`; put page-level and business visual changes in `assets/demo-app.css` or the relevant `assets/css/**` file.
- After style or runtime changes, run `node scripts/check-manifest.js` from this directory unless the change is documentation-only.

## Token-First Style Rules

- Any new or changed visual style must first use existing `--ds-*` tokens or existing component classes. Do not introduce standalone bare values when an equivalent token already exists.
- Do not write bare colors in business CSS. Use existing color, text, border, background, tone, effect, or context tokens. If a new color is genuinely required, stop and explain why it cannot map to an existing token.
- Do not create a new token just to hide a one-off value. Add a token only when the value has repeated use, a stable semantic role, and cannot be represented by an existing token.
- Do not delete or compress primitive/base tokens only because they appear unused. Base tokens such as `--ds-c-*`, `--ds-rgb-*`, `--ds-bg-*`, `--ds-space-*`, `--ds-radius-*`, `--ds-shadow-*`, `--ds-z-*`, and `--ds-control-*` are owned by the foundation layer.
- Component or business aliases may be removed when they only mirror an existing base token and do not add real semantic meaning. Replace their usage with the canonical token first.

## Typography Rules

- 字阶只表达 `font-size + font-weight`，不要把行高或字间距重新 token 化。
- Use the existing canonical type roles instead of freely combining font size and weight:
  - `micro`: `12px / 400`
  - `badge`: `12px / 600`
  - `body`: `14px / 400`
  - `caption`: `14px / 500`
  - `control-lg`: `16px / 500`
  - `nav`: `16px / 600`
  - `card-title`: `18px / 500`
  - `section-title`: `20px / 500`
  - `subheading`: `22px / 600`
- Do not use `13px` or `15px` for text. Text sizes should follow the 2px scale unless the value is a non-text geometry.
- Ordinary buttons, modal footer buttons, form actions, and normal body text should not use `500/600` for emphasis. Use color, size, placement, or border to express hierarchy.
- Panel titles and compact modal section titles should use `control-lg 16/500`; navigation, active tabs, badge/status, key numbers, and strong emphasis may use `600` when the role is explicit.
- Keep local `line-height` only when it is needed for layout, vertical centering, fixed-height controls, tables, or icon alignment. Do not replace line-height values with tokens just to remove numbers.
- Remove non-essential `letter-spacing`. Keep it only for narrow, intentional cases such as uppercase short labels or vertical collapsed rails.

## Layout Value Rules

- Use spacing and radius tokens for stable rhythm: gaps, simple padding, common margins, and component radii should map to existing `--ds-space-*` and `--ds-radius-*` tokens.
- Bare values are acceptable for width, height, min/max constraints, icon geometry, absolute positioning, transform distances, grid calculations, and other one-off layout mechanics.
- If a bare value is kept, it should be because it is geometry or layout behavior, not because a token lookup was skipped.

## Validation Expectations

- `node scripts/check-manifest.js` should pass after code or style changes.
- `scripts/audit-token-coverage.mjs` should keep `should-fix=0`; remaining `review` items are acceptable only when they are layout, line-height, or intentionally strong emphasis cases.
- Runtime CSS must remain Chrome 109 compatible: do not use `color-mix()`, `oklch()`, `lab()`, `lch()`, modern slash RGB syntax, or 8-digit hex in runtime styles.
