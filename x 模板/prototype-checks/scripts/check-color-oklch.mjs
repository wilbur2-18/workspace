#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();
const foundationPath = path.resolve(
  workspace,
  ".cursor/skills/pm-ui-prototype-kit/css-reference/foundation.css"
);

if (!fs.existsSync(foundationPath)) {
  console.warn(`check-color-oklch skipped: foundation reference not found at ${foundationPath}`);
  process.exit(0);
}

const foundationCss = fs.readFileSync(foundationPath, "utf8");

const specs = [
  { varName: "--ds-c-primary", lRange: [0.56, 0.62], cRange: [0.17, 0.2] },
  { varName: "--ds-c-success", lRange: [0.57, 0.62], cRange: [0.16, 0.2] },
  { varName: "--ds-c-warning", lRange: [0.57, 0.62], cRange: [0.13, 0.21] },
  { varName: "--ds-c-error", lRange: [0.57, 0.62], cRange: [0.18, 0.22] },
];

function parseHex(varName) {
  const re = new RegExp(`${varName}:\\s*(#[0-9a-fA-F]{6})\\s*;`);
  const match = foundationCss.match(re);
  if (!match) throw new Error(`Missing ${varName}`);
  return match[1];
}

function hexToRgb01(hex) {
  const raw = hex.slice(1);
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function srgbToLinear(v) {
  if (v <= 0.04045) return v / 12.92;
  return ((v + 0.055) / 1.055) ** 2.4;
}

function toOklch(hex) {
  const [rs, gs, bs] = hexToRgb01(hex);
  const r = srgbToLinear(rs);
  const g = srgbToLinear(gs);
  const b = srgbToLinear(bs);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

const errors = [];
for (const spec of specs) {
  const hex = parseHex(spec.varName);
  const { L, C, H } = toOklch(hex);
  if (L < spec.lRange[0] || L > spec.lRange[1]) {
    errors.push(
      `${spec.varName} lightness out of range: ${L.toFixed(3)} not in [${spec.lRange[0]}, ${spec.lRange[1]}]`
    );
  }
  if (C < spec.cRange[0] || C > spec.cRange[1]) {
    errors.push(
      `${spec.varName} chroma out of range: ${C.toFixed(3)} not in [${spec.cRange[0]}, ${spec.cRange[1]}]`
    );
  }
  console.log(`${spec.varName}: ${hex} -> OKLCH(${L.toFixed(3)}, ${C.toFixed(3)}, ${H.toFixed(1)}deg)`);
}

if (errors.length) {
  console.error("check-color-oklch failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("check-color-oklch passed");
