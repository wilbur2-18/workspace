const BLUE = "#115BE8";
const BLUE_DARK = "#092B8D";
const BLUE_MID = "#1E65E4";
const BLUE_LIGHT = "#BFD4FF";
const BLUE_PALE = "#EEF5FF";
const INK = "#111827";
const MUTED = "#374151";
const FONT = "PingFang SC";

function iconPath(ctx, fileName) {
  return `${ctx.workspaceDir}/assets/generated-icons/${fileName}`;
}

function svgData(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, {
    typeface: FONT,
    color: INK,
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
    ...opts,
  });
  shape.text.autoFit = "shrinkText";
  return shape;
}

function addRect(ctx, slide, x, y, w, h, fill, lineFill = "#00000000", lineWidth = 0, name) {
  return ctx.addShape(slide, {
    x, y, w, h,
    geometry: "rect",
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    name,
  });
}

function addEllipse(ctx, slide, x, y, w, h, fill, lineFill = BLUE_LIGHT, lineWidth = 2, name) {
  return ctx.addShape(slide, {
    x, y, w, h,
    geometry: "ellipse",
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    name,
  });
}

async function addSvg(ctx, slide, svg, x, y, w, h, alt, name) {
  return ctx.addImage(slide, {
    dataUrl: svgData(svg),
    x, y, w, h,
    fit: "contain",
    alt,
    name,
  });
}

async function addIconImage(ctx, slide, fileName, x, y, w, h, alt) {
  return ctx.addImage(slide, {
    path: iconPath(ctx, fileName),
    x,
    y,
    w,
    h,
    fit: "contain",
    alt,
    name: `generated-icon-${fileName}`,
  });
}

async function addBackground(ctx, slide) {
  addRect(ctx, slide, 0, 0, 1280, 720, "#FFFFFF");
  const mesh = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#eef6ff"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#g)"/>
    <g opacity="0.33" stroke="#A9C7F6" stroke-width="0.7" fill="none">
      <path d="M1030 88 L1080 55 L1130 92 L1190 66 L1268 108"/>
      <path d="M1030 88 L1110 142 L1190 66 L1248 24"/>
      <path d="M1090 185 L1160 150 L1210 215 L1270 185"/>
      <path d="M0 632 C230 565 365 630 520 590 C715 535 880 592 1280 515"/>
      <path d="M0 660 C270 590 440 668 610 620 C820 560 980 640 1280 570"/>
    </g>
    <g opacity="0.45" fill="#9FC0F8">
      <circle cx="1070" cy="58" r="4"/>
      <circle cx="1110" cy="142" r="5"/>
      <circle cx="1190" cy="66" r="4"/>
      <circle cx="1268" cy="108" r="5"/>
      <circle cx="1160" cy="150" r="4"/>
      <circle cx="1210" cy="215" r="4"/>
    </g>
    <g opacity="0.16" stroke="#86ADEB" stroke-width="0.5">
      ${Array.from({ length: 25 }, (_, i) => `<path d="M${i * 58} 720 L${430 + i * 34} 590"/>`).join("")}
      ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${612 + i * 12} L1280 ${590 + i * 9}"/>`).join("")}
    </g>
  </svg>`;
  await addSvg(ctx, slide, mesh, 0, 0, 1280, 720, "light blue technical background", "background-mesh");
}

async function addRibbon(ctx, slide, x, y, w, h, text) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="r" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#1E75FF"/>
        <stop offset="0.45" stop-color="#0D55E8"/>
        <stop offset="1" stop-color="#0832A8"/>
      </linearGradient>
    </defs>
    <polygon points="16,0 ${w - 16},0 ${w},${h} 0,${h}" fill="url(#r)"/>
  </svg>`;
  await addSvg(ctx, slide, svg, x, y, w, h, "blue section ribbon", "section-ribbon");
  addText(ctx, slide, {
    x, y: y + 2, w, h: h - 2,
    text,
    fontSize: 22,
    bold: true,
    color: "#FFFFFF",
    align: "center",
    valign: "mid",
  });
}

function addCard(ctx, slide, x, y, w, h, name) {
  addRect(ctx, slide, x, y, w, h, "#FBFDFF", "#BFD4FF", 1.1, name);
}

