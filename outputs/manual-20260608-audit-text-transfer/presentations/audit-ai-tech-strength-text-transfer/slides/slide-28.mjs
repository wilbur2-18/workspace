const data = {"page":28,"pageLabel":"第28页","title":"综合分析平台：任务执行与应用承接","columns":[["","综合分析平台：人机协同的统一工作入口与审计作业执行层","","综合分析平台将数据、知识、图谱、智能体和审计成果统一收口，形成审计人员可操作、可沉淀的人机协同工作台。","","赋予 AI 行动能力","","为大模型配置读取、检索、抽取、比对、计算、生成等工具，使其能够围绕具体审计任务执行多步骤操作。","","赋予 AI 专业能力","","将专家核查逻辑、规则匹配方式和风险识别方法沉淀为标准化技能。"],["","统一的项目工作空间","","每个专项任务拥有独立空间，项目资料、关联数据库、图谱、知识库、审计技能和任务结果按权限统一管理。","","沉浸式审计助手交互","","审计人员可在同一界面中查看资料、调用图谱、查询数据库、检索制度，并通过自然语言引导 AI 开展分析。","","审计技能沉淀","","审计人员完成一次高质量分析后，可以将核查路径、判断规则、分析步骤和引用依据沉淀为标准化审计技能。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide28(presentation, ctx) {
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
