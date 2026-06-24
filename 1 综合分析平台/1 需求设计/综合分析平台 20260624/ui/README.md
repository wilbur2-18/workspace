# Runtime UI Kit (Demo v2.0)

## Purpose

This folder hosts runtime UI assets consumed directly by `demo.html`.

## Files

- `runtime-ui.css`: self-contained runtime UI style entry generated from skill snapshots / legacy DS source.
- `runtime-theme.antdv.js`: runtime theme seed exposed as `DS_FOUNDATION` and `UI_FOUNDATION`.
- `components/*.js`: lightweight runtime component wrappers.

## Source

Current runtime assets are maintained inside this prototype directory.
`runtime-theme.antdv.js` keeps a local copy of the theme seed and exposes `DS_FOUNDATION` for compatibility.

## Rules

- Do not hand-edit generated style sections without syncing the related runtime theme and prototype README.
- Keep compatibility alias `DS_FOUNDATION` until demo-runtime no longer depends on it.
- For CSS tokens, only write v2 canonical names (`--ds-c-*`, `--ds-bg-*`, `--ds-text-*`, `--ds-border-*`, `--ds-fx-*`, `--ds-tone-*`, `--ds-ctx-*`).
- Runtime CSS tokens must use browser-compatible color values. Do not write `color-mix()`, `oklch()`, `lab()`, `lch()`, `rgb(r g b / a)`, or 8-digit hex in runtime styles.
- When a token needs a derived color, calculate it offline from the current token values and write the static result as `rgb(...)` or `rgba(...)`, keeping the visual color as close as possible to the source.
- `runtime-theme.antdv.js` may keep Ant Design theme seed hex values as a JS theme bridge; do not treat those seed values as runtime CSS color-function usage.
- Page-specific visual patching stays in `assets/demo-app.css` or page-local css files.
- Icon buttons target `.ds-icon` (IconPark via `DsIcon`); icon sizing fallbacks also live in `assets/demo-icon.css`.
- `runtime-ui.css` must not contain `@import` or runtime references to `design-system-v3`.
