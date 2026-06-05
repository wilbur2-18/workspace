#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mapSrc = fs.readFileSync(path.join(root, 'js', 'demo-icon-map.js'), 'utf8');
const { FA_LEGACY_TO_LOGICAL } = new Function(`${mapSrc}; return DEMO_ICON_MAP;`)();

function faToLogical(fa) {
  const s = fa.replace(/^fa-/, '');
  return FA_LEGACY_TO_LOGICAL[s] || s;
}

const targets = [
  path.join(root, 'js', 'template', 'demo-cmp-template-list.js'),
  path.join(root, 'js', 'freeaudit', 'demo-cmp-freeaudit-chat-panel.js'),
];

for (const file of targets) {
  let t = fs.readFileSync(file, 'utf8');
  t = t.replace(/<i class="fas fa-([a-z0-9-]+)((?:\s+[^"]*)?)"([^>]*)>\s*<\/i>/gi, (m, name, extra, tail) => {
    const logical = faToLogical(name);
    const cls = extra.trim();
    return `<ds-icon name="${logical}"${cls ? ` class="${cls}"` : ''}${tail} />`;
  });
  t = t.replace(/<i class="fas fa-([a-z0-9-]+)"([^/]*)\/>/gi, (m, name, tail) => {
    return `<ds-icon name="${faToLogical(name)}"${tail} />`;
  });
  t = t.replace(/"fas"/g, '"ds-icon"');
  fs.writeFileSync(file, t);
  console.log('Updated', path.relative(root, file));
}
