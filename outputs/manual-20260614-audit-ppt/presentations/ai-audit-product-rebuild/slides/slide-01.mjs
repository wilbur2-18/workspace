const BLUE = "#0C22A0";
const ACCENT = "#0F63FF";
const CYAN = "#72B9FF";
const TEXT = "#171B25";
const LIGHT_LINE = "#C7DEFF";
const WHITE = "#FFFFFF";

function addRoundRect(ctx, slide, x, y, w, h, fill, lineFill = "#FFFFFF", lineWidth = 1.5, name) {
  return ctx.addShape(slide, {
    geometry: "roundRect",
    x, y, w, h, name,
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
  });
}

function addDivider(ctx, slide, x, y, w) {
  ctx.addShape(slide, {
    geometry: "rect",
    x, y, w, h: 1.2,
    fill: "#C9DFFF",
    line: ctx.line(),
  });
}

function addTopTab(ctx, slide, x, y, w, text) {
  ctx.addShape(slide, {
    geometry: "rect",
    x, y, w, h: 38,
    fill: "#1D73FF",
    line: ctx.line(),
    name: `${text}-tab-fill`,
  });
  ctx.addShape(slide, {
    geometry: "triangle",
    x: x - 20, y, w: 42, h: 38,
    fill: "#F1F7FF",
    line: ctx.line(),
    name: `${text}-tab-left-cut`,
  });
  ctx.addShape(slide, {
    geometry: "triangle",
    x: x + w - 21, y, w: 42, h: 38,
    fill: "#F1F7FF",
    line: ctx.line(),
    name: `${text}-tab-right-cut`,
  }).rotation = 180;
  ctx.addText(slide, {
    text,
    x, y: y + 4, w, h: 28,
    fontSize: 20,
    typeface: "PingFang SC",
    bold: true,
    color: WHITE,
    align: "center",
    valign: "mid",
    name: `${text}-tab-label`,
  });
}

async function addQuestionRow(ctx, slide, { icon, text, x, y }) {
  await ctx.addImage(slide, { path: `${ctx.assetDir}/${icon}`, x, y: y - 7, w: 68, h: 68, fit: "contain", alt: icon });
  ctx.addText(slide, {
    text,
    x: x + 90, y: y + 5, w: 205, h: 48,
    fontSize: 19,
    typeface: "PingFang SC",
    bold: true,
    color: TEXT,
    valign: "mid",
    name: `left-${text}`,
  });
}

async function addProblemRow(ctx, slide, { icon, text, x, y, h = 56 }) {
  await ctx.addImage(slide, { path: `${ctx.assetDir}/${icon}`, x, y: y + 5, w: 48, h: 48, fit: "contain", alt: icon });
  ctx.addShape(slide, {
    geometry: "triangle",
    x: x + 58, y: y + 27, w: 8, h: 8,
    fill: ACCENT,
    line: ctx.line(),
  }).rotation = 90;
  ctx.addText(slide, {
    text,
    x: x + 76, y: y + 10, w: 228, h,
    fontSize: 15,
    typeface: "PingFang SC",
    bold: true,
    color: TEXT,
    valign: "mid",
    name: `right-${text.slice(0, 8)}`,
  });
}

async function addNode(ctx, slide, { img, label, x, y, size }) {
  await ctx.addImage(slide, { path: `${ctx.assetDir}/${img}`, x, y, w: size, h: size, fit: "contain", alt: label });
  ctx.addShape(slide, {
    geometry: "arc",
    x: x + 9, y: y + size - 4, w: size - 18, h: 34,
    fill: "#00000000",
    line: { style: "solid", fill: "#8AC7FF", width: 1.3 },
    name: `${label}-halo`,
  });
  ctx.addText(slide, {
    text: label,
    x: x - 14, y: y + size + 8, w: size + 28, h: 26,
    fontSize: 19,
    typeface: "PingFang SC",
    bold: true,
    color: "#0033D8",
    align: "center",
    valign: "mid",
    name: `node-label-${label}`,
  });
}

