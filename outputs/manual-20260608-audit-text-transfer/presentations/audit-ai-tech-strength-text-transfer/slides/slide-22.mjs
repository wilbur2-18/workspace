const data = {"page":22,"pageLabel":"第22页","title":"实体漫游搜集","columns":[["","典型场景：实体漫游搜集","","关键审计信息，如电话、银行卡号、身份证号、统一社会信用代码、企业名称、项目编号等，往往散落在多张数据表、多个业务系统中。","","传统问题","","实体分布不清","同一类实体可能出现在不同系统、不同库、不同表和不同字段中，人工很难快速掌握全貌。","","字段含义不明","大量字段缺少清晰注释，仅凭字段名难以判断其业务含义和审计价值。","","多表关系难发现","缺乏统一的实体关联视图，人工难以发现多表之间的深层逻辑联系。"],["","AI 做法","","• 自动探查并汇总实体在各系统、各表中的分布情况和出现频次。","• 自动推断字段含义并生成单表业务摘要。","• 识别身份证号、手机号、银行卡号、统一社会信用代码等重点实体。","• 挖掘多表之间的潜在关联关系。","• 生成对应 SQL 作为审计取证和后续复核依据。","","核心价值","","把分散在数据库中的实体信息转化为可追踪、可关联的数据基础。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide22(presentation, ctx) {
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
