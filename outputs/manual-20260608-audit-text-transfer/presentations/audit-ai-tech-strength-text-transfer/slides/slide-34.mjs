const data = {"page":34,"pageLabel":"第34页","title":"应用中心","columns":[["","应用中心：把成熟任务封装为轻量化审计应用","","功能定位","","应用中心面向更偏业务的审计人员，将已有技能、任务模板和任务执行结果封装为可直接使用的轻量化应用。","","核心思路","","当某一次审计任务、某一类技能执行流程或某个成熟分析结果具备复用价值时，可以将其固化为独立应用。后续用户只需输入必要材料或参数，即可自动执行并获得结果。","","典型使用方式","","• 上传材料，自动完成资料解析、要素抽取、疑点识别和结果生成。","• 选择项目或数据范围，自动执行既定核查流程。"],["• 填写少量参数，调用一个或多个技能完成分析任务。","• 面向基层或业务审计人员提供标准化、低门槛入口。","","与技能、任务的关系","","技能 负责能力沉淀和复用。","任务 负责标准化执行和过程管理。","应用中心 负责把技能和任务流程封装成可直接使用的业务入口。","","管理价值","","• 让成熟审计方法能够跨项目复用。","• 让 AI、图谱和任务编排能力对业务人员透明。","• 让优秀项目经验沉淀为组织级应用。","• 让审计机关逐步形成可运营的智能审计应用库。","",""]],"fontSize":15};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide34(presentation, ctx) {
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
