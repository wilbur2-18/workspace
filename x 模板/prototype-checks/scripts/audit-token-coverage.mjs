#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prototypeRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanRoot = path.join(prototypeRoot, "assets");
const runtimeCssPath = path.join(prototypeRoot, "ui/runtime-ui.css");
const definitionRoots = ["assets", "ui"].map((dir) => path.join(prototypeRoot, dir));
const ignoredDirs = new Set(["lib", "node_modules"]);
const targetFileRe = /\.css$/;

const colorValueRe = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/;
const tokenRefRe = /var\(--ds-/;
const dsVarRefRe = /var\(\s*(--ds-[\w-]+)(\s*,[^)]*)?\)/g;
const dsDefinitionRe = /^\s*(--ds-[\w-]+)\s*:/;
const deprecatedTypeTokens = [
  "--ds-type-body-medium-fw",
  "--ds-type-nav-medium-fw",
  "--ds-type-caption-light-fw",
  "--ds-type-body-large-fs",
  "--ds-type-body-large-fw",
  "--ds-type-info-card-title-fs",
  "--ds-type-info-card-title-fw",
  "--ds-type-body-sm-fs",
  "--ds-btn-font-weight-lg",
  "--ds-btn-font-weight-md",
  "--ds-btn-font-weight-sm",
];
const deprecatedTypeTokenPatternRe = /--ds-type-[\w-]+-(?:lh|ls)\b/;
const typeProps = new Set(["font-family", "font-size", "font-weight", "line-height", "letter-spacing"]);
const effectProps = new Set(["box-shadow", "transition", "z-index"]);
const spacingPropRe =
  /^(margin|margin-(top|right|bottom|left)|padding|padding-(top|right|bottom|left)|gap|row-gap|column-gap|border-radius)$/;

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

function readRuntimeRoot() {
  if (!fs.existsSync(runtimeCssPath)) return { text: "", startLine: 0, endLine: 0, tokens: new Set() };
  const text = fs.readFileSync(runtimeCssPath, "utf8");
  const start = text.indexOf(":root");
  const open = text.indexOf("{", start);
  const close = text.indexOf("\n}", open);
  const rootText = open >= 0 && close >= 0 ? text.slice(open + 1, close) : "";
  const startLine = text.slice(0, open + 1).split("\n").length;
  const endLine = text.slice(0, close).split("\n").length;
  const tokens = new Set([...rootText.matchAll(/(--ds-[\w-]+)\s*:/g)].map((match) => match[1]));
  return { text, startLine, endLine, tokens };
}

function isSafeKeyword(value) {
  const normalized = value.trim();
  return /^(0|auto|none|normal|inherit|initial|unset|transparent|currentColor|100%)\b/.test(normalized);
}

function isBareColor(value) {
  const withoutAllowedDsRgba = value
    .replace(/rgba\(\s*var\(--ds-rgb-[^)]+\)\s*,\s*(?:0|1|0?\.\d+)\s*\)/g, "")
    .replace(/var\(--ds-[^)]+\)/g, "");
  return colorValueRe.test(withoutAllowedDsRgba);
}

