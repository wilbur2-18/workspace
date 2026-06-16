const data = {"page":38,"pageLabel":"第38页","title":"AI 原生审计产品体系的核心价值","columns":[["","AI 原生审计产品体系的核心价值","","四个平台形成一体化闭环","","智能体平台","提供 AI 能力底座，统一承接知识、数据、工具、模型和权限资源，支撑智能问数、知识问答和专有智能体能力生产。","","数据治理平台","解决复杂数据可用性问题，让结构化数据更易理解，让非结构化资料转化为可查询、可分析、可入图的数据资产。","","数据图谱平台","将治理结果组织为可穿透、可追溯、可分析、可推理的关系网络，支撑关联穿透、路径追溯、AI 关系推理和批量线索发现。","","综合分析平台","统一承接多源资源、审计助手、任务、技能和应用，形成面向审计作业的聚合工作入口和成果沉淀空间。","","体系壁垒"],["","复杂数据治理壁垒","覆盖结构化库表、非结构化资料、历史变更文本、长文档、扫描件和复杂表格。","","AI + 图谱融合壁垒","不是简单图谱展示，而是本体建模、多源入图、路径分析、图上算法、关系推理和批量任务一体化。","","智能体工程化壁垒","统一纳管模型、知识、数据库、工具和权限，支撑任务型智能体和专有智能体能力沉淀。","","审计作业闭环壁垒","从数据理解、关系发现、任务执行到证据复核和能力沉淀，形成可进入真实审计作业的闭环能力。","","一句话总结","","这套体系形成了从数据理解、关系发现、任务执行到能力沉淀的闭环。真正的壁垒不在单个功能，而在于围绕审计场景持续打磨形成的 AI 原生能力链路。",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide38(presentation, ctx) {
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
