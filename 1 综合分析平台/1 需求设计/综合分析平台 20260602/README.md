# 综合分析平台 20260525 · 静态原型

本目录是综合分析平台当前高保真静态原型。原型为 Vue 3 + ant-design-vue UMD + 内联模板组件，无构建步骤。

## 打开入口

- `demo.html`：原型入口。
- 建议使用本地静态服务器打开；直接用浏览器打开也可用于多数查看场景。
- 本地预览可在本目录运行 `python3 -m http.server 8765 --bind 127.0.0.1`，再访问 `http://127.0.0.1:8765/demo.html`。
- 常用路由：`#project`、`#template`、`#freeaudit?projectId=PRJ-2026-001`。

## 本目录结构

| 路径 | 作用 |
| --- | --- |
| `demo.html` | 页面入口，按顺序加载样式和脚本。 |
| `ui/runtime-ui.css` | 当前原型的运行时 UI 样式入口。 |
| `ui/runtime-theme.antdv.js` | Ant Design Vue 主题种子与兼容导出。 |
| `ui/components/*.js` | 轻量运行时组件封装，按 `demo.html` 顺序加载。 |
| `assets/demo-app.css` | 当前原型的通用业务样式和页面级补丁。 |
| `assets/css/freeaudit/*.css` | 工作台 / 审计助手拆分样式，按 `demo.html` 顺序加载在 `demo-app.css` 之后。 |
| `assets/css/skill-config/skill-config.css` | 技能库与技能配置弹窗样式。 |
| `assets/css/project/`、`assets/css/template/` | 工作台列表与技能库后续业务样式归档目录，当前仅作为业务 CSS 分区预留。 |
| `assets/css/freeaudit/freeaudit.css` | 审计助手样式兼容入口，目前仅保留拆分说明。 |
| `assets/demo-icon.css` | IconPark `DsIcon` 基础样式（旋转、尺寸）。 |
| `assets/generated/` | 运行时样式引用的生成资源，例如一级页面背景图。 |
| `assets/lib/iconpark-subset.js` | IconPark Outline 子集（运行时 SVG 数据）。 |
| `assets/lib/` | 本地依赖资源。 |
| `assets/webfonts/` | 旧字体图标迁移保留资源，不在当前运行链路中直接加载。 |
| `js/core/` | 路由、应用根、启动、全局弹窗等核心运行时。 |
| `js/data/` | 演示数据与兼容全局导出。 |
| `js/project/` | 工作台列表与工作台主入口组件。 |
| `js/template/` | 技能库列表组件与模板工具。 |
| `js/freeaudit/` | 审计助手状态、计算属性、展示片段与交互方法。 |
| `js/skill-config/` | 技能配置文件树、配置校验、项目技能匹配与共享编辑器组件。 |
| `js/` | 仍保留少量跨域组件与兼容入口，后续逐步归入上述目录。 |
| `scripts/` | 本原型的轻量检查脚本。 |

## 维护规则

- 修改页面结构或脚本加载顺序时，同步检查 `demo.html` 和本 README。
- 修改视觉样式前，先读上层 `DESIGN.md` 和 `ui/README.md`，再判断是改 `ui/runtime-ui.css`、`assets/demo-app.css` 还是 `assets/css/` 下对应业务样式。
- 颜色 token 与业务 CSS 要兼容客户侧较旧浏览器：运行时样式不使用 `color-mix()`、`oklch()`、`lab()`、`lch()`、`rgb(r g b / a)` 或 8 位 hex；需要派生色时，先按当前 token 计算为静态 `rgb(...)` / `rgba(...)`，并保留替换前后颜色高度一致。
- 当前目录自持运行，不依赖旧版 `40_原型设计` 路径或 dated baseline 目录。
- 如检查脚本提示外部 reference 缺失，按提示降级处理，不把路径缺失直接视为设计失败。

## 图标（IconPark · 零构建）