function isTokenCandidate(prop, value) {
  if (tokenRefRe.test(value) || isSafeKeyword(value)) return false;
  if (typeProps.has(prop)) {
    const normalized = value.trim();
    if (prop === "font-family") return /^"?[A-Za-z]/.test(normalized);
    if (prop === "font-weight") return /^(?:[1-9]00|bold|bolder|lighter)\b/.test(normalized);
    if (prop === "line-height") return /\d|calc\(/.test(normalized);
    if (prop === "letter-spacing") return /-?\d/.test(normalized);
    return /-?\d+(?:\.\d+)?(?:px|rem|em|%)\b|clamp\(/.test(normalized);
  }
  if (spacingPropRe.test(prop)) {
    return /\d(px|rem|em)\b/.test(value);
  }
  if (effectProps.has(prop)) {
    return !isSafeKeyword(value);
  }
  return false;
}

const hardViolations = [];
const deprecatedTokenViolations = [];
const buttonSemanticViolations = [];
const missingTokenViolations = [];
const fallbackTokenRefs = [];
const localDsDefinitions = [];
const advisory = new Map();
const topOffenders = {
  shouldFix: new Map(),
  review: new Map(),
};
const runtimeRoot = readRuntimeRoot();

function addOffender(bucket, prop, value, rel, lineNo) {
  const normalized = `${prop}: ${value.trim()}`;
  const current = bucket.get(normalized) ?? { count: 0, example: `${rel}:${lineNo}` };
  current.count += 1;
  bucket.set(normalized, current);
}

function classifyTokenCandidate(prop, value) {
  if (!isTokenCandidate(prop, value)) return null;
  const normalized = value.trim();
  if (typeProps.has(prop)) {
    if (prop === "font-size" && /(?:^|\s)(?:13px|15px)(?:\s*!important)?$/.test(normalized)) {
      return "shouldFix";
    }
    if (prop === "font-weight" && /^500(?:\s*!important)?$/.test(normalized)) {
      return "shouldFix";
    }
    return "review";
  }
  if (spacingPropRe.test(prop)) {
    if (prop === "border-radius") {
      return /^(?:4px|6px|8px|12px|16px|999px|9999px)$/.test(normalized) ? "shouldFix" : "review";
    }
    if (/^(?:4px|8px|12px|24px)(?:\s*!important)?$/.test(normalized)) return "shouldFix";
    if (
      /^(?:4px|8px|12px|24px)\s+(?:4px|8px|12px|24px)(?:\s*!important)?$/.test(normalized)
    ) {
      return "shouldFix";
    }
    return "review";
  }
  if (effectProps.has(prop)) {
    if (prop === "z-index" && /^(?:1|2)$/.test(normalized)) return "shouldFix";
    if (/0\.2s cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/.test(normalized)) return "shouldFix";
    return "review";
  }
  return "review";
}

function isButtonSemanticSelector(selector) {
  return (
    selector.includes(".ant-btn") &&
    (selector.includes(".ant-modal-wrap") ||
      selector.includes(".ds-modal-footer") ||
      selector.includes(".ant-btn-default"))
  );
}

function isBadButtonTypography(prop, value) {
  const normalized = value.trim();
  if (prop === "font-size") {
    return /var\(--ds-type-nav-fs\)/.test(normalized);
  }
  if (prop === "font-weight") {
    return /^(?:500|600|700)(?:\s*!important)?$/.test(normalized) ||
      /var\(--ds-type-(?:nav|caption|badge|subheading)-fw\)/.test(normalized);
  }
  return false;
}

for (const filePath of definitionRoots.flatMap((root) => listFiles(root))) {
  const rel = path.relative(prototypeRoot, filePath);
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const isRuntimeCss = path.resolve(filePath) === path.resolve(runtimeCssPath);
  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const line = lines[i];
    for (const tokenName of deprecatedTypeTokens) {
      if (line.includes(tokenName)) {
        deprecatedTokenViolations.push(`${rel}:${lineNo}: ${tokenName}`);
      }
    }
    const deprecatedTypeTokenMatch = line.match(deprecatedTypeTokenPatternRe);
    if (deprecatedTypeTokenMatch) {
      deprecatedTokenViolations.push(`${rel}:${lineNo}: ${deprecatedTypeTokenMatch[0]}`);
    }
    const definitionMatch = line.match(dsDefinitionRe);
    if (definitionMatch && (!isRuntimeCss || lineNo < runtimeRoot.startLine || lineNo > runtimeRoot.endLine)) {
      localDsDefinitions.push(`${rel}:${lineNo}: ${definitionMatch[1]}`);
    }
    let refMatch;
    dsVarRefRe.lastIndex = 0;
    while ((refMatch = dsVarRefRe.exec(line))) {
      const [, tokenName, fallback] = refMatch;
      if (runtimeRoot.tokens.has(tokenName)) continue;
      const item = `${rel}:${lineNo}: ${tokenName}`;
      if (fallback) fallbackTokenRefs.push(item);
      else missingTokenViolations.push(item);
    }
  }
}

for (const filePath of listFiles(scanRoot)) {
  const rel = path.relative(prototypeRoot, filePath);
  const lines = stripBlockComments(fs.readFileSync(filePath, "utf8")).split("\n");
  let activeSelector = "";
  let selectorBuffer = [];
  const summary = {
    shouldFix: { typography: 0, spacing: 0, effect: 0 },
    review: { typography: 0, spacing: 0, effect: 0 },
  };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!activeSelector && trimmed && !trimmed.startsWith("@") && !/^[\w-]+\s*:/.test(trimmed)) {
      selectorBuffer.push(trimmed);
      if (trimmed.includes("{")) {
        activeSelector = selectorBuffer.join(" ");
        selectorBuffer = [];
      } else if (!trimmed.endsWith(",")) {
        selectorBuffer = [];
      }
    }
    const match = line.match(/^\s*([-\w]+)\s*:\s*([^;]+);/);
    if (match) {
      const [, prop, value] = match;
      if (!prop.startsWith("--")) {
        if (isBareColor(value)) {
          hardViolations.push(`${rel}:${i + 1}: ${prop}: ${value.trim()}`);
        }
        if (activeSelector && isButtonSemanticSelector(activeSelector) && isBadButtonTypography(prop, value)) {
          buttonSemanticViolations.push(`${rel}:${i + 1}: ${prop}: ${value.trim()}`);
        }
        const candidateLevel = classifyTokenCandidate(prop, value);
        if (candidateLevel) {
          let category = "effect";
          if (typeProps.has(prop)) category = "typography";
          else if (spacingPropRe.test(prop)) category = "spacing";
          summary[candidateLevel][category] += 1;
          addOffender(topOffenders[candidateLevel], prop, value, rel, i + 1);
        }
      }
    }
    if (trimmed.includes("}")) {
      activeSelector = "";
      selectorBuffer = [];
    }
  }
  if (
    summary.shouldFix.typography ||
    summary.shouldFix.spacing ||
    summary.shouldFix.effect ||
    summary.review.typography ||
    summary.review.spacing ||
    summary.review.effect
  ) {
    advisory.set(rel, summary);
  }
}

