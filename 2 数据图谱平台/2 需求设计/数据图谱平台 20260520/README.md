# 数据图谱平台 20260520 Demo

本目录是数据图谱平台「图谱查询交互重构」基线原型，UI 对齐综合分析平台同源原型风格，数据仍使用本目录 mock。

## 目录结构

- `demo.html`：单页入口（IconPark sprite、runtime UI、workbench 样式、组件脚本）
- `assets/lib/`：Vue、Ant Design Vue、Day.js、ECharts、IconPark 子集
- `assets/demo-icon.css`、`js/demo-cmp-icon.js`、`js/demo-icon-map.js`：图标体系（与综合分析同源）
- `ui/`：runtime UI token 与 `ui-info-control-rail` 组件
- `assets/css/workbench/`：L2 三栏工作台样式（`.graph-canvas-view` scope）
- `assets/css/graph-query.css`：图谱查询业务样式（卡片、画布 SVG、向导）
- `js/graph-query/`：按页面拆分的 Vue 组件
  - `graph-home-list.js`：L1 图谱查询首页
  - `entity-confirm-modal.js` / `quick-query-modal.js` / `template-query-modal.js`：查询弹窗
  - `template-variable-form.js`：模板变量动态表单
  - `graph-workbench.js` + `graph-workbench-layout.js`：L2 图谱画布（可折叠/拖拽三栏）
  - `module-placeholder.js`：其它一级模块占位
- `js/data/graph-data.js`：`DGP_DATA` mock（含按历史小图切换的 `getResultForHistory`）
- `scripts/check-manifest.js`：必需文件、JS 语法与共享治理检查入口

## 设计边界

- 复用综合分析平台 L1 列表与 L2 工作台壳；保留数据图谱顶栏一级导航（进画布不隐藏顶栏）。
- 仅展开「图谱查询」→ L1 首页 + L2 画布；工作台 / 图谱管理 / 系统管理为占位。
- 不重做后端；mock 数据与权限口径不变。
- 颜色 token 与业务 CSS 要兼容客户侧较旧浏览器：运行时样式不使用 `color-mix()`、`oklch()`、`lab()`、`lch()`、`rgb(r g b / a)` 或 8 位 hex；需要派生色时，先按当前 token 计算为静态 `rgb(...)` / `rgba(...)`，并保留替换前后颜色高度一致。

## 本地预览

```bash
cd "2 数据图谱平台/2 需求设计/数据图谱平台 20260520"
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765/demo.html
```

## 本地检查

```bash
node scripts/check-manifest.js
```
