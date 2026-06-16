const data = {"page":23,"pageLabel":"第23页","title":"数据图谱平台：关系建模与线索挖掘","columns":[["","数据图谱平台：构建审计实体全息穿透网络","","审计线索往往不在单张表、单份资料或单个系统中，而隐藏在人、企业、单位、项目、资金、票据等对象之间的多跳关系中。","","从“孤立点查”走向“全息网查”","","本体建模","通过本体建模，将人员、企业、行政事业单位、项目、资金、合同、发票等对象定义为可计算实体。","","多源映射","通过数据库、治理结果、文档抽取结果和外部数据源映射，将实体和关系持续写入图谱。","","关系穿透","围绕股权关系、任职关系、业务往来、资金往来、项目关联、票据链路等关系进行多跳穿透。"],["","图上分析","通过路径分析、最短路径、环检测、邻居高亮、社区布局等方式识别复杂关联结构。","","AI 推理","基于大模型问图、关系语义定义和推理模板，发现图谱中未显式存在的隐含关系。","","场景落地","","• 审计人企机关全息图谱构建","• 隐含关系深度计算与发现","• 工程项目供应链关系贯通","• 资金回路、关联交易和利益共同体识别","","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide23(presentation, ctx) {
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
