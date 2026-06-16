const data = {"page":27,"pageLabel":"第27页","title":"贯通案例：工程项目供应链","columns":[["","贯通案例：基于数据贯通，描绘工程项目有关供应链","","审计场景","","工程项目审计中，发票备注、合同信息、供应商信息和项目资料之间存在大量关联关系，可用于识别供应链异常、关联交易、履约风险和价格异常。","","传统痛点","","实际业务数据中经常存在：","","• 项目名称缺字","• 简称与全称混用","• 同义词表达","• 供应商名称不一致","• 发票备注不规范","• 合同名称与项目名称无法直接匹配","• 同一货物或服务在不同系统中表述不同","","这些问题导致同一个项目、同一个供应商或同一类货物在不同系统中“连不上”，人工整理成本高。","","AI 做法","","利用大模型的语义识别能力和数据图谱平台，对发票备注、项目名称、供应商名称、合同信息和货物信息进行统一识别与关联匹配。"],["","技术链路：","","文本语义识别","→ 项目名称归一","→ 供应商主体匹配","→ 合同 / 发票 / 货物关系抽取","→ 图谱关系构建","→ 项目供应链展示","→ 异常路径识别","","应用成效","","输入项目名称，即可得到项目有关供应链，帮助审计人员查看上下游供应商、发票、货物和交易链路。","","可辅助识别：","","• 供应链层级过长","• 异常加价","• 关联供应商","• 同一实际控制人控制多个供应商","• 发票与合同、项目不匹配","• 货物或服务流向异常","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide27(presentation, ctx) {
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
