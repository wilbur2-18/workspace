const data = {"page":7,"pageLabel":"第07页","title":"解法路径：连接存量数据、实际业务与智能体能力","columns":[["","在具体路径上，我们不替代现有业务系统，也不重复建设传统数据平台，而是在已有数据、资料、系统和知识基础上，建立“存量数据 - 实际业务 - 智能体能力”的桥梁。","","已有基础：政务数据与审计数据底座","包括数据归集、数据目录、库表管理、指标模型、业务系统和项目资料。","","增量能力一：AI 数据理解层","通过数据漫游、字段识别、文档解析、实体识别和结构化抽取，让数据和资料能被 AI 稳定调用。","","增量能力二：图谱关系贯通层","围绕人、企、单位、项目、资金、合同、发票等对象，建立跨系统、跨表、跨资料的关系网络。"],["","增量能力三：智能审计作业层","把审计规则、核查路径和专家经验封装为智能体、技能、任务和应用，支撑批量核查和成果沉淀。","","这套产品体系重点解决五类问题：","","• 海量非结构化资料的数据治理","• 多源数据贯通与隐含价值挖掘","• 人、企、单位、项目、资金图谱搭建与疑点挖掘","• 大批量审计核查任务自动化执行","• 审计思路沉淀与团队共享","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide07(presentation, ctx) {
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
