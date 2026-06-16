const data = {"page":33,"pageLabel":"第33页","title":"技能","columns":[["","技能：把审计方法沉淀为可复用的执行能力","","核心定位","","技能是平台中可复用的分析方法和执行配置，用于把成熟的核查路径、判断规则和资源调用方式沉淀为可重复执行的能力单元。","","一个审计技能通常包含","","输入要求","需要哪些资料、数据表、图谱、参数和业务范围。","","执行步骤","包括资料解析、要素抽取、数据查询、图谱穿透、规则判断、差异比对、结果生成等动作。","","资源调用方式","调用哪些数据库、知识库、图谱、文档、OCR 能力、智能体或外部工具。","","判断逻辑"],["将审计规则、风险特征、异常阈值和判断条件固化为可执行逻辑。","","输出结构","定义输出字段、疑点说明、依据引用和复核建议。","","证据要求","要求结果能够关联原始资料、数据库记录、图谱路径、法规依据和任务日志。","","形成方式","","• 基于成熟模板形成标准化技能。","• 在项目复盘后把有效核查路径整理为组织级技能资产。","","使用价值","","技能可支撑不同任务、不同资料类型和不同审计场景的快速复用，让平台从一次性分析走向持续沉淀和反复执行。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide33(presentation, ctx) {
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
