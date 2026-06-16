const data = {"page":21,"pageLabel":"第21页","title":"招股书提取","columns":[["","典型场景：招股书智能提取","","面对数百页的招股书 PDF / Word，传统方式依赖人工翻阅、定位章节、摘录表格和整理股权结构，耗时长、易遗漏、难复用。","","技术难点","","文档篇幅长","招股书往往包含数百页内容，章节结构复杂，信息分散在正文、表格、附注和跨页内容中。","","表格结构复杂","股东信息、股权结构、历史沿革、董监高履历等内容常以复杂表格呈现，存在跨页、合并单元格和格式不统一等问题。","","专业语义要求高"],["需要区分发行人、控股股东、实际控制人、历史股东、关联方、董监高等不同主体和关系。","","AI 做法","","• 自动识别释义、发行人基本情况、股权结构、历史沿革等关键章节。","• 自动解析正文和表格，提取股东名称、持股数量、持股比例、股东类型、履历信息等核心要素。","• 自动生成结构化股权结构表、股东履历表和后续图谱构建输入。","","核心价值","","为后续股东穿透、关联关系识别和投资审计提供结构化数据基础。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide21(presentation, ctx) {
  const slide = presentation.slides.add();
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: "#F8FAFC" });
  ctx.addShape(slide, { x: 0, y: 0, w: 10, h: ctx.H, fill: "#155E75" });

  addText(ctx, slide, {
    x: 36,
    y: 28,
    w: 116,
    h: 28,
    text: data.pageLabel,
    fontSize: 14,
    bold: true,
    color: "#155E75",
    typeface: "Aptos",
  });

  addText(ctx, slide, {
    x: 154,
    y: 23,
    w: 1030,
    h: 52,
    text: data.title,
    fontSize: data.title.length > 28 ? 27 : 30,
    bold: true,
    color: "#0F172A",
    typeface: "Aptos Display",
  });

  ctx.addShape(slide, { x: 36, y: 86, w: 1160, h: 1.5, fill: "#CBD5E1" });

  const top = 108;
  const height = 560;
  if (data.columns.length === 2) {
    addText(ctx, slide, {
      x: 54,
      y: top,
      w: 548,
      h: height,
      text: data.columns[0].join("\n"),
      fontSize: data.fontSize,
      color: "#111827",
      typeface: "Aptos",
      insets: { left: 0, right: 18, top: 0, bottom: 0 },
    });
    ctx.addShape(slide, { x: 622, y: top, w: 1, h: height, fill: "#E2E8F0" });
    addText(ctx, slide, {
      x: 646,
      y: top,
      w: 548,
      h: height,
      text: data.columns[1].join("\n"),
      fontSize: data.fontSize,
      color: "#111827",
      typeface: "Aptos",
      insets: { left: 0, right: 18, top: 0, bottom: 0 },
    });
  } else {
    addText(ctx, slide, {
      x: 70,
      y: top,
      w: 1088,
      h: height,
      text: data.columns[0].join("\n"),
      fontSize: data.fontSize,
      color: "#111827",
      typeface: "Aptos",
      insets: { left: 0, right: 20, top: 0, bottom: 0 },
    });
  }

  addText(ctx, slide, {
    x: 1082,
    y: 676,
    w: 96,
    h: 18,
    text: String(data.page).padStart(2, "0") + " / 38",
    fontSize: 12,
    color: "#64748B",
    typeface: "Aptos",
    align: "right",
  });

  return slide;
}
