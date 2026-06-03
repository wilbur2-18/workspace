#!/usr/bin/env node
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const prototypeRoot = path.resolve(__dirname, "..");
const scripts = [
  path.join(prototypeRoot, "scripts/check-no-fontawesome.mjs"),
  path.join(prototypeRoot, "scripts/check-color-parity.mjs"),
  path.join(prototypeRoot, "scripts/check-color-oklch.mjs"),
  path.join(prototypeRoot, "scripts/audit-chrome109-colors.mjs"),
  path.join(prototypeRoot, "scripts/audit-no-bare-hex.mjs"),
  path.join(prototypeRoot, "scripts/audit-token-coverage.mjs"),
  path.join(prototypeRoot, "scripts/audit-no-legacy-tokens.mjs"),
  path.join(prototypeRoot, "scripts/audit-no-runtime-primary-mix.mjs"),
];

console.log("check-manifest: running prototype governance checks");

for (const script of scripts) {
  const scriptPath = script;
  const result = spawnSync("node", [scriptPath], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log("check-manifest: prototype governance checks completed");
