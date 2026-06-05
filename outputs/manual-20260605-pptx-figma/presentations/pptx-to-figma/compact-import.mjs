import fs from "node:fs";

const input = "/Users/mac/Desktop/workspace/outputs/manual-20260605-pptx-figma/presentations/pptx-to-figma/pptx-figma-import.json";
const output = "/Users/mac/Desktop/workspace/outputs/manual-20260605-pptx-figma/presentations/pptx-to-figma/pptx-figma-import.compact.json";
const data = JSON.parse(fs.readFileSync(input, "utf8"));

function fixed(value, fallback = 0) {
  return +Number(value ?? fallback).toFixed(2);
}

const compact = {
  width: data.width,
  height: data.height,
  slides: data.slides.map((slide) => ({
    i: slide.index,
    n: slide.name,
    nodes: slide.nodes.map((node) => {
      const box = node.box || {};
      const base = {
        k: node.kind,
        s: node.shape,
        n: node.name,
        b: [fixed(box.x), fixed(box.y), fixed(box.w, 1), fixed(box.h, 1), fixed(box.rot)],
      };
      if (node.kind === "text") {
        return {
          ...base,
          t: node.text,
          fs: fixed(node.fontSize, 18),
          bo: Boolean(node.bold),
          it: Boolean(node.italic),
          c: node.color || "#111827",
          f: node.fill || null,
          fa: node.fillAlpha == null ? 1 : +node.fillAlpha,
          ln: node.line || null,
          va: node.verticalAlign || "top",
        };
      }
      if (node.kind === "shape" || node.kind === "line") {
        return {
          ...base,
          f: node.fill || null,
          fa: node.fillAlpha == null ? 1 : +node.fillAlpha,
          ln: node.line || null,
        };
      }
      if (node.kind === "image") {
        return { ...base, img: node.imageRel };
      }
      return base;
    }),
  })),
};

fs.writeFileSync(output, JSON.stringify(compact));
console.log(JSON.stringify({ output, bytes: fs.statSync(output).size }));
