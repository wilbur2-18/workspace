import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);

const slides = [
  {
    kicker: "AI Native Audit System",
    title: "人工智能 + 审计综合解决方案产品介绍",
    subtitle: "AI 原生审计技术体系与产品能力交流",
    type: "cover",
    keywords: ["数据理解", "图谱推理", "智能编排", "作业闭环"],
  },
  {
    kicker: "Core Question",
    title: "AI + 审计真正要解决的是完整作业链路",
    subtitle: "不是增加问答入口，而是让 AI 进入从数据到任务的闭环。",
    type: "chain",
    body: [
      ["数据理解", "理解字段、资料、实体和业务语义"],
      ["关系发现", "发现人、企、单位、项目、资金、票据之间的关系"],
      ["任务执行", "围绕审计目标执行探查、抽取、比对、核验"],
      ["证据复核", "结论回到原始资料、数据、图谱路径和任务记录"],
      ["能力沉淀", "将核查路径和判断规则沉淀为可复用能力"],
    ],
  },
  {
    kicker: "3 + 1 Product System",
    title: "3+1 AI 原生审计技术底座",
    subtitle: "三类底座能力平台，加一个综合作业平台，形成审计作业承接层。",
    type: "platforms",
    body: [
      ["智能体平台", "AI 能力生产与编排底座", "模型、知识库、数据库连接、MCP 工具、智能体编排"],
      ["数据治理平台", "复杂数据可用性治理底座", "数据探查、数据漫游、结构化抽取、实体识别"],
      ["数据图谱平台", "关系资产化与线索挖掘底座", "本体建模、关系穿透、路径追溯、AI 推理"],
      ["综合分析平台", "审计任务执行与能力沉淀平台", "项目作业、报告生成、技能复用、成果沉淀"],
    ],
  },
  {
    kicker: "Graph Intelligence",
    title: "数据图谱平台：关系建模与线索挖掘",
    subtitle: "审计线索隐藏在人、企业、单位、项目、资金、票据之间的多跳关系中。",
    type: "graph",
    body: [
      ["本体建模", "将人员、企业、单位、项目、资金、合同、发票定义为可计算实体"],
      ["多源映射", "将数据库、治理结果、文档抽取结果持续写入图谱"],
      ["关系穿透", "围绕股权、任职、资金、项目、票据链路做多跳穿透"],
      ["AI 推理", "基于问图、关系语义定义和推理模板发现隐含关系"],
    ],
  },
  {
    kicker: "Core Value",
    title: "从数据理解、关系发现、任务执行到能力沉淀",
    subtitle: "真正的壁垒不在单个功能，而在围绕审计场景持续打磨形成的 AI 原生能力链路。",
    type: "value",
    body: [
      ["复杂数据治理壁垒", "覆盖结构化库表、非结构化资料、历史变更文本、长文档、扫描件和复杂表格"],
      ["AI + 图谱融合壁垒", "本体建模、多源入图、路径分析、关系推理和批量任务一体化"],
      ["智能体工程化壁垒", "统一纳管模型、知识、数据库、工具和权限，支撑任务型智能体"],
      ["审计作业闭环壁垒", "从数据理解、关系发现、任务执行到证据复核和能力沉淀"],
    ],
  },
];

