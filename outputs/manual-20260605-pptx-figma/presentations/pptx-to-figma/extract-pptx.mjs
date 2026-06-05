import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { xml2js } = require("/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/xml-js@1.6.11/node_modules/xml-js/lib/index.js");

const root = "/Users/mac/Desktop/workspace/outputs/manual-20260605-pptx-figma/presentations/pptx-to-figma/unzipped";
const outPath = "/Users/mac/Desktop/workspace/outputs/manual-20260605-pptx-figma/presentations/pptx-to-figma/pptx-figma-import.json";

const EMU_W = 12192000;
const EMU_H = 6858000;
const FIGMA_W = 1920;
const FIGMA_H = 1080;
const S = FIGMA_W / EMU_W;

function readXml(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return xml2js(fs.readFileSync(full, "utf8"), { compact: false, trim: false });
}

function elem(node, name) {
  return node?.elements?.find((e) => e.type === "element" && e.name === name);
}

function elems(node, name) {
  return node?.elements?.filter((e) => e.type === "element" && e.name === name) || [];
}

function attr(node, key) {
  return node?.attributes?.[key];
}

function num(node, key, fallback = 0) {
  const v = attr(node, key);
  return v == null ? fallback : Number(v);
}

function textOf(node) {
  if (!node) return "";
  let s = "";
  for (const child of node.elements || []) {
    if (child.type === "text") s += child.text;
    else if (child.type === "element") s += textOf(child);
  }
  return s;
}

function relsFor(relPath) {
  const dir = path.dirname(relPath);
  const base = path.basename(relPath);
  const relsPath = path.join(root, dir, "_rels", `${base}.rels`);
  if (!fs.existsSync(relsPath)) return {};
  const doc = xml2js(fs.readFileSync(relsPath, "utf8"), { compact: false });
  const relationships = elem(doc.elements[0], "Relationships") || doc.elements[0];
  const map = {};
  for (const r of elems(relationships, "Relationship")) {
    const id = attr(r, "Id");
    const target = attr(r, "Target");
    const type = attr(r, "Type") || "";
    const resolved = path.normalize(path.join(path.dirname(path.join(root, relPath)), target));
    map[id] = {
      target,
      type,
      fullPath: resolved,
      rel: path.relative(path.join(root, "ppt"), resolved),
    };
  }
  return map;
}

function firstDesc(node, name) {
  if (!node) return null;
  if (node.type === "element" && node.name === name) return node;
  for (const child of node.elements || []) {
    if (child.type === "element") {
      const hit = firstDesc(child, name);
      if (hit) return hit;
    }
  }
  return null;
}

function allDesc(node, name, hits = []) {
  if (!node) return hits;
  if (node.type === "element" && node.name === name) hits.push(node);
  for (const child of node.elements || []) {
    if (child.type === "element") allDesc(child, name, hits);
  }
  return hits;
}

function xfrmOf(node) {
  const xfrm = firstDesc(node, "a:xfrm") || firstDesc(node, "p:xfrm");
  const off = elem(xfrm, "a:off");
  const ext = elem(xfrm, "a:ext");
  return {
    x: num(off, "x") * S,
    y: num(off, "y") * S,
    w: Math.max(1, num(ext, "cx") * S),
    h: Math.max(1, num(ext, "cy") * S),
    rot: num(xfrm, "rot", 0) / 60000,
  };
}

function isTinyBox(box) {
  return (box?.w || 0) <= 2 && (box?.h || 0) <= 2;
}

function isMasterPlaceholderText(node) {
  return node.kind === "text" && /^单击此处编辑母版/.test(node.text || "");
}

function colorFromSolid(node) {
  const solid = firstDesc(node, "a:solidFill");
  if (!solid) return null;
  const srgb = firstDesc(solid, "a:srgbClr");
  if (srgb) {
    const hex = attr(srgb, "val");
    if (hex) return `#${hex}`;
  }
  const scheme = firstDesc(solid, "a:schemeClr");
  if (scheme) {
    const val = attr(scheme, "val");
    const map = {
      tx1: "#111827",
      tx2: "#4B5563",
      bg1: "#FFFFFF",
      bg2: "#F3F4F6",
      accent1: "#00F2FF",
      accent2: "#2F80ED",
      accent3: "#22C55E",
      accent4: "#F59E0B",
      accent5: "#8B5CF6",
      accent6: "#EF4444",
      lt1: "#FFFFFF",
      dk1: "#000000",
    };
    return map[val] || "#111827";
  }
  return null;
}

