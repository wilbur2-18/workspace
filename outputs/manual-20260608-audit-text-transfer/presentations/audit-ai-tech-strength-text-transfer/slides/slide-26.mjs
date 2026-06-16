const data = {"page":26,"pageLabel":"第26页","title":"案例：关联穿透审计","columns":[["","案例：关联穿透审计｜人企要素全息图谱构建","","数据汇聚梳理","","面向关联穿透审计，平台可汇聚和梳理多源数据：","","• 人口库","• 工商登记","• 社保","• 发票","• 银行","• 国库支付","• 医院","• 行驶证","• 编办数据","• 多维数据漫游结果","","知识图谱构建","","实体类型","","• 人员","• 企业","• 行政事业单位","• 项目","• 账户","• 票据","• 车辆","• 医疗机构"],["","关系类型","","• 股权关系","• 任职关系","• 亲属 / 关联关系","• 业务往来","• 资金往来","• 发票往来","• 项目关联","• 单位隶属","","技术路径","","多源数据接入","→ 重点实体识别","→ 唯一标识归并","→ 关系映射入图","→ 路径穿透分析","→ AI 关系推理","→ 疑点线索输出","","最终效果","","让“谁和谁有关系、钱从哪儿来、往哪儿去、通过什么主体发生联系”在一张图上清晰可见，辅助锁定深层违规线索。","",""]],"fontSize":13.5};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide26(presentation, ctx) {
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
