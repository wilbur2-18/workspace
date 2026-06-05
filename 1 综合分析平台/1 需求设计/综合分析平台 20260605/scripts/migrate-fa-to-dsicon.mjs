#!/usr/bin/env node
/**
 * One-shot codemod: Font Awesome <i class="fas ..."> → <ds-icon name="...">
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const mapSrc = fs.readFileSync(path.join(root, 'js', 'demo-icon-map.js'), 'utf8');
const mapFn = new Function(`${mapSrc}; return DEMO_ICON_MAP;`);
const { FA_LEGACY_TO_LOGICAL } = mapFn();

function faToLogical(faSuffix) {
  const s = faSuffix.replace(/^fa-/, '');
  return FA_LEGACY_TO_LOGICAL[s] || s;
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.js') && !ent.name.includes('demo-icon-map') && !ent.name.includes('demo-cmp-icon')) out.push(p);
  }
  return out;
}

const files = walk(path.join(root, 'js'));

function migrateContent(text) {
  let t = text;

  // <i class="fas" :class="sourceGuideOpen ? 'fa-chevron-up' : 'fa-chevron-down'">
  t = t.replace(
    /<i\s+class="fas"\s+:class="sourceGuideOpen \? 'fa-chevron-up' : 'fa-chevron-down'"><\/i>/g,
    '<ds-icon :name="sourceGuideOpen ? \'up\' : \'down\'" />'
  );

  // shell sider toggle
  t = t.replace(
    /<i\s+:class="\['fas',\s*sidebarCollapsed \? 'fa-angles-right' : 'fa-angles-left'\]"><\/i>/g,
    '<ds-icon :name="sidebarCollapsed ? \'angles-right\' : \'angles-left\'" />'
  );

  // <i v-else-if="..." class="fas fa-NAME extra..." ...>  (no inner, may have title)
  t = t.replace(
    /<i\s+((?:v-[^\s=]+(?:="[^"]*")?\s*)*)class="fas\s+fa-([a-z0-9-]+)((?:\s+[^"]*)?)"([^>]*)\s*><\/i>/gi,
    (m, vDir, faName, extraClasses, tail) => {
      const logical = faToLogical(faName);
      const spin = /\bfa-spin\b/.test(extraClasses) || /\bfa-spin\b/.test(tail);
      const cls = extraClasses.replace(/\bfa-spin\b/g, '').replace(/\bfa-[a-z0-9-]+\b/g, '').trim();
      const spinAttr = spin ? ' spin' : '';
      const classAttr = cls ? ` class="${cls.trim()}"` : '';
      return `<ds-icon ${vDir}name="${logical}"${spinAttr}${classAttr}${tail} />`;
    }
  );

  // <i class="fas fa-NAME ..." ...></i>
  t = t.replace(
    /<i\s+class="fas\s+fa-([a-z0-9-]+)((?:\s+[^"]*)?)"([^>]*)>\s*<\/i>/gi,
    (m, faName, extraClasses, tail) => {
      const logical = faToLogical(faName);
      const spin = /\bfa-spin\b/.test(extraClasses);
      const cls = extraClasses.replace(/\bfa-spin\b/g, '').replace(/\bfa-[a-z0-9-]+\b/g, '').trim();
      const spinAttr = spin ? ' spin' : '';
      const classAttr = cls ? ` class="${cls.trim()}"` : '';
      return `<ds-icon name="${logical}"${spinAttr}${classAttr}${tail} />`;
    }
  );

  // <i class="fas fa-NAME only" />
  t = t.replace(
    /<i\s+class="fas\s+fa-([a-z0-9-]+)"([^/]*)\/>/gi,
    (m, faName, tail) => {
      const logical = faToLogical(faName);
      return `<ds-icon name="${logical}"${tail} />`;
    }
  );

  // <i v-else class="fas" :class="[getMaterialIcon(...), getMaterialIconColorClass(...)]">
  t = t.replace(
    /<i\s+v-else\s+class="fas"\s+:class="\[getMaterialIcon\(([^)]+)\),\s*getMaterialIconColorClass\(([^)]+)\)\]"([^>]*)><\/i>/g,
    '<ds-icon v-else :name="getMaterialIcon($1)" :class="getMaterialIconColorClass($2)"$3 />'
  );

  t = t.replace(
    /<i\s+class="fas"\s+:class="\[getMaterialIcon\(([^)]+)\),\s*getMaterialIconColorClass\(([^)]+)\)(?:,\s*chatAtUnifiedRowStatusClass\(([^)]+)\))?\]"([^>]*)><\/i>/g,
    (m, a, b, c, tail) => {
      const extra = c ? `, chatAtUnifiedRowStatusClass(${c})` : '';
      return `<ds-icon :name="getMaterialIcon(${a})" :class="[getMaterialIconColorClass(${b})${extra}]"${tail} />`;
    }
  );

  t = t.replace(
    /<i\s+class="fas"\s+:class="getMaterialIcon\(([^)]+)\)"([^>]*)><\/i>/g,
    '<ds-icon :name="getMaterialIcon($1)"$2 />'
  );

  t = t.replace(
    /<i\s+class="fas\s+wb-menu-action-item__icon"\s+:class="workbenchMenuItemIcon\('([^']+)'\)"([^>]*)><\/i>/g,
    '<ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon(\'$1\')"$2 />'
  );

  t = t.replace(
    /<i\s+class="fas\s+wb-menu-action-item__icon"\s+:class="workbenchMenuItemIcon\(([^)]+)\)"([^>]*)><\/i>/g,
    '<ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon($1)"$3 />'
  );

  // remaining <i class="fas" :class="workbenchMenuItemIcon...
  t = t.replace(
    /<i\s+class="fas"\s+:class="workbenchMenuItemIcon\(([^)]+)\)"([^>]*)><\/i>/g,
    '<ds-icon :name="workbenchMenuItemIcon($1)"$2 />'
  );

  return t;
}

let changed = 0;
for (const file of files) {
  const rel = path.relative(root, file);
  const before = fs.readFileSync(file, 'utf8');
  const after = migrateContent(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
    console.log('Updated', rel);
  }
}
console.log(`Done. ${changed} files updated.`);
