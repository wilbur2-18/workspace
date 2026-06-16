const data = {"page":20,"pageLabel":"第20页","title":"工商变更治理与企业历史股权治理","columns":[["","典型场景：工商变更治理与企业历史股权治理","","某省会 184 万家企业累计数百万条工商变更记录，历史股权信息长期以非结构化文本形式存在，过去主要依赖人工阅读、摘录和局部核查。","","传统问题","","资料能看到，但无法计算","工商变更文本中包含大量股东、出资额、持股比例、法定代表人、高管等信息，但文本格式不统一，难以直接进入数据库分析。","","历史链条难还原","股权变化涉及多个时间点、多个股东和多轮变更，人工整理历史时间线成本高、遗漏风险大。","","无法支撑全量审查","传统方式很难对海量企业历史变更进行批量计算、股权穿透、关联识别和全量审查。","","AI 做法",""],["通过数据治理平台自动解析历史工商变更和股权变更文本，提取：","","• 变更时间","• 股东信息","• 投资额","• 持股比例","• 法定代表人变化","• 高管变化","• 变更前后内容","","形成结构化股东清单、企业历史股权时间线和后续可入图的数据资产。","","应用成效","","30 小时解析超百万家企业、1300 万条历史工商变更存量数据。","","过去只能阅看的数据，被转化为可计算、可分析、可入图的数据资产。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide20(presentation, ctx) {
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