const directions = [
  {
    id: "01-control-room",
    label: "方向一｜审计指挥室",
    logic: "面向领导汇报与技术实力展示，采用深色控制台、网格、链路和状态信号，强调系统工程感。",
    accent: "#E7B44C",
    htmlClass: "control",
  },
  {
    id: "02-boardroom-report",
    label: "方向二｜董事会白皮书",
    logic: "面向正式交流与方案宣讲，采用白皮书式大留白、强标题、红黑分层，强调可信、克制和权威。",
    accent: "#B72D2D",
    htmlClass: "boardroom",
  },
  {
    id: "03-graph-atlas",
    label: "方向三｜关系图谱图册",
    logic: "面向产品能力展示，采用图册式信息层、网络拓扑和分区地图，强调数据关系、穿透分析和平台闭环。",
    accent: "#1F8A70",
    htmlClass: "atlas",
  },
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderSlide(slide, index, direction) {
  const typeRenderer = {
    cover: renderCover,
    chain: renderChain,
    platforms: renderPlatforms,
    graph: renderGraph,
    value: renderValue,
  }[slide.type];
  return `
    <section class="slide slide-${slide.type}" data-slide="${index + 1}">
      <div class="slide-meta">
        <span>${esc(slide.kicker)}</span>
        <span>${String(index + 1).padStart(2, "0")}</span>
      </div>
      ${typeRenderer(slide, direction)}
    </section>`;
}

function renderCover(slide, direction) {
  return `
    <div class="cover-grid">
      <div class="cover-copy">
        <p class="eyebrow">${esc(direction.label)}</p>
        <h1>${esc(slide.title)}</h1>
        <p class="subtitle">${esc(slide.subtitle)}</p>
        <div class="keyword-row">
          ${slide.keywords.map((item) => `<span>${esc(item)}</span>`).join("")}
        </div>
      </div>
      <div class="hero-system" aria-hidden="true">
        <div class="orbital">
          <span class="node n1"></span>
          <span class="node n2"></span>
          <span class="node n3"></span>
          <span class="node n4"></span>
          <span class="core">AI</span>
        </div>
        <div class="signal-strip">
          <b>Data</b><b>Graph</b><b>Agent</b><b>Audit</b>
        </div>
      </div>
    </div>`;
}

function renderChain(slide) {
  return `
    <div class="layout-two">
      <div class="copy-block">
        <h2>${esc(slide.title)}</h2>
        <p>${esc(slide.subtitle)}</p>
      </div>
      <div class="chain-panel">
        ${slide.body
          .map(
            ([title, desc], i) => `
          <div class="chain-step">
            <span class="step-index">${String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>${esc(title)}</h3>
              <p>${esc(desc)}</p>
            </div>
          </div>`
          )
          .join("")}
      </div>
    </div>`;
}

function renderPlatforms(slide) {
  return `
    <div class="stacked-head">
      <h2>${esc(slide.title)}</h2>
      <p>${esc(slide.subtitle)}</p>
    </div>
    <div class="platform-matrix">
      ${slide.body
        .map(
          ([name, role, desc], i) => `
        <article class="platform-card p${i + 1}">
          <span class="platform-number">${i === 3 ? "1" : "3"}</span>
          <h3>${esc(name)}</h3>
          <h4>${esc(role)}</h4>
          <p>${esc(desc)}</p>
        </article>`
        )
        .join("")}
    </div>`;
}

function renderGraph(slide) {
  const nodes = ["人员", "企业", "单位", "项目", "资金", "合同", "发票", "线索"];
  return `
    <div class="layout-two graph-layout">
      <div class="copy-block">
        <h2>${esc(slide.title)}</h2>
        <p>${esc(slide.subtitle)}</p>
        <div class="mini-list">
          ${slide.body.map(([title, desc]) => `<div><b>${esc(title)}</b><span>${esc(desc)}</span></div>`).join("")}
        </div>
      </div>
      <div class="network-panel" aria-hidden="true">
        ${nodes.map((node, i) => `<span class="graph-node node-${i}">${esc(node)}</span>`).join("")}
        <svg viewBox="0 0 760 560" preserveAspectRatio="none">
          <path d="M120 90 C320 40 420 120 600 70" />
          <path d="M120 90 C180 210 330 260 410 420" />
          <path d="M600 70 C620 230 540 330 650 470" />
          <path d="M210 350 C330 170 510 210 650 470" />
          <path d="M410 420 C490 310 530 220 600 70" />
          <path d="M300 210 C390 130 500 130 560 250" />
          <path d="M210 350 C300 430 470 500 650 470" />
        </svg>
      </div>
    </div>`;
}

function renderValue(slide) {
  return `
    <div class="stacked-head value-head">
      <h2>${esc(slide.title)}</h2>
      <p>${esc(slide.subtitle)}</p>
    </div>
    <div class="value-grid">
      ${slide.body
        .map(
          ([title, desc], i) => `
        <div class="value-item">
          <span>${String(i + 1).padStart(2, "0")}</span>
          <h3>${esc(title)}</h3>
          <p>${esc(desc)}</p>
        </div>`
        )
        .join("")}
    </div>`;
}

function renderHtml(direction) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(direction.label)}｜AI 审计 HTML Deck 方向稿</title>
  <style>
    :root {
      --accent: ${direction.accent};
      --slide-w: 1920px;
      --slide-h: 1080px;
      --ease: cubic-bezier(.22, 1, .36, 1);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      overflow: hidden;
      font-family: "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", serif;
      background: #111;
      color: #fff;
    }
    .deck-shell {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: var(--page-bg);
    }
    .stage {
      width: var(--slide-w);
      height: var(--slide-h);
      position: relative;
      transform-origin: center center;
    }
    .slide {
      position: absolute;
      inset: 0;
      width: var(--slide-w);
      height: var(--slide-h);
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateX(34px) scale(.985);
      transition: opacity 360ms var(--ease), transform 500ms var(--ease);
      padding: 92px 112px;
      background: var(--slide-bg);
      color: var(--text);
    }
    .slide.active {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(0) scale(1);
    }
    .slide-meta {
      position: absolute;
      top: 44px;
      left: 112px;
      right: 112px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: "DIN Alternate", "Avenir Next Condensed", sans-serif;
      font-size: 18px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--muted);
      z-index: 5;
    }
    h1, h2, h3, h4, p { margin: 0; }
    h1 {
      max-width: 1040px;
      font-size: 112px;
      line-height: 1.02;
      font-weight: 700;
      letter-spacing: 0;
    }
    h2 {
      font-size: 72px;
      line-height: 1.08;
      letter-spacing: 0;
      font-weight: 700;
    }
    h3 {
      font-size: 34px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    h4 {
      font-size: 23px;
      line-height: 1.25;
      font-weight: 600;
      color: var(--accent);
    }
    p {
      font-size: 27px;
      line-height: 1.55;
      color: var(--body);
      text-wrap: pretty;
    }
    .eyebrow {
      color: var(--accent);
      font-size: 22px;
      font-family: "DIN Alternate", "Avenir Next Condensed", sans-serif;
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-bottom: 34px;
    }
    .subtitle {
      max-width: 900px;
      margin-top: 34px;
      font-size: 36px;
      line-height: 1.35;
    }
    .cover-grid, .layout-two {
      height: 100%;
      display: grid;
      grid-template-columns: 1.02fr .98fr;
      align-items: center;
      gap: 72px;
    }
    .keyword-row {
      display: flex;
      gap: 18px;
      margin-top: 58px;
      flex-wrap: wrap;
    }
    .keyword-row span {
      min-width: 132px;
      padding: 14px 18px;
      border: 1px solid var(--line);
      color: var(--text);
      font-size: 23px;
      text-align: center;
      background: var(--chip);
    }
    .hero-system {
      height: 650px;
      position: relative;
      display: grid;
      align-content: center;
    }
    .orbital {
      position: relative;
      width: 620px;
      height: 620px;
      margin: 0 auto;
      border-radius: 50%;
      border: 1px solid var(--line-strong);
      background:
        radial-gradient(circle at center, var(--core-glow) 0 16%, transparent 17%),
        repeating-radial-gradient(circle at center, transparent 0 80px, var(--line-soft) 82px 83px, transparent 84px 130px);
    }
    .orbital:before, .orbital:after {
      content: "";
      position: absolute;
      inset: 92px;
      border: 1px solid var(--line);
      border-radius: 50%;
    }
    .orbital:after {
      inset: 196px;
      border-color: var(--accent);
      opacity: .55;
    }
    .core {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-family: "DIN Alternate", "Avenir Next Condensed", sans-serif;
      font-size: 66px;
      color: var(--text);
    }
    .node {
      position: absolute;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 12px var(--node-halo);
    }
    .n1 { left: 90px; top: 112px; }
    .n2 { right: 72px; top: 180px; }
    .n3 { right: 160px; bottom: 76px; }
    .n4 { left: 140px; bottom: 128px; }
    .signal-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 28px auto 0;
      width: 650px;
      font-family: "DIN Alternate", "Avenir Next Condensed", sans-serif;
      font-size: 18px;
      letter-spacing: .12em;
      color: var(--muted);
    }
    .signal-strip b {
      padding-top: 12px;
      border-top: 3px solid var(--accent);
      font-weight: 500;
    }
    .copy-block {
      align-self: center;
    }
    .copy-block p, .stacked-head p {
      margin-top: 28px;
      max-width: 820px;
    }
    .chain-panel {
      display: grid;
      gap: 18px;
    }
    .chain-step {
      display: grid;
      grid-template-columns: 76px 1fr;
      gap: 22px;
      padding: 24px 28px;
      border: 1px solid var(--line);
      background: var(--panel);
      min-height: 116px;
    }
    .step-index {
      font-family: "DIN Alternate", "Avenir Next Condensed", sans-serif;
      font-size: 32px;
      color: var(--accent);
    }
    .chain-step p {
      margin-top: 8px;
      font-size: 21px;
      line-height: 1.42;
    }
    .stacked-head {
      max-width: 1240px;
      margin-top: 94px;
      margin-bottom: 56px;
    }
    .platform-matrix {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px;
    }
    .platform-card {
      min-height: 430px;
      padding: 34px 30px;
      border: 1px solid var(--line);
      background: var(--panel);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .platform-number {
      position: absolute;
      top: 28px;
      right: 26px;
      font-family: "DIN Alternate", "Avenir Next Condensed", sans-serif;
      color: var(--muted);
      font-size: 32px;
    }
    .platform-card h4 {
      margin-top: 16px;
    }
    .platform-card p {
      margin-top: 26px;
      font-size: 20px;
      line-height: 1.48;
    }
    .mini-list {
      margin-top: 44px;
      display: grid;
      gap: 18px;
    }
    .mini-list div {
      display: grid;
      grid-template-columns: 128px 1fr;
      gap: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--line);
    }
    .mini-list b {
      color: var(--accent);
      font-size: 23px;
      line-height: 1.3;
    }
    .mini-list span {
      color: var(--body);
      font-size: 20px;
      line-height: 1.45;
    }
    .network-panel {
      position: relative;
      height: 640px;
      border: 1px solid var(--line);
      background: var(--panel);
      overflow: hidden;
    }
    .network-panel svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .network-panel path {
      fill: none;
      stroke: var(--graph-line);
      stroke-width: 2.5;
      vector-effect: non-scaling-stroke;
    }
    .graph-node {
      position: absolute;
      z-index: 2;
      min-width: 86px;
      padding: 13px 16px;
      border: 1px solid var(--line-strong);
      background: var(--node-bg);
      color: var(--text);
      font-size: 22px;
      text-align: center;
    }
    .node-0 { left: 74px; top: 70px; }
    .node-1 { left: 286px; top: 190px; }
    .node-2 { right: 98px; top: 50px; }
    .node-3 { left: 160px; bottom: 160px; }
    .node-4 { left: 390px; bottom: 66px; }
    .node-5 { right: 78px; bottom: 112px; }
    .node-6 { right: 180px; top: 250px; }
    .node-7 { left: 50%; top: 50%; transform: translate(-50%, -50%); border-color: var(--accent); }
    .value-head h2 {
      max-width: 1380px;
    }
    .value-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px;
      align-items: stretch;
    }
    .value-item {
      min-height: 360px;
      padding: 30px;
      border-top: 6px solid var(--accent);
      background: var(--panel);
    }
    .value-item span {
      display: block;
      margin-bottom: 72px;
      font-family: "DIN Alternate", "Avenir Next Condensed", sans-serif;
      color: var(--muted);
      font-size: 28px;
    }
    .value-item p {
      margin-top: 24px;
      font-size: 20px;
      line-height: 1.48;
    }
    .deck-ui {
      position: fixed;
      left: 24px;
      right: 24px;
      bottom: 22px;
      display: flex;
      justify-content: space-between;
      color: var(--ui);
      font: 14px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      pointer-events: none;
      z-index: 20;
    }
    .deck-ui span {
      padding: 8px 10px;
      background: var(--ui-bg);
      border: 1px solid var(--ui-line);
    }
    .control {
      --page-bg: #070907;
      --slide-bg:
        linear-gradient(90deg, rgba(231,180,76,.14) 0 1px, transparent 1px 160px),
        linear-gradient(0deg, rgba(231,180,76,.10) 0 1px, transparent 1px 160px),
        #0B100E;
      --text: #F4F1E8;
      --body: #C8D1C7;
      --muted: rgba(244,241,232,.54);
      --line: rgba(231,180,76,.24);
      --line-soft: rgba(231,180,76,.12);
      --line-strong: rgba(231,180,76,.5);
      --panel: rgba(12, 22, 18, .82);
      --chip: rgba(231,180,76,.08);
      --core-glow: rgba(231,180,76,.2);
      --node-halo: rgba(231,180,76,.13);
      --node-bg: rgba(8, 16, 14, .94);
      --graph-line: rgba(231,180,76,.45);
      --ui: rgba(244,241,232,.7);
      --ui-bg: rgba(7,9,7,.72);
      --ui-line: rgba(231,180,76,.22);
      font-family: "Songti SC", "Noto Serif CJK SC", serif;
    }
    .control .slide { border: 1px solid rgba(231,180,76,.22); }
    .control h1, .control h2 { font-family: "STKaiti", "Kaiti SC", "Songti SC", serif; font-weight: 700; }
    .control .chain-step, .control .platform-card, .control .network-panel, .control .value-item { box-shadow: inset 0 0 0 1px rgba(255,255,255,.03); }
    .boardroom {
      --page-bg: #D7D8D2;
      --slide-bg: #F7F6F0;
      --text: #171717;
      --body: #494742;
      --muted: rgba(23,23,23,.42);
      --line: rgba(23,23,23,.18);
      --line-soft: rgba(183,45,45,.10);
      --line-strong: rgba(183,45,45,.42);
      --panel: #FFFFFF;
      --chip: rgba(183,45,45,.05);
      --core-glow: rgba(183,45,45,.12);
      --node-halo: rgba(183,45,45,.10);
      --node-bg: #FDFCF8;
      --graph-line: rgba(23,23,23,.36);
      --ui: rgba(23,23,23,.72);
      --ui-bg: rgba(247,246,240,.88);
      --ui-line: rgba(23,23,23,.14);
    }
    .boardroom .slide { border: 18px solid #FFFFFF; }
    .boardroom h1, .boardroom h2 { font-family: "Songti SC", "Noto Serif CJK SC", serif; }
    .boardroom .platform-card, .boardroom .chain-step, .boardroom .network-panel, .boardroom .value-item { box-shadow: 0 16px 42px rgba(20,20,20,.06); }
    .boardroom .keyword-row span, .boardroom .graph-node { border-radius: 0; }
    .atlas {
      --page-bg: #E8ECE8;
      --slide-bg:
        radial-gradient(circle at 22% 30%, rgba(31,138,112,.12), transparent 0 18%, transparent 19%),
        linear-gradient(90deg, rgba(14,28,31,.07) 0 1px, transparent 1px 120px),
        linear-gradient(0deg, rgba(14,28,31,.06) 0 1px, transparent 1px 120px),
        #F4F8F4;
      --text: #102226;
      --body: #40585C;
      --muted: rgba(16,34,38,.45);
      --line: rgba(31,138,112,.22);
      --line-soft: rgba(31,138,112,.12);
      --line-strong: rgba(31,138,112,.48);
      --panel: rgba(255,255,255,.78);
      --chip: rgba(31,138,112,.07);
      --core-glow: rgba(31,138,112,.12);
      --node-halo: rgba(31,138,112,.10);
      --node-bg: rgba(250,253,250,.96);
      --graph-line: rgba(31,138,112,.50);
      --ui: rgba(16,34,38,.72);
      --ui-bg: rgba(244,248,244,.86);
      --ui-line: rgba(31,138,112,.20);
    }
    .atlas h1, .atlas h2 { font-family: "Songti SC", "Noto Serif CJK SC", serif; }
    .atlas .platform-card, .atlas .chain-step, .atlas .network-panel, .atlas .value-item { backdrop-filter: blur(10px); }
  </style>
</head>
<body class="${direction.htmlClass}">
  <div class="deck-shell">
    <main class="stage" id="stage">
      ${slides.map((slide, index) => renderSlide(slide, index, direction)).join("\n")}
    </main>
  </div>
  <div class="deck-ui">
    <span>${esc(direction.label)}</span>
    <span id="counter">1 / ${slides.length}</span>
  </div>
  <script>
    const slides = Array.from(document.querySelectorAll(".slide"));
    const stage = document.getElementById("stage");
    const counter = document.getElementById("counter");
    const requestedSlide = Number(new URLSearchParams(window.location.search).get("slide"));
    let current = Number.isFinite(requestedSlide) && requestedSlide > 0
      ? requestedSlide - 1
      : Number(localStorage.getItem("${direction.id}-slide") || 0);
    function fit() {
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      stage.style.transform = "scale(" + scale + ")";
    }
    function show(index) {
      current = Math.max(0, Math.min(slides.length - 1, index));
      slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
      counter.textContent = (current + 1) + " / " + slides.length;
      localStorage.setItem("${direction.id}-slide", current);
    }
    window.addEventListener("resize", fit);
    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === " ") show(current + 1);
      if (event.key === "ArrowLeft") show(current - 1);
      if (event.key === "Home") show(0);
      if (event.key === "End") show(slides.length - 1);
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest(".deck-ui")) return;
      show(current + 1);
    });
    fit();
    show(current);
    window.__ready = true;
  </script>
</body>
</html>`;
}

for (const direction of directions) {
  const dir = path.join(root, direction.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderHtml(direction), "utf8");
}

const readme = `# AI 审计技术实力 HTML Deck 方向稿

源稿：\`/Users/mac/Desktop/workspace/outputs/audit-ai-tech-strength-ppt内容正式稿-20260607.md\`

本轮是视觉方向稿，不是完整 38 页正式制作。为便于横向比较，三版都使用同一组代表页：

- 封面
- AI + 审计作业链路
- 3+1 AI 原生审计技术底座
- 数据图谱平台
- 核心价值总结

## 三个方向

1. \`01-control-room/index.html\`：审计指挥室。深色控制台、链路和状态信号，适合强调技术实力和系统工程感。
2. \`02-boardroom-report/index.html\`：董事会白皮书。白底红黑、正式汇报感，适合稳健交流和对外宣讲。
3. \`03-graph-atlas/index.html\`：关系图谱图册。图谱、地图和分区信息层，适合强调关系穿透与平台闭环。

操作：打开任一 \`index.html\`，点击或按左右方向键翻页。
`;

fs.writeFileSync(path.join(root, "README.md"), readme, "utf8");
