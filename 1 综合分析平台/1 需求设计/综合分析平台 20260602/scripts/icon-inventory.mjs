#!/usr/bin/env node
/**
 * Scan demo sources for Font Awesome class names (fa-*).
 * Output: scripts/icon-inventory.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SCAN_DIRS = [path.join(root, 'js'), root];
const SCAN_FILES = ['demo.html'];
const SKIP = new Set(['fa-spin', 'fas', 'far', 'fab', 'fa-solid', 'fa-regular']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(js|html)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const files = [
  ...walk(path.join(root, 'js')),
  ...SCAN_FILES.map((f) => path.join(root, f)),
];

const byIcon = new Map();

for (const file of files) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  const re = /\bfa-([a-z0-9-]+)\b/g;
  let m;
  while ((m = re.exec(text))) {
    const name = `fa-${m[1]}`;
    if (SKIP.has(name) || SKIP.has(m[1])) continue;
    if (!byIcon.has(name)) byIcon.set(name, new Set());
    byIcon.get(name).add(rel);
  }
}

const icons = [...byIcon.entries()]
  .map(([icon, filesSet]) => ({ icon, files: [...filesSet].sort() }))
  .sort((a, b) => a.icon.localeCompare(b.icon));

const outPath = path.join(__dirname, 'icon-inventory.json');
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: icons.length, icons }, null, 2));
console.log(`Wrote ${icons.length} unique fa-* icons to ${path.relative(root, outPath)}`);
