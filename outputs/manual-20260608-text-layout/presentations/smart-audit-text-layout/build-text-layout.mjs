import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const SOURCE = "/Users/mac/Desktop/workspace/outputs/智慧审计新范式-大模型赋能下的人机协同与价值重塑（0607终稿）.md";
const OUT = "/Users/mac/Desktop/workspace/outputs/智慧审计新范式-基础文字排版版.pptx";
const WORKSPACE = "/Users/mac/Desktop/workspace/outputs/manual-20260608-text-layout/presentations/smart-audit-text-layout";
const PREVIEW_DIR = path.join(WORKSPACE, "preview");
const LAYOUT_DIR = path.join(WORKSPACE, "layout");

const W = 1280;
const H = 720;

const C = {
  navy: "#0B1F3A",
  title: "#102A43",
  body: "#334E68",
  muted: "#829AB1",
  blue: "#0B5CAD",
  cyan: "#12B8A6",
  pale: "#EAF4FF",
  red: "#B42318",
  white: "#FFFFFF",
};

const FONT = "Microsoft YaHei";

function clean(line) {
  return line
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\s+$/g, "")
    .trim();
}

function parseSlides(md) {
  return md
    .split(/\n---\n/g)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw, index) => {
      const lines = raw.split(/\n/).map((line) => line.trimEnd());
      const first = lines.find((line) => line.trim().length > 0) || "";
      return {
        index: index + 1,
        raw,
        title: clean(first),
        lines: lines.slice(lines.indexOf(first) + 1).filter((line) => line.trim().length > 0),
        first,
      };
    });
}

function addText(slide, text, box, style = {}) {
  const shape = slide.shapes.add({
    geometry: "rect",
    position: box,
    fill: { type: "none" },
    line: { fill: { type: "none" }, width: 0 },
  });
  shape.text = text;
  shape.text.typeface = style.typeface || FONT;
  shape.text.fontSize = style.size || 22;
  shape.text.color = style.color || C.body;
  shape.text.lineSpacing = style.lineSpacing || 1.08;
  shape.text.wrap = "square";
  shape.text.autoFit = "shrinkText";
  shape.text.insets = { top: 0, right: 0, bottom: 0, left: 0 };
  if (style.bold) shape.text.bold = true;
  if (style.align) shape.text.alignment = style.align;
  if (style.valign) shape.text.verticalAlignment = style.valign;
  return shape;
}

function setBackground(slide, color) {
  slide.background.fill = { type: "solid", color };
}

function approxWidth(text, size) {
  let width = 0;
  for (const ch of text) {
    if (/[\x00-\x7F]/.test(ch)) width += size * 0.55;
    else width += size * 0.94;
  }
  return Math.max(8, width);
}

function splitInline(line) {
  const pieces = [];
  let rest = line.trim();
  while (rest.length) {
    const boldStart = rest.indexOf("**");
    if (boldStart < 0) {
      pieces.push({ text: rest, kind: "normal" });
      break;
    }
    if (boldStart > 0) pieces.push({ text: rest.slice(0, boldStart), kind: "normal" });
    const after = rest.slice(boldStart + 2);
    const boldEnd = after.indexOf("**");
    if (boldEnd < 0) {
      pieces.push({ text: after, kind: "strong" });
      break;
    }
    pieces.push({ text: after.slice(0, boldEnd), kind: "strong" });
    rest = after.slice(boldEnd + 2);
  }
  return pieces.filter((p) => p.text.trim().length > 0);
}

function addInline(slide, pieces, x, y, maxW, size = 18, color = C.body) {
  let cursorX = x;
  let cursorY = y;
  let lineH = Math.round(size * 1.55);
  for (const piece of pieces) {
    const text = piece.text.replace(/\s+/g, " ").trim();
    const isStrong = piece.kind === "strong";
    const rawW = approxWidth(text, size + (isStrong ? 1 : 0)) + 8;
    const w = Math.min(maxW, rawW);
    if (cursorX > x && cursorX + w > x + maxW) {
      cursorX = x;
      cursorY += lineH;
    }
    const availableW = cursorX === x ? maxW : Math.max(80, x + maxW - cursorX);
    const wrappedLines = Math.max(1, Math.ceil(rawW / availableW));
    const h = lineH * wrappedLines;
    addText(slide, text, { left: cursorX, top: cursorY, width: Math.min(w, availableW), height: h }, {
      size: isStrong ? size + 1 : size,
      color: isStrong ? C.blue : color,
      bold: isStrong,
    });
    if (wrappedLines > 1) {
      cursorX = x;
      cursorY += h;
    } else {
      cursorX += w + 2;
    }
  }
  return cursorY + lineH;
}