function alphaFromSolid(node) {
  const alpha = firstDesc(firstDesc(node, "a:solidFill"), "a:alpha");
  return alpha ? Math.max(0, Math.min(1, num(alpha, "val", 100000) / 100000)) : 1;
}

function hasNoFill(node) {
  return Boolean(firstDesc(node, "a:noFill"));
}

function lineStyle(node) {
  const ln = firstDesc(node, "a:ln");
  if (!ln || firstDesc(ln, "a:noFill")) return null;
  return {
    color: colorFromSolid(ln) || "#000000",
    alpha: alphaFromSolid(ln),
    weight: Math.max(0.5, num(ln, "w", 12700) * S),
  };
}

function paragraphs(txBody) {
  return elems(txBody, "a:p").map((p) => {
    const runs = [];
    for (const r of elems(p, "a:r")) {
      const rPr = elem(r, "a:rPr");
      const t = elem(r, "a:t");
      runs.push({
        text: textOf(t),
        size: num(rPr, "sz", 1800) / 100,
        bold: attr(rPr, "b") === "1",
        italic: attr(rPr, "i") === "1",
        color: colorFromSolid(rPr) || "#111827",
        font: attr(firstDesc(rPr, "a:latin"), "typeface") || attr(firstDesc(rPr, "a:ea"), "typeface") || "Inter",
      });
    }
    const endPr = elem(p, "a:endParaRPr");
    if (!runs.length && endPr) {
      runs.push({ text: "", size: num(endPr, "sz", 1800) / 100, bold: attr(endPr, "b") === "1", italic: false, color: colorFromSolid(endPr) || "#111827", font: "Inter" });
    }
    const pPr = elem(p, "a:pPr");
    return {
      text: runs.map((r) => r.text).join(""),
      runs,
      align: attr(pPr, "algn") || "l",
      bullet: Boolean(firstDesc(pPr, "a:buChar") || firstDesc(pPr, "a:buAutoNum")),
    };
  });
}

function parseTextShape(node, source) {
  const txBody = elem(node, "p:txBody") || elem(node, "dsp:txBody") || elem(node, "a:txBody");
  if (!txBody) return null;
  const ps = paragraphs(txBody).filter((p) => p.text.length > 0 || p.runs.length > 0);
  const text = ps.map((p) => p.text).join("\n");
  if (!text.trim()) return null;
  const bodyPr = elem(txBody, "a:bodyPr");
  const firstRun = ps.find((p) => p.runs.length)?.runs[0] || {};
  const spPr = elem(node, "p:spPr") || elem(node, "dsp:spPr");
  const cNvPr = firstDesc(node, "p:cNvPr") || firstDesc(node, "dsp:cNvPr");
  const geom = firstDesc(spPr, "a:prstGeom");
  return {
    kind: "text",
    shape: attr(geom, "prst") || "rect",
    source,
    name: attr(cNvPr, "name") || "Text",
    box: xfrmOf(node),
    text,
    paragraphs: ps,
    fontSize: firstRun.size || 18,
    bold: Boolean(firstRun.bold),
    italic: Boolean(firstRun.italic),
    color: firstRun.color || "#111827",
    fill: colorFromSolid(spPr),
    fillAlpha: alphaFromSolid(spPr),
    line: lineStyle(spPr),
    margin: {
      left: num(bodyPr, "lIns", 0) * S,
      top: num(bodyPr, "tIns", 0) * S,
      right: num(bodyPr, "rIns", 0) * S,
      bottom: num(bodyPr, "bIns", 0) * S,
    },
    verticalAlign: attr(bodyPr, "anchor") || "top",
  };
}

