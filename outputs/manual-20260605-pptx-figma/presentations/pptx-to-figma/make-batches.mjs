import fs from "node:fs";
import path from "node:path";

const baseDir = "/Users/mac/Desktop/workspace/outputs/manual-20260605-pptx-figma/presentations/pptx-to-figma";
const compact = JSON.parse(fs.readFileSync(path.join(baseDir, "pptx-figma-import.compact.json"), "utf8"));

const batchSize = 4;
for (let start = 0; start < compact.slides.length; start += batchSize) {
  const batchNo = start / batchSize + 1;
  const batch = {
    width: compact.width,
    height: compact.height,
    startIndex: start,
    clear: start === 0,
    slides: compact.slides.slice(start, start + batchSize),
  };
  const out = path.join(baseDir, `batch-${batchNo}.json`);
  fs.writeFileSync(out, JSON.stringify(batch));
  console.log(`${out} ${fs.statSync(out).size}`);
}