function classifyLine(line) {
  const t = line.trim();
  if (!t) return { kind: "blank", text: "" };
  if (/^##\s+/.test(t)) return { kind: "subhead", text: clean(t) };
  if (/^[-•]\s+/.test(t)) return { kind: "bullet", text: t.replace(/^[-•]\s+/, "") };
  if (/^[0-9一二三四五六七八九十]+[、.]/.test(t)) return { kind: "step", text: t };
  if (/^（.*截图.*）$/.test(t) || /^（本页.*截图.*）$/.test(t)) return { kind: "note", text: t };
  if (/^\*\*[^*]+\*\*[:：]?\s*$/.test(t)) return { kind: "group", text: clean(t).replace(/[:：]$/, "") };
  const labelMatch = /^([^：:]{2,24})[：:]\s*(.*)$/.exec(clean(t));
  if (labelMatch) {
    return labelMatch[2].trim()
      ? { kind: "label", text: clean(t) }
      : { kind: "group", text: labelMatch[1].trim() };
  }
  if (/→/.test(t)) return { kind: "flow", text: clean(t) };
  return { kind: "para", text: t };
}

function contentDensity(lines) {
  return lines.reduce((sum, line) => sum + clean(line).length, 0);
}

function addHeader(slide, title, pageNo) {
  addText(slide, String(pageNo).padStart(2, "0"), { left: 64, top: 32, width: 52, height: 28 }, {
    size: 16,
    color: C.cyan,
    bold: true,
  });
  addText(slide, title, { left: 116, top: 28, width: 1010, height: 56 }, {
    size: title.length > 25 ? 28 : 32,
    color: C.title,
    bold: true,
  });
  addText(slide, "智慧审计新范式", { left: 1092, top: 36, width: 116, height: 20 }, {
    size: 12,
    color: C.muted,
    align: "right",
  });
}

function layoutCover(presentation, slideData) {
  const slide = presentation.slides.add();
  setBackground(slide, C.navy);
  const lines = slideData.lines.map(clean).filter(Boolean);
  addText(slide, lines[0] || "智慧审计新范式", { left: 108, top: 180, width: 980, height: 72 }, {
    size: 52,
    color: C.white,
    bold: true,
  });
  addText(slide, lines[1] || "大模型赋能下的人机协同与价值重塑", { left: 112, top: 270, width: 920, height: 42 }, {
    size: 28,
    color: "#D9EAF7",
  });
  const keywords = (lines[2] || "").split(/[｜|]/).map((s) => s.trim()).filter(Boolean);
  let x = 112;
  for (const kw of keywords) {
    const w = approxWidth(kw, 17) + 24;
    addText(slide, kw, { left: x, top: 378, width: w, height: 28 }, {
      size: 17,
      color: C.cyan,
      bold: true,
    });
    x += w + 18;
  }
  return slide;
}

function layoutToc(presentation, slideData) {
  const slide = presentation.slides.add();
  setBackground(slide, "#F7FAFC");
  addText(slide, "目录", { left: 88, top: 76, width: 380, height: 56 }, {
    size: 40,
    color: C.title,
    bold: true,
  });
  addText(slide, "CONTENTS", { left: 91, top: 132, width: 180, height: 24 }, {
    size: 13,
    color: C.cyan,
    bold: true,
  });
  let y = 190;
  for (const item of slideData.lines.map(clean).filter(Boolean)) {
    const m = /^(\d{2})\s+(.+)$/.exec(item);
    const no = m ? m[1] : "";
    const text = m ? m[2] : item;
    addText(slide, no, { left: 102, top: y, width: 48, height: 28 }, {
      size: 20,
      color: C.blue,
      bold: true,
    });
    addText(slide, text, { left: 172, top: y, width: 850, height: 30 }, {
      size: 22,
      color: C.body,
    });
    y += 54;
  }
  return slide;
}

function layoutSection(presentation, slideData) {
  const slide = presentation.slides.add();
  setBackground(slide, C.navy);
  const m = /^(\d{2})\s*(.+)$/.exec(slideData.title);
  const no = m ? m[1] : String(slideData.index).padStart(2, "0");
  const title = m ? m[2] : slideData.title;
  addText(slide, no, { left: 104, top: 188, width: 160, height: 82 }, {
    size: 64,
    color: C.cyan,
    bold: true,
  });
  addText(slide, title, { left: 104, top: 286, width: 920, height: 110 }, {
    size: title.length > 20 ? 36 : 42,
    color: C.white,
    bold: true,
  });
  addText(slide, "AI 原生审计能力链路", { left: 108, top: 468, width: 300, height: 28 }, {
    size: 16,
    color: "#B6D4E8",
  });
  return slide;
}

function addLabelLine(slide, text, x, y, maxW, size) {
  const [label, ...rest] = text.split(/[:：]/);
  const labelText = `${label}：`;
  const labelW = Math.min(maxW * 0.35, approxWidth(labelText, size) + 12);
  addText(slide, labelText, { left: x, top: y, width: labelW, height: size * 1.7 }, {
    size,
    color: C.blue,
    bold: true,
  });
  if (rest.join("：").trim()) {
    addText(slide, rest.join("：").trim(), { left: x + labelW + 4, top: y, width: maxW - labelW - 4, height: size * 2.1 }, {
      size,
      color: C.body,
    });
  }
}

function layoutFlowOnly(slide, text, y) {
  const steps = text.split(/→/).map((s) => s.trim()).filter(Boolean);
  const gap = 18;
  const boxW = Math.min(160, Math.floor((1070 - gap * (steps.length - 1)) / steps.length));
  let x = 88;
  for (const [idx, step] of steps.entries()) {
    addText(slide, step, { left: x, top: y, width: boxW, height: 58 }, {
      size: step.length > 8 ? 15 : 17,
      color: idx === steps.length - 1 ? C.cyan : C.blue,
      bold: true,
      align: "center",
      valign: "middle",
    });
    if (idx < steps.length - 1) {
      addText(slide, "→", { left: x + boxW + 2, top: y + 14, width: gap, height: 26 }, {
        size: 18,
        color: C.muted,
        align: "center",
      });
    }
    x += boxW + gap;
  }
  return y + 80;
}

function layoutContent(presentation, slideData) {
  const slide = presentation.slides.add();
  setBackground(slide, "#FFFFFF");
  addHeader(slide, slideData.title.replace(/^第\d+页[｜|]/, ""), slideData.index);

  const density = contentDensity(slideData.lines);
  const hasSubheads = slideData.lines.some((l) => /^##\s+/.test(l));
  const twoCol = density > 360 || slideData.lines.length > 16 || hasSubheads;
  const leftX = 88;
  const colGap = 46;
  const colW = twoCol ? 500 : 1060;
  let x = leftX;
  let y = 114;
  let col = 0;
  let pendingFlow = [];

  const flushFlow = () => {
    if (!pendingFlow.length) return;
    if (twoCol && col === 1) {
      x = leftX;
      col = 0;
      y += 20;
    }
    y = layoutFlowOnly(slide, pendingFlow.join(" → "), y);
    pendingFlow = [];
  };

  for (let lineIndex = 0; lineIndex < slideData.lines.length; lineIndex += 1) {
    const rawLine = slideData.lines[lineIndex];
    const info = classifyLine(rawLine);
    if (info.kind !== "flow" && pendingFlow.length) flushFlow();

    if (twoCol && col === 0 && (y > 510 || (!hasSubheads && lineIndex >= Math.ceil(slideData.lines.length * 0.55)))) {
      col = 1;
      x = leftX + colW + colGap;
      y = 114;
    }

    if (info.kind === "subhead") {
      if (twoCol && col === 0 && /^(1\s*个|非结构化)/.test(info.text)) {
        col = 1;
        x = leftX + colW + colGap;
        y = 114;
      }
      y += y === 114 ? 0 : 14;
      addText(slide, info.text, { left: x, top: y, width: colW, height: 32 }, {
        size: 21,
        color: C.blue,
        bold: true,
      });
      y += 40;
      continue;
    }

    if (info.kind === "group") {
      y += 10;
      addText(slide, info.text, { left: x, top: y, width: colW, height: 26 }, {
        size: 18,
        color: C.blue,
        bold: true,
      });
      y += 32;
      continue;
    }

    if (info.kind === "label") {
      addLabelLine(slide, info.text, x, y, colW, 17);
      y += info.text.length > 36 ? 46 : 30;
      continue;
    }

    if (info.kind === "bullet") {
      addText(slide, "•", { left: x, top: y + 1, width: 18, height: 22 }, {
        size: 16,
        color: C.cyan,
        bold: true,
      });
      const bulletLabel = /^([^：:]{2,18})[：:]\s*(.+)$/.exec(info.text);
      if (bulletLabel) {
        addText(slide, `${bulletLabel[1]}：`, { left: x + 24, top: y, width: colW - 24, height: 22 }, {
          size: 16,
          color: C.blue,
          bold: true,
        });
        const rawW = approxWidth(bulletLabel[2], 15) + 8;
        const lines = Math.max(1, Math.ceil(rawW / (colW - 42)));
        addText(slide, bulletLabel[2], { left: x + 42, top: y + 23, width: colW - 42, height: lines * 24 }, {
          size: 15,
          color: C.body,
        });
        y += 27 + lines * 24;
        continue;
      }
      const pieces = splitInline(info.text);
      y = addInline(slide, pieces, x + 24, y, colW - 24, 16, C.body);
      y += 3;
      continue;
    }

    if (info.kind === "step") {
      addText(slide, info.text.replace(/^([0-9一二三四五六七八九十]+[、.]).*$/, "$1"), { left: x, top: y, width: 34, height: 26 }, {
        size: 16,
        color: C.blue,
        bold: true,
      });
      const body = info.text.replace(/^[0-9一二三四五六七八九十]+[、.]\s*/, "");
      addText(slide, body, { left: x + 42, top: y, width: colW - 42, height: 28 }, {
        size: 17,
        color: C.body,
      });
      y += 34;
      continue;
    }

    if (info.kind === "flow") {
      pendingFlow.push(info.text);
      continue;
    }

    if (info.kind === "note") {
      addText(slide, info.text, { left: x, top: Math.max(y + 8, 600), width: colW, height: 28 }, {
        size: 13,
        color: C.muted,
      });
      y += 34;
      continue;
    }

    const text = info.text.trim();
    if (!text) continue;
    const metric = text.match(/^(.*?)(\d+(?:\.\d+)?\s*(?:亿|万|小时|分钟|份|条|家|节点|边)[^，,。]*)/);
    if (metric && text.length < 42) {
      const prefix = metric[1].trim();
      const number = metric[2].trim();
      if (prefix) {
        addText(slide, prefix, { left: x, top: y, width: Math.min(260, approxWidth(prefix, 18) + 8), height: 30 }, {
          size: 18,
          color: C.body,
        });
      }
      addText(slide, number, { left: x + (prefix ? Math.min(260, approxWidth(prefix, 18) + 16) : 0), top: y - 3, width: colW, height: 40 }, {
        size: 28,
        color: C.cyan,
        bold: true,
      });
      y += 46;
      continue;
    }
    const pieces = splitInline(rawLine);
    y = addInline(slide, pieces, x, y, colW, density > 520 ? 15 : 17, C.body);
    y += 8;
  }
  flushFlow();
  return slide;
}

async function main() {
  const md = await fs.readFile(SOURCE, "utf8");
  const slides = parseSlides(md);
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  for (const slideData of slides) {
    if (slideData.index === 1) layoutCover(presentation, slideData);
    else if (slideData.index === 2) layoutToc(presentation, slideData);
    else if (/^\d{2}\s/.test(slideData.title)) layoutSection(presentation, slideData);
    else layoutContent(presentation, slideData);
  }

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(LAYOUT_DIR, { recursive: true });

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(OUT);

  const sampleSlides = [1, 4, 9, 13, 34, presentation.slides.count];
  for (const sampleNo of sampleSlides) {
    const slide = presentation.slides.getItem(sampleNo - 1);
    const png = await presentation.export({ slide, format: "png", scale: 0.7 });
    await fs.writeFile(
      path.join(PREVIEW_DIR, `slide-${String(sampleNo).padStart(2, "0")}.png`),
      Buffer.from(await png.arrayBuffer()),
    );
  }

  const manifest = {
    output: OUT,
    slideCount: presentation.slides.count,
    source: SOURCE,
    rule: "Separate text boxes for title, group labels, bullets, inline strong text, metrics, flow steps, and muted screenshot notes.",
  };
  await fs.writeFile(path.join(WORKSPACE, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
