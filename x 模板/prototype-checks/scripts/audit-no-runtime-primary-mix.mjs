#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prototypeRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanRoots = ["assets", "ui", "js"].map((dir) => path.join(prototypeRoot, dir));
const ignoredParts = new Set(["node_modules", "lib", "_retired"]);
const targetFileRe = /\.(css|js|mjs)$/;
const forbidden = [
  {
    name: "color-mix with --ds-c-primary",
    re: /color-mix\(\s*in\s+srgb\s*,\s*var\(--ds-c-primary\)/i,
  },
  {
    name: "color-mix with primary-derived context token",
    re: /color-mix\([^;]*var\(--ds-ctx-l1-hero-(?:bg|mid|deep)\)/i,
  },
  {
    name: "color-mix with primary-derived focus token",
    re: /color-mix\([^;]*var\(--ds-fx-focus-ring\)/i,
  },
];

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!ignoredParts.has(name)) out.push(...listFiles(full));
      continue;
    }
    if (targetFileRe.test(name)) out.push(full);
  }
  return out;
}

function isCommentLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.endsWith("*/");
}

const violations = [];
for (const root of scanRoots) {
  for (const filePath of listFiles(root)) {
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (isCommentLine(line)) continue;
      for (const rule of forbidden) {
        if (rule.re.test(line)) {
          violations.push(`${path.relative(prototypeRoot, filePath)}:${i + 1}: ${rule.name}: ${line.trim()}`);
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error("audit-no-runtime-primary-mix failed:");
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log("audit-no-runtime-primary-mix passed");
