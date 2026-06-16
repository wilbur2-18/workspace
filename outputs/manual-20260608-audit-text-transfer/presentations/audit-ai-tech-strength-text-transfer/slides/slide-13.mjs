const data = {"page":13,"pageLabel":"第13页","title":"票据溯源与供应链追查","columns":[["","典型场景：票据溯源与供应链追查","","针对某个大额发票，追查上级经销商进货发票，直至生产商或进口商，分析是否存在加价过大、链路过长或关联交易。","","传统问题","","• 发票链路涉及多个主体、多个层级和多张票据。","• 人工追溯需要反复查询、比对、整理和画链路。","• 容易遗漏关键节点，难以快速识别异常加价和异常流转路径。","• 单次分析结果难以沉淀为可复用任务能力。","","AI 做法"],["","• 识别发票、货物、供应商、经销商、生产商、金额、时间等关键对象。","• 通过数据库查询、文本抽取和关系匹配，自动组织销售链路。","• 对链路层级、价格变化、主体关系和异常节点进行分析。","• 输出链路结构、价格变化表、疑点说明和可复核依据。","","应用成效","","系统可梳理完整销售链路，并分析销售加价情况，辅助开展合规评估和异常识别。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide13(presentation, ctx) {
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
