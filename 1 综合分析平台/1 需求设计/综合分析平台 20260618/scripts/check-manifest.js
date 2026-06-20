#!/usr/bin/env node
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const prototypeRoot = path.resolve(__dirname, "..");
const sharedScriptsRoot = path.resolve(prototypeRoot, "../../..", "x 模板/prototype-checks/scripts");
const scripts = [
  path.join(sharedScriptsRoot, "check-no-fontawesome.mjs"),
  path.join(sharedScriptsRoot, "check-color-parity.mjs"),
  path.join(sharedScriptsRoot, "check-color-oklch.mjs"),
  path.join(sharedScriptsRoot, "audit-chrome109-colors.mjs"),
  path.join(sharedScriptsRoot, "audit-no-bare-hex.mjs"),
  path.join(sharedScriptsRoot, "audit-token-coverage.mjs"),
  path.join(sharedScriptsRoot, "audit-no-legacy-tokens.mjs"),
  path.join(sharedScriptsRoot, "audit-no-runtime-primary-mix.mjs"),
];

console.log("check-manifest: running prototype governance checks");

for (const script of scripts) {
  const scriptPath = script;
  const result = spawnSync(process.execPath, [scriptPath, prototypeRoot], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log("check-manifest: prototype governance checks completed");
