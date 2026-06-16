#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = process.cwd();
const root = path.resolve(workspace);
const prototypeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacyRe = /--ds-(color|status|file-type)-|--ds-neutral-[0-9]/g;

const scanRoots = [
  path.join(prototypeRoot, "assets"),
  path.join(prototypeRoot, "ui"),
  path.join(prototypeRoot, "js"),
  path.join(root, ".cursor/skills/pm-ui-prototype-kit/css-reference"),
];

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function isTargetFile(filePath) {
  return /\.(css|js|mjs)$/.test(filePath);
}

function isWhitelisted(filePath, line) {
  if (!filePath.endsWith("foundation.css")) return false;
  return false;
}

function isCommentLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.endsWith("*/");
}

const violations = [];
for (const rel of scanRoots) {
  const abs = path.resolve(root, rel);
  for (const filePath of listFiles(abs)) {
    if (!isTargetFile(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (isCommentLine(line)) continue;
      if (isWhitelisted(filePath, line)) continue;
      if (legacyRe.test(line)) {
        violations.push(`${path.relative(root, filePath)}:${i + 1}: ${line.trim()}`);
      }
      legacyRe.lastIndex = 0;
    }
  }
}

if (violations.length > 0) {
  console.error("audit-no-legacy-tokens failed:");
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log("audit-no-legacy-tokens passed");
