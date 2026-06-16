#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = process.cwd();
const prototypeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const targetsMode = readArg("--targets") || "demo";

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const demoCssPath = path.join(prototypeRoot, "assets/demo-app.css");
const cssRefDir = path.resolve(workspace, ".cursor/skills/pm-ui-prototype-kit/css-reference");

const tokenReplacements = [
  ["var(--ds-color-primary-border-accent)", "var(--ds-border-primary-soft)"],
  ["var(--ds-color-btn-secondary-hover-bg)", "var(--ds-bg-hover-ink)"],
  ["var(--ds-color-list-selected-bg)", "var(--ds-ctx-list-active-bg)"],
  ["var(--ds-color-list-hover-bg)", "var(--ds-ctx-list-active-bg)"],
  ["var(--ds-color-icon-btn-active-bg)", "var(--ds-bg-active-ink)"],
  ["var(--ds-color-icon-btn-hover-bg)", "var(--ds-bg-hover-ink)"],
  ["var(--ds-color-primary-light)", "var(--ds-bg-primary-soft)"],
  ["var(--ds-color-primary-hover)", "var(--ds-bg-primary-hover)"],
  ["var(--ds-color-success-light)", "var(--ds-tone-green-bg)"],
  ["var(--ds-color-warning-light)", "var(--ds-tone-amber-bg)"],
  ["var(--ds-color-warning-strong)", "var(--ds-c-warning-strong)"],
  ["var(--ds-color-error-light)", "var(--ds-tone-red-bg)"],
  ["var(--ds-color-modal-scrim)", "var(--ds-fx-scrim)"],
  ["var(--ds-color-bg-l1-business)", "var(--ds-ctx-l1-hero-flow)"],
  ["var(--ds-gradient-l1-cool-flow)", "var(--ds-ctx-l1-hero-flow)"],
  ["var(--ds-color-l1-cool-deep)", "var(--ds-ctx-l1-hero-deep)"],
  ["var(--ds-color-l1-cool-mid)", "var(--ds-ctx-l1-hero-mid)"],
  ["var(--ds-color-topbar-bg)", "var(--ds-ctx-l1-hero-bg)"],
  ["var(--ds-color-surface-sunken)", "var(--ds-bg-sunken)"],
  ["var(--ds-color-bg-container)", "var(--ds-bg-container)"],
  ["var(--ds-color-bg-layout)", "var(--ds-bg-layout)"],
  ["var(--ds-color-text-disabled)", "var(--ds-text-disabled)"],
  ["var(--ds-color-text-tertiary)", "var(--ds-text-3)"],
  ["var(--ds-color-text-secondary)", "var(--ds-text-2)"],
  ["var(--ds-color-text-primary)", "var(--ds-text-1)"],
  ["var(--ds-color-neutral-ink-rgb)", "var(--ds-rgb-ink)"],
  ["var(--ds-color-primary-rgb)", "var(--ds-rgb-primary)"],
  ["var(--ds-color-success-rgb)", "var(--ds-rgb-success)"],
  ["var(--ds-color-primary)", "var(--ds-c-primary)"],
  ["var(--ds-color-success)", "var(--ds-c-success)"],
  ["var(--ds-color-warning)", "var(--ds-c-warning)"],
  ["var(--ds-color-error)", "var(--ds-c-error)"],
  ["var(--ds-color-focus-ring)", "var(--ds-fx-focus-ring)"],
  ["var(--ds-color-border)", "var(--ds-border)"],
  ["var(--ds-color-accent-purple)", "var(--ds-tone-purple-fg)"],
  ["var(--ds-color-accent-teal)", "var(--ds-c-success)"],
  ["var(--ds-color-cool-shadow-rgb)", "var(--ds-rgb-shadow-cool)"],
  ["var(--ds-color-btn-secondary-bg)", "var(--ds-btn-secondary-bg)"],
  ["var(--ds-color-btn-default-bg)", "var(--ds-btn-default-bg)"],
  ["var(--ds-color-btn-disabled-bg)", "var(--ds-btn-disabled-bg)"],
  ["var(--ds-color-btn-disabled-border)", "var(--ds-btn-disabled-border)"],
  ["var(--ds-color-btn-default-hover-bg)", "var(--ds-btn-default-hover-bg)"],
  ["var(--ds-color-icon-placeholder)", "var(--ds-icon-placeholder-color)"],
  ["var(--ds-status-success-fg)", "var(--ds-tone-green-fg)"],
  ["var(--ds-status-success-bg)", "var(--ds-tone-green-bg)"],
  ["var(--ds-status-success-border)", "var(--ds-tone-green-border)"],
  ["var(--ds-status-error-fg)", "var(--ds-tone-red-fg)"],
  ["var(--ds-status-error-bg)", "var(--ds-tone-red-bg)"],
  ["var(--ds-status-error-border)", "var(--ds-tone-red-border)"],
  ["var(--ds-status-neutral-fg)", "var(--ds-tone-neutral-fg)"],
  ["var(--ds-status-neutral-bg)", "var(--ds-tone-neutral-bg)"],
  ["var(--ds-status-neutral-border)", "var(--ds-tone-neutral-border)"],
  ["var(--ds-file-type-pdf-fg)", "var(--ds-tone-red-fg)"],
  ["var(--ds-file-type-pdf-bg)", "var(--ds-tone-red-bg)"],
  ["var(--ds-file-type-sheet-fg)", "var(--ds-tone-green-fg)"],
  ["var(--ds-file-type-sheet-bg)", "var(--ds-tone-green-bg)"],
  ["var(--ds-file-type-data-fg)", "var(--ds-tone-purple-fg)"],
  ["var(--ds-file-type-data-bg)", "var(--ds-tone-purple-bg)"],
  ["var(--ds-neutral-8)", "var(--ds-c-neutral-8)"],
  ["var(--ds-neutral-7)", "var(--ds-c-neutral-7)"],
  ["var(--ds-neutral-6)", "var(--ds-c-neutral-6)"],
  ["var(--ds-neutral-5)", "var(--ds-c-neutral-5)"],
  ["var(--ds-neutral-4)", "var(--ds-c-neutral-4)"],
  ["var(--ds-neutral-3)", "var(--ds-c-neutral-3)"],
  ["var(--ds-neutral-2)", "var(--ds-c-neutral-2)"],
  ["var(--ds-neutral-1)", "var(--ds-_neutral-1)"],
  ["var(--ds-neutral-9)", "var(--ds-_neutral-9)"],
  ["var(--ds-neutral-0)", "var(--ds-c-neutral-0)"],
];

