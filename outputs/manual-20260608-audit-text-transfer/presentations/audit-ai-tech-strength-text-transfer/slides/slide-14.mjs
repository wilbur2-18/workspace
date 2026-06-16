const data = {"page":14,"pageLabel":"第14页","title":"向后赋能的数据治理与图谱智能体","columns":[["","向后赋能的数据治理与图谱智能体","","除直接面向审计人员的基础应用外，智能体平台还沉淀了一组面向后续平台的专有智能体能力。","","面向数据治理平台","","数据漫游实体搜集智能体","自动探查库表和字段，识别身份证号、手机号、银行卡号、统一社会信用代码等重点实体，形成实体分布视图和后续取证线索。","","数据贯通智能体","围绕人员、企业、单位、项目、资金等对象，辅助发现跨表、跨库、跨系统之间的潜在关联关系，生成可复核的数据关联依据。"],["","历史变更结构化智能体","面向工商变更、股权变更、高管变更、法定代表人变更等非结构化文本，自动抽取时间、主体、变更事项、变更前后内容和关键数值。","","面向数据图谱平台","","隐含关系挖掘智能体","通过关系定义、图谱查询模板和大模型推理，辅助发现未显式存在的潜在关系。","","关系推理与线索发现智能体","围绕关联交易、利益输送、资金回路、供应链异常等问题执行多跳查询、路径分析和线索生成。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide14(presentation, ctx) {
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
