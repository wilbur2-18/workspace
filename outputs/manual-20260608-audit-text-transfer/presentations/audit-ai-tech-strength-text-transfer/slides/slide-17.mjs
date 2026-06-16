const data = {"page":17,"pageLabel":"第17页","title":"重点解决的真实数据问题","columns":[["","平台真正要解决的，不只是传统数据管理问题，而是审计数据在真实场景中的可用性问题。","","结构化数据的问题","","数据量大，但语义弱","面对百亿级数据、万张级库表，字段命名不统一、表说明不完整、业务语义不清，难以快速判断哪些数据与审计目标相关。","","数据分散，但关系隐蔽","人、企、单位、项目、资金、票据分散在不同系统和表中，缺少统一实体视图和跨表关系识别能力。","","人工找数成本高","传统方式依赖熟悉库表结构的技术或业务人员，审计人员需要反复沟通、试查和改 SQL。","","非结构化数据的问题",""],["资料重要，但不可计算","工商变更、招股书、合同、制度文件、会议纪要、扫描件等资料长期停留在“可阅读、不可计算”的状态。","","格式复杂，人工抽取成本高","长文档、多表格、跨页内容、扫描图像、历史变更文本仅靠规则解析难以稳定处理。","","难以进入后续链路","如果不能结构化，就难以进入批量分析、图谱构建、穿透分析和全量审查流程。","","治理平台的核心目标","","• 让结构化数据更易被理解和调用。","• 让非结构化资料真正转化为可查询、可分析、可复用的数据资产。","• 让治理结果持续输出给图谱平台和综合分析平台。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide17(presentation, ctx) {
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