if (advisory.size > 0) {
  console.log("audit-token-coverage advisory:");
  for (const [file, summary] of advisory) {
    console.log(
      `- ${file}: should-fix typography=${summary.shouldFix.typography}, spacing=${summary.shouldFix.spacing}, effect=${summary.shouldFix.effect}; review typography=${summary.review.typography}, spacing=${summary.review.spacing}, effect=${summary.review.effect}`
    );
  }
  for (const [level, bucket] of Object.entries(topOffenders)) {
    if (bucket.size === 0) continue;
    console.log(`audit-token-coverage ${level} top offenders:`);
    for (const [key, item] of [...bucket].sort((a, b) => b[1].count - a[1].count).slice(0, 10)) {
      console.log(`- ${item.count}x ${key} @ ${item.example}`);
    }
  }
}

if (hardViolations.length > 0) {
  console.error("audit-token-coverage failed: business CSS contains raw color values:");
  for (const item of hardViolations) console.error(`- ${item}`);
  process.exit(1);
}

if (localDsDefinitions.length > 0) {
  console.error("audit-token-coverage failed: --ds-* tokens must be defined in ui/runtime-ui.css :root:");
  for (const item of localDsDefinitions) console.error(`- ${item}`);
  process.exit(1);
}

if (buttonSemanticViolations.length > 0) {
  console.error("audit-token-coverage failed: modal/default buttons must use body/micro typography:");
  for (const item of buttonSemanticViolations) console.error(`- ${item}`);
  process.exit(1);
}

if (deprecatedTokenViolations.length > 0) {
  console.error("audit-token-coverage failed: deprecated typography/button tokens are still referenced:");
  for (const item of deprecatedTokenViolations) console.error(`- ${item}`);
  process.exit(1);
}

if (missingTokenViolations.length > 0) {
  console.error("audit-token-coverage failed: var(--ds-*) references without root definition or fallback:");
  for (const item of missingTokenViolations) console.error(`- ${item}`);
  process.exit(1);
}

if (fallbackTokenRefs.length > 0) {
  console.log("audit-token-coverage fallback token references:");
  for (const item of fallbackTokenRefs) console.log(`- ${item}`);
}

console.log("audit-token-coverage passed");
