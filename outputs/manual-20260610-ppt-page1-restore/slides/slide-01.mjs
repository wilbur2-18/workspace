const BLUE = "#073B9A";
const MID_BLUE = "#2F62C9";
const LINE_BLUE = "#B9D2F5";

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

async function addKeyword(ctx, slide, { x, icon, text }) {
  await ctx.addLucideIcon(slide, {
    icon,
    x,
    y: 444,
    w: 25,
    h: 25,
    color: MID_BLUE,
    strokeWidth: 2,
  });
  addText(ctx, slide, {
    x: x + 36,
    y: 444,
    w: 78,
    h: 24,
    text,
    fontSize: 17,
    bold: true,
    color: BLUE,
    typeface: "PingFang SC",
    valign: "mid",
  });
}

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();

  await ctx.addImage(slide, {
    path: `${ctx.workspaceDir}/work/page1-bg-no-left-text.png`,
    x: 0,
    y: 0,
    w: ctx.W,
    h: ctx.H,
    fit: "cover",
    alt: "浅蓝科技图谱背景",
  });

  addText(ctx, slide, {
    x: 72,
    y: 187,
    w: 710,
    h: 100,
    text: "智慧审计新范式",
    fontSize: 70,
    bold: true,
    color: BLUE,
    typeface: "PingFang SC",
  });

  addText(ctx, slide, {
    x: 78,
    y: 323,
    w: 705,
    h: 54,
    text: "大模型赋能下的人机协同与价值重塑",
    fontSize: 35,
    bold: true,
    color: BLUE,
    typeface: "PingFang SC",
  });

  ctx.addShape(slide, { x: 78, y: 405, w: 705, h: 1.2, fill: LINE_BLUE });
  ctx.addShape(slide, { x: 78, y: 489, w: 705, h: 1.2, fill: LINE_BLUE });

  const keywords = [
    { x: 78, icon: "pie-chart", text: "数据理解" },
    { x: 224, icon: "network", text: "图谱推理" },
    { x: 373, icon: "box", text: "智能体编排" },
    { x: 545, icon: "refresh-cw", text: "作业闭环" },
    { x: 698, icon: "layers", text: "能力沉淀" },
  ];

  for (const item of keywords) {
    await addKeyword(ctx, slide, item);
  }

  for (const x of [200, 350, 515, 668]) {
    ctx.addShape(slide, { x, y: 443, w: 1, h: 25, fill: "#C7DAF7" });
  }

  return slide;
}