function addArrow(ctx, slide, x, y, w) {
  ctx.addShape(slide, {
    geometry: "rect",
    x, y, w, h: 1.4,
    fill: "#4E8DFF",
    line: ctx.line(),
  });
  ctx.addShape(slide, {
    geometry: "triangle",
    x: x + w - 2, y: y - 4, w: 9, h: 9,
    fill: "#4E8DFF",
    line: ctx.line(),
  }).rotation = 90;
}

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();

  await ctx.addImage(slide, {
    path: `${ctx.assetDir}/tech-background.png`,
    x: 0, y: 0, w: 1280, h: 720,
    fit: "cover",
    alt: "light blue technology background",
    name: "generated-tech-background",
  });

  ctx.addText(slide, {
    text: "AI 原生审计产品体系： 用技术链路重构审计作业支撑",
    x: 43, y: 82, w: 1120, h: 58,
    fontSize: 39,
    typeface: "PingFang SC",
    bold: true,
    color: "#071078",
    name: "main-title",
  });
  ctx.addShape(slide, { geometry: "rect", x: 43, y: 149, w: 18, h: 2.5, fill: "#0E5DFF", line: ctx.line() });
  ctx.addShape(slide, { geometry: "rect", x: 63, y: 149, w: 28, h: 2.5, fill: "#A8CCFF", line: ctx.line() });
  ctx.addText(slide, {
    text: "我们的解法不是在系统外层增加 AI 问答入口，",
    x: 51, y: 169, w: 640, h: 30,
    fontSize: 20,
    typeface: "PingFang SC",
    color: TEXT,
    name: "subtitle-line-1",
  });
  ctx.addText(slide, {
    text: "而是围绕真实的审计作业链路， 运用 AI 技术去解决",
    x: 51, y: 202, w: 492, h: 30,
    fontSize: 20,
    typeface: "PingFang SC",
    color: TEXT,
    name: "subtitle-line-2a",
  });
  ctx.addText(slide, {
    text: "“AI+审计”",
    x: 545, y: 202, w: 110, h: 30,
    fontSize: 20,
    typeface: "PingFang SC",
    bold: true,
    color: "#0349D9",
    name: "subtitle-line-2b",
  });
  ctx.addText(slide, {
    text: "的技术难题。",
    x: 666, y: 202, w: 136, h: 30,
    fontSize: 20,
    typeface: "PingFang SC",
    color: TEXT,
    name: "subtitle-line-2c",
  });

  addRoundRect(ctx, slide, 39, 257, 342, 372, "#F2F8FFFF", "#FFFFFF", 1.8, "left-panel");
  addTopTab(ctx, slide, 108, 262, 210, "重点回答三个问题");
  addRoundRect(ctx, slide, 51, 315, 320, 296, "#F8FBFFFF", "#FFFFFF", 1.0, "left-inner-card");
  await addQuestionRow(ctx, slide, { icon: "left-cube.png", text: "如何避免大模型幻觉", x: 61, y: 333 });
  addDivider(ctx, slide, 63, 411, 293);
  await addQuestionRow(ctx, slide, { icon: "left-mind.png", text: "如何让大模型具备审计思路", x: 61, y: 432 });
  addDivider(ctx, slide, 63, 509, 293);
  await addQuestionRow(ctx, slide, { icon: "left-team.png", text: "如何让大模型与审计人员协作", x: 61, y: 531 });

  ctx.addShape(slide, { geometry: "triangle", x: 386, y: 421, w: 21, h: 34, fill: "#4F8BFF", line: ctx.line() }).rotation = 90;
  ctx.addShape(slide, { geometry: "triangle", x: 852, y: 421, w: 21, h: 34, fill: "#4F8BFF", line: ctx.line() }).rotation = 90;

  await ctx.addImage(slide, {
    path: `${ctx.assetDir}/bridge-platform.png`,
    x: 380, y: 380, w: 530, h: 265,
    fit: "contain",
    alt: "bridge platform technology illustration",
    name: "local-bridge-platform-illustration",
  });
  await addNode(ctx, slide, { img: "node-data.png", label: "存量数据", x: 431, y: 291, size: 102 });
  await addNode(ctx, slide, { img: "node-business.png", label: "实际业务", x: 581, y: 278, size: 111 });
  await addNode(ctx, slide, { img: "node-agent.png", label: "智能体能力", x: 741, y: 293, size: 101 });
  addArrow(ctx, slide, 535, 322, 25);
  addArrow(ctx, slide, 682, 322, 37);
  ctx.addShape(slide, {
    geometry: "upArrow",
    x: 604, y: 431, w: 62, h: 92,
    fill: "#FFFFFF66",
    line: ctx.line(),
    name: "bridge-up-arrow",
  });
  ctx.addShape(slide, {
    geometry: "ellipse",
    x: 454, y: 535, w: 372, h: 70,
    fill: "#E9F5FFFF",
    line: { style: "solid", fill: "#91C6FF", width: 1.2 },
    name: "bridge-label-plate",
  });
  ctx.addText(slide, {
    text: "建立桥梁",
    x: 535, y: 556, w: 200, h: 35,
    fontSize: 24,
    typeface: "PingFang SC",
    bold: true,
    color: "#0040D8",
    align: "center",
    valign: "mid",
    name: "bridge-editable-label",
  });

  addRoundRect(ctx, slide, 879, 236, 352, 416, "#F2F8FFFF", "#FFFFFF", 1.8, "right-panel");
  addTopTab(ctx, slide, 955, 240, 206, "重点解决的问题");
  addRoundRect(ctx, slide, 893, 289, 324, 360, "#F8FBFFFF", "#FFFFFF", 1.0, "right-inner-card");
  const rightRows = [
    ["right-doc.png", "海量非结构化资料的数据治理", 305, 32],
    ["right-network.png", "多源数据贯通与隐含价值挖掘", 374, 32],
    ["right-graph.png", "人、企、单位、项目、\n资金图谱搭建与疑点挖掘", 443, 62],
    ["right-check.png", "大批量审计核查任务自动化执行", 524, 32],
    ["right-team.png", "审计思路沉淀与团队共享", 594, 32],
  ];
  for (const [icon, text, y, h] of rightRows) {
    await addProblemRow(ctx, slide, { icon, text, x: 912, y, h });
  }
  [356, 425, 500, 569].forEach((y) => addDivider(ctx, slide, 904, y, 300));

  return slide;
}
