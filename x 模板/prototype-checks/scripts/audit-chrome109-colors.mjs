#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prototypeRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanRoots = ["assets", "ui"].map((dir) => path.join(prototypeRoot, dir));
const ignoredDirs = new Set(["node_modules", "lib", "_retired"]);
const targetFileRe = /\.css$/;
const forbidden = [
  { name: "color-mix()", re: /color-mix\(/i },
  { name: "oklch()", re: /oklch\(/i },
  { name: "lab()", re: /\blab\(/i },
  { name: "lch()", re: /\blch\(/i },
  { name: "slash rgb/rgba", re: /\brgba?\([^,)]*\s\/\s*[^)]*\)/i },
  { name: "4-digit hex", re: /#[0-9a-fA-F]{4}\b/ },
  { name: "8-digit hex", re: /#[0-9a-fA-F]{8}\b/ },
];

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!ignoredDirs.has(name)) out.push(...listFiles(full));
      continue;
    }
    if (targetFileRe.test(name)) out.push(full);
  }
  return out;
}

function stripBlockComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

const violations = [];
for (const root of scanRoots) {
  for (const filePath of listFiles(root)) {
    const lines = stripBlockComments(fs.readFileSync(filePath, "utf8")).split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      for (const rule of forbidden) {
        if (rule.re.test(line)) {
          violations.push(`${path.relative(prototypeRoot, filePath)}:${i + 1}: ${rule.name}: ${line.trim()}`);
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error("audit-chrome109-colors failed:");
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log("audit-chrome109-colors passed");