function parseShape(node, source) {
  const spPr = elem(node, "p:spPr") || elem(node, "dsp:spPr");
  const geom = firstDesc(spPr, "a:prstGeom");
  const prst = attr(geom, "prst") || "rect";
  const tx = parseTextShape(node, source);
  if (tx) return tx;
  const fill = hasNoFill(spPr) ? null : colorFromSolid(spPr);
  const line = lineStyle(spPr);
  if (!fill && !line) return null;
  return {
    kind: prst === "line" ? "line" : "shape",
    shape: prst,
    source,
    name: attr(firstDesc(node, "p:cNvPr") || firstDesc(node, "dsp:cNvPr"), "name") || prst,
    box: xfrmOf(node),
    fill,
    fillAlpha: alphaFromSolid(spPr),
    line,
  };
}

function parsePic(node, source, rels) {
  const blip = firstDesc(node, "a:blip");
  const rid = attr(blip, "r:embed") || attr(blip, "embed");
  const rel = rels[rid];
  return {
    kind: "image",
    source,
    name: attr(firstDesc(node, "p:cNvPr"), "name") || "Image",
    box: xfrmOf(node),
    relId: rid,
    imageRel: rel?.rel || null,
    imagePath: rel?.fullPath || null,
  };
}

function parseTableGraphicFrame(gf, source) {
  const tbl = firstDesc(gf, "a:tbl");
  if (!tbl) return null;
  const frameBox = xfrmOf(gf);
  const cols = elems(firstDesc(tbl, "a:tblGrid"), "a:gridCol").map((c) => num(c, "w", 0) * S);
  const colSum = cols.reduce((a, b) => a + b, 0) || frameBox.w;
  const scaleX = frameBox.w / colSum;
  const rows = elems(tbl, "a:tr");
  const rowHeights = rows.map((r) => num(r, "h", 0) * S);
  const rowSum = rowHeights.reduce((a, b) => a + b, 0) || frameBox.h;
  const scaleY = frameBox.h / rowSum;
  const nodes = [];
  let y = frameBox.y;
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const h = rowHeights[ri] * scaleY;
    let x = frameBox.x;
    const cells = elems(row, "a:tc");
    for (let ci = 0; ci < cells.length; ci++) {
      const w = (cols[ci] || frameBox.w / Math.max(1, cells.length)) * scaleX;
      const tc = cells[ci];
      const tcPr = elem(tc, "a:tcPr");
      const fill = colorFromSolid(tcPr);
      const line = lineStyle(tcPr) || { color: "#00F2FF", alpha: 1, weight: 1 };
      nodes.push({
        kind: "shape",
        shape: "rect",
        source,
        name: `Table cell ${ri + 1}-${ci + 1}`,
        box: { x, y, w, h, rot: 0 },
        fill,
        fillAlpha: fill ? alphaFromSolid(tcPr) : 0,
        line,
      });
      const txBody = elem(tc, "a:txBody");
      if (txBody) {
        const ps = paragraphs(txBody).filter((p) => p.text.trim());
        const text = ps.map((p) => p.text).join("\n");
        if (text.trim()) {
          const firstRun = ps.find((p) => p.runs.length)?.runs[0] || {};
          nodes.push({
            kind: "text",
            source,
            name: `Table text ${ri + 1}-${ci + 1}`,
            box: { x: x + 4, y: y + 3, w: Math.max(1, w - 8), h: Math.max(1, h - 6), rot: 0 },
            text,
            paragraphs: ps,
            fontSize: firstRun.size || 10,
            bold: Boolean(firstRun.bold),
            italic: Boolean(firstRun.italic),
            color: firstRun.color || "#DCDCDC",
            fill: null,
            fillAlpha: 0,
            line: null,
            margin: { left: 0, top: 0, right: 0, bottom: 0 },
            verticalAlign: "mid",
          });
        }
      }
      x += w;
    }
    y += h;
  }
  return nodes;
}

function parseDiagramGraphicFrame(gf, rels, source) {
  if (!firstDesc(gf, "dgm:relIds")) return null;
  const drawing = Object.values(rels).find((r) => r.type.includes("diagramDrawing"));
  if (!drawing?.fullPath || !fs.existsSync(drawing.fullPath)) return null;
  const frameBox = xfrmOf(gf);
  const doc = xml2js(fs.readFileSync(drawing.fullPath, "utf8"), { compact: false, trim: false });
  const nodes = [];
  for (const sp of allDesc(doc, "dsp:sp")) {
    const parsed = parseShape(sp, `${source}:diagram`);
    if (!parsed) continue;
    parsed.box.x += frameBox.x;
    parsed.box.y += frameBox.y;
    nodes.push(parsed);
  }
  return nodes;
}

