const data = {"page":36,"pageLabel":"第36页","title":"案例：大批量材料自动化批量审计","columns":[["","案例：大批量材料自动化批量审计","","典型场景","","近百份项目资料，如招标文件、合同文件、项目说明、评审材料、付款资料等，传统方式依赖人工翻阅进行查询、比对和判断。","","传统问题","","• 材料数量大，人工阅读耗时长。","• 同类信息分散在不同文件中，人工比对容易遗漏。","• 不同项目之间标准不一，审计结果难以统一。","• 报告整理依赖人工，难以快速形成批量成果。","","技术路径","","通过“对话 + 审计技能 + 批量任务”为大模型提供审计思路，由模型利用查询、解析、抽取、分析和比对工具完成大批量审计任务。"],["","执行链路：","","资料上传","→ OCR / 文档解析","→ 要素抽取","→ 技能挂载","→ 批量任务执行","→ 疑点识别","→ 结果复核","→ 报告生成","","应用成效","","耗时 3 小时，自动审计上百份资料，自动产出数十份审计分析报告。","","平台将审计人员从大量重复阅读、抽取和整理工作中释放出来。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide36(presentation, ctx) {
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
