const data = {"page":11,"pageLabel":"第11页","title":"平台定位与能力底座","columns":[["","智能体平台：统一纳管知识、数据、工具和模型的 AI 能力底座","","MindJunc 智能体平台是一款以大模型知识库为核心的智能体应用平台，支持多源知识库管理、RAG 增强检索、MCP 工具集成、数据库连接、应用组装和精细化权限管控。","","知识与资源纳管","支持创建多类型知识库，上传 Docx、PDF、TXT、Excel、CSV 等资料，配置切片、向量化、召回测试和引用溯源。","","模型与算法资源管理","支持大语言模型、Embedding 模型、Rerank 模型等多模型配置，支持不同模型组合调用。"],["","数据与工具连接","支持数据库连接、MCP 服务、API 工具和第三方能力接入。","","应用组装能力","基于知识库、数据库、MCP 工具和模型能力组装知识问答、智能问数、文档处理等应用。","","权限与安全控制","支持部门、用户、知识库、应用和数据资源级权限控制。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide11(presentation, ctx) {
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
