#!/usr/bin/env node
/**
 * Fail if Font Awesome remnants exist outside allowlisted paths.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');

const SKIP_DIR_NAMES = new Set(['node_modules', '_retired', 'scripts']);
const SKIP_FILES = new Set([
  'demo-icon-map.js',
  'package.json',
  'package-lock.json',
]);

const PATTERNS = [
  /fontawesome/i,
  /\bfas\b/,
  /\bfa-solid\b/,
  /\bfa-regular\b/,
  /\bfa-[a-z0-9-]+\b/,
  /class=["'][^"']*\bfas\b/,
];

function shouldSkipDir(dirPath) {
  const base = path.basename(dirPath);
  if (SKIP_DIR_NAMES.has(base)) return true;
  if (dirPath.includes(`${path.sep}assets${path.sep}lib${path.sep}`) && base !== 'lib') return true;
  return false;
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (shouldSkipDir(p)) continue;
      walk(p, out);
    } else if (/\.(js|html|css|md)$/i.test(ent.name)) {
      if (SKIP_FILES.has(ent.name)) continue;
      if (ent.name === 'README.md') continue;
      if (p.includes(`${path.sep}assets${path.sep}lib${path.sep}`)) continue;
      out.push(p);
    }
  }
  return out;
}

const hits = [];
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  for (const re of PATTERNS) {
    const m = text.match(re);
    if (m) {
      hits.push({ file: rel, match: m[0] });
      break;
    }
  }
}

if (hits.length) {
  console.error('check-no-fontawesome: found Font Awesome remnants:');
  hits.forEach((h) => console.error(`  ${h.file}: ${h.match}`));
  process.exit(1);
}
console.log('check-no-fontawesome: OK');