function parseTree(doc, relPath, source) {
  const rels = relsFor(relPath);
  const nodes = [];
  for (const sp of allDesc(doc, "p:sp")) {
    const parsed = parseShape(sp, source);
    if (parsed) nodes.push(parsed);
  }
  for (const pic of allDesc(doc, "p:pic")) {
    nodes.push(parsePic(pic, source, rels));
  }
  for (const cxn of allDesc(doc, "p:cxnSp")) {
    const parsed = parseShape(cxn, source);
    if (parsed) nodes.push(parsed);
  }
  for (const gf of allDesc(doc, "p:graphicFrame")) {
    const tableNodes = parseTableGraphicFrame(gf, `${source}:table`);
    if (tableNodes) {
      nodes.push(...tableNodes);
      continue;
    }
    const diagramNodes = parseDiagramGraphicFrame(gf, rels, `${source}:diagram`);
    if (diagramNodes) {
      nodes.push(...diagramNodes);
      continue;
    }
    nodes.push({
      kind: "graphicFrame",
      source,
      name: attr(firstDesc(gf, "p:cNvPr"), "name") || "Graphic Frame",
      box: xfrmOf(gf),
      text: textOf(gf).slice(0, 200),
    });
  }
  return nodes;
}

function slideLayoutFor(slideRel) {
  const rels = relsFor(slideRel);
  const layout = Object.values(rels).find((r) => r.type.includes("/slideLayout"));
  if (!layout) return null;
  return path.relative(root, layout.fullPath);
}

const pres = readXml("ppt/presentation.xml");
const presRels = relsFor("ppt/presentation.xml");
const sldIds = allDesc(pres, "p:sldId");
const slides = [];

for (let i = 0; i < sldIds.length; i++) {
  const rid = attr(sldIds[i], "r:id");
  const slideRel = path.relative(root, presRels[rid].fullPath);
  const slideDoc = readXml(slideRel);
  const layoutRel = slideLayoutFor(slideRel);
  const layoutDoc = layoutRel ? readXml(layoutRel) : null;
  const layoutNodes = layoutDoc ? parseTree(layoutDoc, layoutRel, "layout") : [];
  const slideNodes = parseTree(slideDoc, slideRel, "slide");
  const titlePlaceholder = layoutNodes.find((n) => n.kind === "text" && /标题/.test(n.name || ""));
  const contentPlaceholder = layoutNodes.find((n) => n.kind === "text" && /内容占位符/.test(n.name || ""));
  for (const node of slideNodes) {
    if (node.kind !== "text" || !isTinyBox(node.box)) continue;
    if (/标题/.test(node.name || "") && titlePlaceholder) node.box = { ...titlePlaceholder.box };
    else if (/内容占位符/.test(node.name || "") && contentPlaceholder) node.box = { ...contentPlaceholder.box };
  }
  slides.push({
    index: i + 1,
    name: `Slide ${i + 1}`,
    layoutRel,
    nodes: [...layoutNodes.filter((n) => !isMasterPlaceholderText(n)), ...slideNodes],
  });
}

const summary = {
  slideCount: slides.length,
  mediaCount: fs.existsSync(path.join(root, "ppt/media")) ? fs.readdirSync(path.join(root, "ppt/media")).length : 0,
  counts: slides.map((slide) => ({
    index: slide.index,
    text: slide.nodes.filter((n) => n.kind === "text").length,
    shape: slide.nodes.filter((n) => n.kind === "shape" || n.kind === "line").length,
    image: slide.nodes.filter((n) => n.kind === "image").length,
    graphicFrame: slide.nodes.filter((n) => n.kind === "graphicFrame").length,
  })),
};

const result = { width: FIGMA_W, height: FIGMA_H, sourceEmu: { width: EMU_W, height: EMU_H }, slides, summary };
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ outPath, summary }, null, 2));