async function addNode(ctx, slide, cx, cy, label, iconFile, size = 88) {
  const x = cx - size / 2;
  const y = cy - size / 2;
  addEllipse(ctx, slide, x, y, size, size, "#FFFFFF", "#8DAEFF", 2.2, `node-${label}`);
  await addIconImage(ctx, slide, iconFile, cx - size * 0.27, cy - size * 0.37, size * 0.54, size * 0.54, label);
  addText(ctx, slide, {
    x: x + 5,
    y: y + size - 31,
    w: size - 10,
    h: 20,
    text: label,
    fontSize: 15,
    bold: true,
    color: BLUE_DARK,
    align: "center",
  });
}

function addDashedLink(ctx, slide, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(5, Math.floor(len / 16));
  for (let i = 0; i < steps; i += 2) {
    const t = i / steps;
    const nx = x1 + dx * t;
    const ny = y1 + dy * t;
    addEllipse(ctx, slide, nx - 1.8, ny - 1.8, 3.6, 3.6, BLUE_MID, BLUE_MID, 0);
  }
}

async function addCapabilityCard(ctx, slide, x, y, w, h, iconFile, title, body, iconW = 76) {
  addCard(ctx, slide, x, y, w, h, "capability-card");
  await addIconImage(ctx, slide, iconFile, x + 18, y + 22, iconW + 12, iconW + 12, title);
  addText(ctx, slide, {
    x: x + 120,
    y: y + 24,
    w: w - 145,
    h: 26,
    text: title,
    fontSize: 20,
    bold: true,
    color: BLUE_DARK,
  });
  addText(ctx, slide, {
    x: x + 120,
    y: y + 62,
    w: w - 145,
    h: h - 82,
    text: body,
    fontSize: 12.8,
    color: INK,
  });
}

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  await addBackground(ctx, slide);

  addRect(ctx, slide, 40, 31, 7, 50, BLUE);
  addRect(ctx, slide, 51, 31, 7, 50, "#4D82F6");
  addText(ctx, slide, {
    x: 86,
    y: 30,
    w: 882,
    h: 55,
    text: "人机协同的统一工作入口与审计作业执行层",
    fontSize: 40,
    bold: true,
    color: BLUE_DARK,
  });
  addText(ctx, slide, {
    x: 82,
    y: 98,
    w: 960,
    h: 27,
    text: "综合分析平台将数据、知识、图谱、智能体和审计成果统一收口，形成审计人员可操作、可沉淀的人机协同工作台。",
    fontSize: 18,
    color: "#111111",
  });

  addCard(ctx, slide, 46, 161, 315, 294, "left-primary-card");
  await addRibbon(ctx, slide, 104, 141, 196, 34, "统一工作台");
  await addIconImage(ctx, slide, "01-workstation.png", 115, 185, 170, 122, "project workstation generated icon");
  addText(ctx, slide, {
    x: 82,
    y: 326,
    w: 248,
    h: 31,
    text: "多源数据接入的统一工作台",
    fontSize: 21,
    bold: true,
    color: BLUE_DARK,
  });
  addText(ctx, slide, {
    x: 76,
    y: 365,
    w: 248,
    h: 68,
    text: "为审计人员搭建独立项目空间\n支持在同一界面查资料、查数据、\n查关系、查法规。",
    fontSize: 16,
    color: INK,
  });

  addCard(ctx, slide, 888, 161, 310, 294, "right-primary-card");
  await addRibbon(ctx, slide, 956, 141, 184, 34, "执行层");
  await addIconImage(ctx, slide, "02-robot-execution.png", 950, 191, 190, 138, "robot execution generated icon");
  addText(ctx, slide, {
    x: 905,
    y: 326,
    w: 276,
    h: 30,
    text: "让AI具备能力接入真实的审计作业",
    fontSize: 20,
    bold: true,
    color: BLUE_DARK,
  });
  addText(ctx, slide, {
    x: 916,
    y: 365,
    w: 238,
    h: 68,
    text: "为大模型配置读取、检索、抽取、\n比对、计算、生成等工具，\n使其能够围绕具体审计任务\n执行多步骤操作。",
    fontSize: 16,
    color: INK,
  });

  const arcSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="456" height="332" viewBox="0 0 456 332">
    <path d="M92 92 C166 14 292 15 366 92" fill="none" stroke="#276BFF" stroke-width="3"/>
    <path d="M62 245 C30 160 52 93 92 55" fill="none" stroke="#276BFF" stroke-width="2"/>
    <path d="M394 245 C426 160 405 93 366 55" fill="none" stroke="#276BFF" stroke-width="2"/>
    <path d="M65 257 C160 287 294 287 390 257" fill="none" stroke="#D7E5FF" stroke-width="5"/>
  </svg>`;
  await addSvg(ctx, slide, arcSvg, 393, 154, 456, 332, "platform convergence arcs", "center-arcs");
  addEllipse(ctx, slide, 545, 235, 170, 170, "#F9FCFF", "#BBD0FF", 3, "central-hub");
  await addIconImage(ctx, slide, "03-center-monitor.png", 590, 253, 82, 68, "central monitor generated icon");
  addText(ctx, slide, {
    x: 568,
    y: 336,
    w: 124,
    h: 29,
    text: "统一工作台",
    fontSize: 22,
    bold: true,
    color: BLUE_DARK,
    align: "center",
  });
  addText(ctx, slide, {
    x: 558,
    y: 372,
    w: 143,
    h: 20,
    text: "人机协同工作入口",
    fontSize: 15.5,
    color: "#111111",
    align: "center",
  });

  addDashedLink(ctx, slide, 630, 236, 630, 202);
  addDashedLink(ctx, slide, 545, 310, 504, 288);
  addDashedLink(ctx, slide, 547, 353, 498, 373);
  addDashedLink(ctx, slide, 715, 310, 759, 288);
  addDashedLink(ctx, slide, 713, 353, 762, 373);
  await addNode(ctx, slide, 630, 176, "多源数据", "04-database.png", 92);
  await addNode(ctx, slide, 464, 252, "知识库", "05-knowledge-book.png", 88);
  await addNode(ctx, slide, 454, 396, "智能体能力", "06-ai-head.png", 102);
  await addNode(ctx, slide, 796, 252, "图谱关系", "07-graph-relation.png", 88);
  await addNode(ctx, slide, 795, 397, "审计成果", "08-audit-check.png", 96);

  await addCapabilityCard(
    ctx,
    slide,
    46,
    469,
    374,
    153,
    "09-ai-brain-head.png",
    "通过技能为AI 接入审计思路",
    "将专家核查逻辑、规则匹配方式和风险\n识别方法沉淀为标准化技能（Skill），\n让大模型随时调用，进行专业审计。",
    82,
  );
  await addCapabilityCard(
    ctx,
    slide,
    435,
    469,
    394,
    153,
    "10-skill-layers.png",
    "审计技能沉淀与共享",
    "基于审计上下文自动提取「审计技能」，\n沉淀高质量分析的核查路径、判断规则、\n分析步骤和引用依据，形成标准化SKILL，\n并支持组织级技能共享。",
    80,
  );
  await addCapabilityCard(
    ctx,
    slide,
    842,
    469,
    356,
    153,
    "11-app-lightning.png",
    "审计应用快捷封装",
    "将重复执行的标准化技能执行链路\n转化为审计应用，审计人员即开即用\n比问答更省事，一步输入即可取数",
    74,
  );

  const footer = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="39" viewBox="0 0 1000 39">
    <defs>
      <linearGradient id="f" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#2A83FF"/>
        <stop offset="0.46" stop-color="#0B58EA"/>
        <stop offset="1" stop-color="#0631A9"/>
      </linearGradient>
    </defs>
    <polygon points="28,0 972,0 1000,39 0,39" fill="url(#f)"/>
    <polygon points="0,39 28,0 56,0 30,39" fill="#79AFFF" opacity="0.65"/>
    <polygon points="970,39 944,0 972,0 1000,39" fill="#79AFFF" opacity="0.65"/>
  </svg>`;
  await addSvg(ctx, slide, footer, 85, 638, 1000, 39, "blue footer ribbon", "footer-ribbon");
  addText(ctx, slide, {
    x: 170,
    y: 645,
    w: 830,
    h: 26,
    text: "统一入口 + 执行能力 + 技能沉淀，构建可操作、可复用、可共享的审计作业平台",
    fontSize: 19,
    bold: true,
    color: "#FFFFFF",
    align: "center",
  });
  addText(ctx, slide, {
    x: 1204,
    y: 676,
    w: 30,
    h: 18,
    text: "32",
    fontSize: 15,
    color: BLUE_DARK,
    align: "right",
  });
  addRect(ctx, slide, 1242, 675, 1.2, 19, BLUE_DARK);

  return slide;
}
