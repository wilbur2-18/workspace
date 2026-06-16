const data = {"page":19,"pageLabel":"第19页","title":"核心能力：数据漫游与文本结构化","columns":[["","数据漫游与文本结构化：两类核心治理能力","","数据漫游：从数据库中自动发现有价值的数据","","全量库表探查","基于大模型和字段识别规则，对库表进行全量探查，形成数据库表资产视图。","","字段语义理解","自动推断字段含义、业务主题和潜在用途，降低人工读表成本。","","重点实体识别","自动识别身份证号、银行卡号、手机号、统一社会信用代码、企业名称等重点实体字段。","","多表关系发现","辅助发现人员、企业、单位、项目等对象在多张表之间的潜在关联关系。"],["","取证 SQL 生成","围绕发现的实体和关系生成可执行 SQL，为审计取证和后续复核提供依据。","","文本结构化：把资料转化为可计算数据","","复杂资料解析","面向股权变更、招股书、合同、制度文件、扫描件等非结构化资料自动提取关键要素。","","结构化结果输出","将原本只能人工阅读的资料转化为可查询、可分析、可复用的数据资产。","","下游链路承接","为后续图谱构建、历史追溯、批量核查和综合分析提供输入。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide19(presentation, ctx) {
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
