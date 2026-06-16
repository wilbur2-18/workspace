import fs from "node:fs/promises";
import path from "node:path";

const workspace = path.resolve("outputs/manual-20260608-audit-text-transfer/presentations/audit-ai-tech-strength-text-transfer");
const sourcePath = path.resolve("outputs/audit-ai-tech-strength-ppt内容正式稿-20260607.md");
const slidesDir = path.join(workspace, "slides");

function stripMarkdown(value) {
  return value
    .replace(/^#{1,6}\s+/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trimEnd();
}

function normalizeLine(raw) {
  const line = raw.trim();
  if (!line) return "";
  if (/^- /.test(line)) return `• ${stripMarkdown(line.replace(/^- /, ""))}`;
  if (/^\d+\.\s+/.test(line)) return stripMarkdown(line);
  return stripMarkdown(line);
}

function estimateWeight(line) {
  if (!line) return 0.55;
  const cjk = (line.match(/[\u3400-\u9fff]/g) || []).length;
  const other = line.length - cjk;
  return Math.max(1, Math.ceil((cjk + other * 0.58) / 24));
}

function splitColumns(lines) {
  const total = lines.reduce((sum, line) => sum + estimateWeight(line), 0);
  const target = total / 2;
  let acc = 0;
  let split = lines.length;
  for (let index = 0; index < lines.length; index += 1) {
    acc += estimateWeight(lines[index]);
    if (acc >= target && index >= 4) {
      split = index + 1;
      break;
    }
  }
  return [lines.slice(0, split), lines.slice(split)];
}

function parseSlides(markdown) {
  const lines = markdown.split(/\r?\n/);
  const slides = [];
  let current = null;

  for (const rawLine of lines) {
    const match = rawLine.match(/^##\s+第(\d+)页｜(.+)$/);
    if (match) {
      if (current) slides.push(current);
      current = {
        page: Number.parseInt(match[1], 10),
        pageLabel: `第${match[1]}页`,
        title: match[2].trim(),
        body: [],
      };
      continue;
    }
    if (!current) continue;
    if (rawLine.trim() === "---") continue;
    current.body.push(normalizeLine(rawLine));
  }
  if (current) slides.push(current);
  return slides;
}

function fontFor(lines, columns) {
  const weight = lines.reduce((sum, line) => sum + estimateWeight(line), 0);
  if (columns === 2) {
    if (weight > 58) return 12.5;
    if (weight > 48) return 13.5;
    return 15;
  }
  if (weight > 34) return 15;
  if (weight > 26) return 16.5;
  return 18.5;
}

function moduleSource(slide, index) {
  const bodyLines = slide.body;
  const bodyWeight = bodyLines.reduce((sum, line) => sum + estimateWeight(line), 0);
  const useColumns = bodyWeight > 28 || bodyLines.length > 18;
  const columns = useColumns ? splitColumns(bodyLines) : [bodyLines];
  const fontSize = fontFor(bodyLines, columns.length);
  const payload = JSON.stringify({
    page: slide.page,
    pageLabel: slide.pageLabel,
    title: slide.title,
    columns,
    fontSize,
  });

  return `const data = ${payload};

function addText(ctx, slide, opts) {
  const shape = ctx.addText(slide, opts);
  shape.text.autoFit = "shrinkText";
  return shape;
}

export async function slide${String(index).padStart(2, "0")}(presentation, ctx) {
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
      text: data.columns[0].join("\\n"),
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
      text: data.columns[1].join("\\n"),
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
      text: data.columns[0].join("\\n"),
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
`;
}

const markdown = await fs.readFile(sourcePath, "utf8");
const slides = parseSlides(markdown);
if (slides.length !== 38) {
  throw new Error(`Expected 38 slides, parsed ${slides.length}.`);
}

await fs.rm(slidesDir, { recursive: true, force: true });
await fs.mkdir(slidesDir, { recursive: true });
for (const [idx, slide] of slides.entries()) {
  const fileName = `slide-${String(idx + 1).padStart(2, "0")}.mjs`;
  await fs.writeFile(path.join(slidesDir, fileName), moduleSource(slide, idx + 1), "utf8");
}

await fs.writeFile(
  path.join(workspace, "source-parse-summary.json"),
  `${JSON.stringify(
    slides.map((slide) => ({
      page: slide.page,
      title: slide.title,
      bodyLines: slide.body.length,
    })),
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Generated ${slides.length} slide modules in ${slidesDir}`);
