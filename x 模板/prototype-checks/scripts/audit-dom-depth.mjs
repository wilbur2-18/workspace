#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const scanDirs = ["js", "ui/components"];
const reviewDepth = 14;
const warnDepth = 22;
const maxRows = 12;

const voidTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const transparentTags = new Set([
  "template",
  "slot",
  "teleport",
  "transition",
  "transition-group",
  "keep-alive",
]);
const suspiciousTerms = [
  "wrapper",
  "inner",
  "content-wrapper",
  "card-inner",
  "section-inner",
  "layout-container",
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const rows = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...walk(full));
    else if (entry.isFile() && full.endsWith(".js")) rows.push(full);
  }
  return rows;
}

function shouldSkip(file) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  return (
    rel.startsWith("js/data/") ||
    rel === "js/demo-icon-map.js" ||
    rel.includes("/assets/lib/")
  );
}

function lineStartsOf(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "\n") starts.push(i + 1);
  }
  return starts;
}

function lineOf(starts, index) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= index) lo = mid + 1;
    else hi = mid - 1;
  }
  return hi + 1;
}

function isTransparent(name) {
  return transparentTags.has(name) || name.startsWith("a-");
}

function classHits(source) {
  const hits = new Map();
  const classRe = /(?::?class|className)\s*=\s*(["'`])([\s\S]*?)\1/g;
  let match;
  while ((match = classRe.exec(source))) {
    const value = match[2];
    for (const term of suspiciousTerms) {
      const re = new RegExp(`(^|[^a-zA-Z0-9])${term}([^a-zA-Z0-9]|$)`);
      if (re.test(value)) hits.set(term, (hits.get(term) || 0) + 1);
    }
  }
  return hits;
}

function analyze(file) {
  const source = fs.readFileSync(file, "utf8");
  const starts = lineStartsOf(source);
  const stack = [];
  let rawMax = 0;
  let effectiveMax = 0;
  let maxAt = 1;
  let maxStack = [];
  let tagCount = 0;
  let divCount = 0;

  const tagRe = /<\/?([A-Za-z][\w:-]*)([^<>]*?)>/g;
  let match;
  while ((match = tagRe.exec(source))) {
    const full = match[0];
    const name = match[1].toLowerCase();
    if (full.startsWith("<!--") || full.startsWith("<!")) continue;

    if (full.startsWith("</")) {
      const idx = stack.map((item) => item.name).lastIndexOf(name);
      if (idx >= 0) stack.length = idx;
      continue;
    }

    tagCount += 1;
    if (name === "div") divCount += 1;
    if (full.endsWith("/>") || voidTags.has(name)) continue;

    stack.push({ name, effective: !isTransparent(name) });
    const effectiveStack = stack.filter((item) => item.effective).map((item) => item.name);
    if (effectiveStack.length > effectiveMax) {
      rawMax = stack.length;
      effectiveMax = effectiveStack.length;
      maxAt = lineOf(starts, match.index);
      maxStack = stack.map((item) => item.name);
    }
  }

  const suspicious = classHits(source);
  return {
    file,
    rel: path.relative(root, file).split(path.sep).join("/"),
    line: maxAt,
    rawDepth: rawMax,
    effectiveDepth: effectiveMax,
    tags: tagCount,
    divs: divCount,
    divRatio: tagCount ? divCount / tagCount : 0,
    suspicious,
    stack: maxStack.join(" > "),
  };
}

const files = scanDirs
  .flatMap((dir) => walk(path.join(root, dir)))
  .filter((file) => !shouldSkip(file));
const rows = files
  .map(analyze)
  .filter((row) => row.tags > 0)
  .map((row) => {
    const suspiciousCount = [...row.suspicious.values()].reduce((sum, count) => sum + count, 0);
    const level = row.effectiveDepth > warnDepth ? "warn" : row.effectiveDepth > reviewDepth || suspiciousCount ? "review" : "";
    return { ...row, suspiciousCount, level };
  })
  .filter((row) => row.level)
  .sort((a, b) => {
    const levelScore = (row) => (row.level === "warn" ? 2 : row.level === "review" ? 1 : 0);
    return (
      levelScore(b) - levelScore(a) ||
      b.effectiveDepth - a.effectiveDepth ||
      b.suspiciousCount - a.suspiciousCount
    );
  });

const warnCount = rows.filter((row) => row.level === "warn").length;
const reviewCount = rows.filter((row) => row.level === "review").length;

console.log("audit-dom-depth: scanning Vue/HTML template structure");
console.log(`audit-dom-depth: checked ${files.length} files; warn=${warnCount}, review=${reviewCount}`);

if (!rows.length) {
  console.log("audit-dom-depth: no DOM nesting findings");
  process.exit(0);
}

console.log("audit-dom-depth: top findings (non-blocking)");
for (const row of rows.slice(0, maxRows)) {
  const level = row.level || "review";
  const terms = [...row.suspicious.entries()].map(([term, count]) => `${term}:${count}`).join(", ") || "none";
  const ratio = Math.round(row.divRatio * 100);
  console.log(
    `[${level}] ${row.rel}:${row.line} effectiveDepth=${row.effectiveDepth} rawDepth=${row.rawDepth} divRatio=${ratio}% suspicious=${terms}`,
  );
  if (row.stack) console.log(`  stack: ${row.stack}`);
}

process.exit(0);