- 模板中使用 `<ds-icon name="search" />`，`name` 为**逻辑名**（见 `js/demo-icon-map.js`）。
- 加载顺序见 `demo.html`：`iconpark-subset.js` → `demo-icon-map.js` → `demo-cmp-icon.js`（须在 `demo-app-root.js` 之后）。
- 新增图标：在 `demo-icon-map.js` 增加逻辑名映射 → 在本目录执行 `npm install`（仅首次）→ `node scripts/build-iconpark-subset.mjs` 重新生成子集。
- 旧字体图标库已移除出运行链路；历史文件保留在 `assets/lib/_retired/`。

## 校验

在本目录运行：

```bash
node scripts/check-manifest.js
```

说明：该脚本聚合运行治理检查，含 **无旧字体图标残留**、颜色对齐、OKLCH 范围、裸 hex 和旧 token 扫描。若外部设计 reference 不存在，相关检查会给出跳过说明。

## 关键文件

| 文件 | 说明 |
| --- | --- |
| `js/core/demo-runtime.js` | 路由、全局常量、运行时辅助函数。 |
| `js/core/demo-file-icons.js` | 文件格式分组与 `DsIcon` 逻辑名映射辅助，统一资源 / 结果 / 引用中的文件类型图标。 |
| `js/core/demo-app-root.js` | 应用根实例和顶层壳。 |
| `js/core/demo-cmp-shell.js` | 应用侧边导航壳。 |
| `js/project/demo-cmp-project.js` | 工作台主入口与桥接逻辑。 |
| `js/project/demo-cmp-project-list.js` | 工作台列表。 |
| `js/template/demo-cmp-template-list.js` | 技能库列表、技能卡片、卡片更多菜单与历史版本表等展示组件。 |
| `js/demo-cmp-template.js` | 技能库页面入口、弹窗状态与业务方法。 |
| `js/demo-cmp-freeaudit.js` | 审计助手入口组件组装。 |
| `js/data/demo-mock-data.js` | 演示数据兼容聚合入口，保留旧加载点。 |
| `js/data/project-data.js`、`skill-data.js`、`material-data.js`、`task-result-data.js` | 数据分组定义与兼容导出，按业务面承载现有 mock 数据。 |
| `js/data/demo-data-namespace.js` | `window.DemoData` 聚合命名空间，集中暴露当前演示数据。 |
| `js/freeaudit/freeaudit-state.js` | 审计助手初始状态。 |
| `js/freeaudit/freeaudit-computed.js` | 审计助手计算属性。 |
| `js/freeaudit/freeaudit-watch.js` | 审计助手监听器。 |
| `js/freeaudit/freeaudit-*-actions.js` | 审计助手按任务、资源、结果、技能、对话拆分的交互方法。 |
| `js/freeaudit/freeaudit-actions.js` | 审计助手交互方法合并入口。 |
| `js/freeaudit/freeaudit-panels.js` | 审计助手展示模板片段与轻量展示组件入口，当前承载左栏资源抽屉外壳、右栏任务/结果区外壳、状态筛选条、任务详情行、任务资源行、批量任务子任务行、基本信息面板、元信息行、结果输出编辑区、结果工具条和历史版本区。 |
| `js/skill-config/demo-skill-file-tree.js` | 技能配置文件树工具：节点增删、拖拽、重复路径检查。 |
| `js/skill-config/demo-skill-config.js` | 技能配置共享工具：快照、dirty 判断、保存校验。 |
| `js/skill-config/demo-cmp-skill-config-editor.js` | 技能配置共享编辑器：文件树、审计思路、文件内容和润色入口。 |
| `js/skill-config/demo-project-skill-match.js` | 工作台技能资料匹配、配置校验与匹配动效计时器。 |
| `js/demo-cmp-settings.js` | 系统管理。 |
| `js/demo-icon-map.js` | 图标逻辑名 ↔ IconPark 组件名映射。 |
| `js/demo-cmp-icon.js` | 全局 `DsIcon` 组件注册。 |

## 浏览器 smoke

Chrome headless 在当前机器上可能在输出 DOM 后触发后台 updater 进程，不一定自然退出。进行 `demo.html#project`、`#template`、`#freeaudit?projectId=PRJ-2026-001` smoke 时，使用临时 `--user-data-dir` 抓取关键 DOM 后清理对应临时 profile 进程即可。
