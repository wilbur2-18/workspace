#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mapSrc = fs.readFileSync(path.join(root, 'js', 'demo-icon-map.js'), 'utf8');
const { FA_LEGACY_TO_LOGICAL } = new Function(`${mapSrc}; return DEMO_ICON_MAP;`)();

function faToLogical(fa) {
  return FA_LEGACY_TO_LOGICAL[fa.replace(/^fa-/, '')] || fa.replace(/^fa-/, '');
}

const targets = [
  path.join(root, 'js', 'template', 'demo-cmp-template-list.js'),
  path.join(root, 'js', 'freeaudit', 'demo-cmp-freeaudit-chat-panel.js'),
];

for (const file of targets) {
  let t = fs.readFileSync(file, 'utf8');

  // <i class=\"fas fa-name extra\" ...></i>
  t = t.replace(/<i class=\\"fas fa-([a-z0-9-]+)((?:\s+[^\\"]*)?)\\"([^>]*)><\/i>/gi, (m, name, extra, tail) => {
    const logical = faToLogical(name);
    const cls = extra.trim();
    return `<ds-icon name=\\"${logical}\\"${cls ? ` class=\\"${cls}\\"` : ''}${tail} />`;
  });

  // <i class=\"fas fa-name\" style=\"...\"></i>
  t = t.replace(/<i class=\\"fas fa-([a-z0-9-]+)\\" style=\\"([^"]*)\\"\\"><\/i>/gi, (m, name, style) => {
    return `<ds-icon name=\\"${faToLogical(name)}\\" style=\\"${style}\\" />`;
  });

  // <i :class=\"['fas', expr ? 'fa-a' : 'fa-b']\"  -> ds-icon :name
  t = t.replace(
    /<i :class=\\"\['fas',\s*([^?]+)\s*\?\s*'fa-([^']+)'\s*:\s*'fa-([^']+)'\\]"([^>]*)><\/i>/g,
    (m, cond, a, b, tail) => `<ds-icon :name=\\"${cond.trim()} ? '${faToLogical(a)}' : '${faToLogical(b)}'\\"${tail} />`
  );

  // <i class=\"fas extra-classes\" (no fa- icon name - chevron toggle)
  t = t.replace(/<i class=\\"fas ([^\\"]+)\\"([^>]*)><\/i>/g, (m, classes, tail) => {
    if (classes.includes('fa-')) return m;
    if (classes.includes('chevron')) {
      return `<ds-icon name=\\"chevron-right\\" class=\\"${classes}\\"${tail} />`;
    }
    return `<span class=\\"ds-icon ${classes}\\"${tail}></span>`;
  });

  // <i class=\"fas fa-check ...\"> without closing on same - already done

  // Remaining <i class=\"fas fa-xxx extra\">...</i> (e.g. tool-call status)
  t = t.replace(
    /<i ([^>]*?)class=\\"fas fa-([a-z0-9-]+)((?:\s+[^\\"]*)?)\\"([^>]*)><\/i>/gi,
    (m, before, name, extra, after) => {
      const logical = faToLogical(name);
      const cls = extra.trim();
      const attrs = `${before || ''}${after || ''}`.trim();
      const sep = attrs && !attrs.endsWith(' ') ? ' ' : '';
      return `<ds-icon ${attrs}${sep}name=\\"${logical}\\"${cls ? ` class=\\"${cls}\\"` : ''} />`;
    }
  );

  fs.writeFileSync(file, t);
  const left = (t.match(/\\"fas/g) || []).length;
  console.log(path.relative(root, file), 'remaining \\"fas:', left);
}
