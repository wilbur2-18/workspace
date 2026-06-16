const data = {"page":24,"pageLabel":"第24页","title":"图谱基础管理与构建","columns":[["","图谱基础管理与构建：从本体到入图的统一组织能力","","图谱空间与权限管理","","图谱全生命周期管理","支持图谱新建、JSON 导入、导出、编辑、数据清除、删除等全生命周期管理。清除数据时可保留本体结构，便于重建。","","图谱级权限管控","支持按用户、部门维度配置访问与编辑权限，实现多团队并行分析下的数据安全隔离。","","工作台驾驶舱","提供平台级数据资产视图，统计图谱总数、节点总量、关系总量和接入数据源数量，并展示本体类型分布和数据源构成。","","本体建模能力","","实体类型定义","支持表单模式和 SQL 模式定义实体类型。表单模式面向业务人员，SQL 模式面向技术人员。","","关系类型定义","支持定义关系名称、属性字段、方向性约束和数据溯源链接。","","本体拓扑可视化校验","以拓扑图渲染当前图谱业务模型，支持交互式校验属性配置。"],["","多源数据接入与映射","","数据溯源链接","支持为实体类型和关系类型配置 URL 模板，图谱分析时可直接从节点或边跳转至原始数据源表。","","多源数据接入","支持对接外部关系型数据库作为图谱数据源，将结构化数据纳入图谱构建流程。","","实体映射引擎","提供可视化实体数据映射能力，将数据源表字段转换为图谱实体节点，并通过唯一标识字段去重。","","关系映射引擎","提供可视化关系数据映射能力，支持将数据源表转换为图谱关系边。","","入图任务与可审计性","","数据导入任务调度","以任务化方式管理数据导入过程，支持配置调度策略与运行参数。","","入图过程可追溯","每次导入均可追溯至具体映射规则与任务实例，支持数据清除与重跑。","",""]],"fontSize":13.5};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide24(presentation, ctx) {
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
