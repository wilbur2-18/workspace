#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = process.cwd();
const prototypeRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const foundationPath = path.resolve(
  workspace,
  ".cursor/skills/pm-ui-prototype-kit/css-reference/foundation.css"
);
const runtimeThemePath = path.join(prototypeRoot, "ui/runtime-theme.antdv.js");

if (!fs.existsSync(foundationPath)) {
  console.warn(`check-color-parity skipped: foundation reference not found at ${foundationPath}`);
  process.exit(0);
}

const foundationCss = fs.readFileSync(foundationPath, "utf8");
const runtimeTheme = fs.readFileSync(runtimeThemePath, "utf8");

const pairs = [
  { themeKey: "primary", foundationVar: "--ds-c-primary" },
  { themeKey: "bgLayout", foundationVar: "--ds-c-neutral-2" },
  { themeKey: "bgContainer", foundationVar: "--ds-c-neutral-0" },
  { themeKey: "textBase", foundationVar: "--ds-c-neutral-8" },
  { themeKey: "textSecondary", foundationVar: "--ds-c-neutral-6" },
  { themeKey: "border", foundationVar: "--ds-c-neutral-4" },
  { themeKey: "success", foundationVar: "--ds-c-success" },
  { themeKey: "warning", foundationVar: "--ds-c-warning" },
  { themeKey: "error", foundationVar: "--ds-c-error" },
];

function getFoundationValue(varName) {
  const re = new RegExp(`${varName}:\\s*(#[0-9a-fA-F]{6})\\s*;`);
  const match = foundationCss.match(re);
  return match ? match[1].toLowerCase() : null;
}

function getThemeValue(key) {
  const re = new RegExp(`${key}:\\s*'(#(?:[0-9a-fA-F]{6}))'`);
  const match = runtimeTheme.match(re);
  return match ? match[1].toLowerCase() : null;
}

const errors = [];
for (const pair of pairs) {
  const f = getFoundationValue(pair.foundationVar);
  const t = getThemeValue(pair.themeKey);
  if (!f || !t) {
    errors.push(`Missing value: ${pair.themeKey} <-> ${pair.foundationVar}`);
    continue;
  }
  if (f !== t) {
    errors.push(`Mismatch ${pair.themeKey}: runtime ${t} != foundation ${f}`);
  }
}

if (errors.length) {
  console.error("check-color-parity failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("check-color-parity passed");