tokenReplacements.sort((a, b) => b[0].length - a[0].length);

function resolveTargets(mode) {
  if (mode !== "all") return [demoCssPath];
  const files = fs
    .readdirSync(cssRefDir)
    .filter((name) => name.endsWith(".css") && name !== "foundation.css")
    .map((name) => path.join(cssRefDir, name));
  return [demoCssPath, ...files];
}

function transform(css) {
  let output = css;
  for (const [from, to] of tokenReplacements) {
    output = output.split(from).join(to);
  }
  output = output.replace(/#ffffff\b/gi, "var(--ds-bg-container)");
  output = output.replace(/#fff\b/gi, "var(--ds-bg-container)");
  output = output.replace(/#000\b/gi, "rgb(var(--ds-rgb-ink))");
  output = output.replace(
    /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*([01]?(?:\.\d+)?)\s*\)/gi,
    "rgba(var(--ds-rgb-ink), $1)"
  );
  output = output.replace(
    /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([01]?(?:\.\d+)?)\s*\)/gi,
    "rgba(var(--ds-rgb-ink), calc(1 - $1))"
  );
  return output;
}

let changedCount = 0;
for (const filePath of resolveTargets(targetsMode)) {
  const source = fs.readFileSync(filePath, "utf8");
  const output = transform(source);
  if (output === source) continue;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, output, "utf8");
  changedCount += 1;
  console.log(`sweep-color-tokens: updated ${path.relative(workspace, filePath)}`);
}

if (changedCount === 0) {
  console.log("sweep-color-tokens: no changes");
}
