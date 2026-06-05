#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prototypeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = path.join(prototypeRoot, "assets");
const ignoredDirs = new Set(["lib", "node_modules"]);
const targets = [];

function listCssFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!ignoredDirs.has(name)) listCssFiles(full);
      continue;
    }
    if (name.endsWith(".css")) targets.push(full);
  }
}

listCssFiles(assetsRoot);

const allowComment = /one-off decorative/i;
const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
const violations = [];

for (const target of targets) {
  const css = fs.readFileSync(target, "utf8");
  const lines = css.split("\n");
  const rel = path.relative(prototypeRoot, target);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (allowComment.test(line)) continue;
    if (hexRe.test(line)) {
      violations.push({ file: rel, line: i + 1, text: line.trim() });
    }
    hexRe.lastIndex = 0;
  }
}

if (violations.length) {
  console.error("audit-no-bare-hex failed:");
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line}: ${v.text}`);
  }
  process.exit(1);
}

console.log("audit-no-bare-hex passed");
