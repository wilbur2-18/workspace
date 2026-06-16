const data = {"page":25,"pageLabel":"第25页","title":"图谱分析、推理与批量任务","columns":[["","图谱分析、推理与批量任务：让图谱进入真实审计分析过程","","多模式图谱探查","","预置探查方法","内置实体信息查询、路径分析、图查询语句三种探查方法。","","渐进式探查","支持通过步数与条件过滤逐步展开关联网络。","","节点 / 边详情与溯源","支持查看节点和边的属性信息及数据源链接，点击可直接穿透至原始数据表。","","图谱动态拓展","支持从已有节点出发进行关联拓展，提供直接拓展与条件拓展两种模式。","","图上分析与可视化","","图上分析算法","内置直接邻居高亮、最短路径计算、环检测等图分析算法。","","多布局可视化","支持中心布局与社区布局，适配不同分析场景。",""],["查询模板与外部能力集成","","图数据查询模板","支持通过命令行模板自定义图谱查询逻辑，定义变量参数并绑定实体 / 关系属性。","","模板管理","支持数据模板创建、编辑、删除和在线测试。","","AI 关系推理引擎","","从“已知查询”到“未知推理”","传统图谱查询解决“已知关系怎么查”，AI 关系推理解决“未知关系怎么发现”。","","自然语言定义关系语义","支持通过自然语言描述待推理关系，配置推理 Prompt、关联数据模板和大模型。","","批量图谱任务","","批量图谱查询","支持基于 Excel 数据驱动数据模板批量执行图谱查询，通过列映射将表格数据自动注入查询参数。","","批量关系推理","支持基于 Excel 数据驱动推理模板批量执行关系推理，任务完成后输出结构化 JSON 推理结果。","",""]],"fontSize":13.5};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide25(presentation, ctx) {
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
