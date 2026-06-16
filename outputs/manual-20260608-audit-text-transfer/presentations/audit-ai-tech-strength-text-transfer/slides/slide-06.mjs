const data = {"page":6,"pageLabel":"第06页","title":"我们的解法：AI 原生审计产品体系","columns":[["","我们的解法不是在传统系统外层增加 AI 问答入口，而是围绕审计作业链路重新组织数据、智能体、图谱和综合分析能力。","","这套产品体系围绕三类核心问题展开：","","如何避免大模型幻觉","通过原文引用、数据溯源、图谱路径、SQL 和任务记录，让 AI 结论具备可追溯、可复核的依据链条。","","如何让大模型具备审计思路","将核查路径、判断规则和分析步骤转化为智能体、技能、模板和应用，使 AI 按照审计逻辑执行任务。"],["","如何让大模型与审计人员协作","通过项目工作台、任务过程展示和结果复核，让 AI 处理高频重复工作，让审计人员聚焦疑点判断和问题定性。","","产品体系的底层设计原则：","","• 数据在域内，权限可控","• 能力可编排，任务可监控","• 结果有依据，结论可复核","• 经验可沉淀，能力可复用","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide06(presentation, ctx) {
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
