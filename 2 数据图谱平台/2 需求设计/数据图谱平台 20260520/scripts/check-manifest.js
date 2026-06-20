import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sharedScriptsRoot = path.resolve(root, '../../..', 'x 模板/prototype-checks/scripts');
const required = [
  'demo.html',
  'README.md',
  'assets/lib/vue.global.prod.js',
  'assets/lib/antd.min.js',
  'assets/lib/reset.css',
  'assets/lib/iconpark-subset.js',
  'assets/demo-icon.css',
  'assets/generated/l1-data-graph-shell-bg.png',
  'ui/runtime-ui.css',
  'ui/runtime-theme.antdv.js',
  'ui/components/ui-info-control-rail.js',
  'assets/demo-app.css',
  'assets/css/workbench/layout.css',
  'assets/css/workbench/nlm-chat-panel.css',
  'assets/css/workbench/workbench.css',
  'assets/css/graph-query.css',
  'js/demo-icon-map.js',
  'js/demo-cmp-icon.js',
  'js/core/demo-runtime.js',
  'js/data/graph-audit-scenario-100.js',
  'js/data/graph-data.js',
  'js/graph-query/graph-layout-engine.js',
  'js/graph-query/graph-canvas-visual.js',
  'js/graph-query/graph-canvas-display-policy.js',
  'js/graph-query/graph-canvas-legend.js',
  'js/graph-query/index.js',
  'js/graph-query/graph-home-list.js',
  'js/graph-query/entity-confirm-modal.js',
  'js/graph-query/template-variable-form.js',
  'js/graph-query/template-query-modal.js',
  'js/graph-query/quick-query-form.js',
  'js/graph-query/quick-query-modal.js',
  'js/graph-query/graph-workbench-layout.js',
  'js/graph-query/graph-canvas-chart.js',
  'js/graph-query/graph-workbench.js',
  'assets/lib/echarts.min.js',
  'js/graph-query/module-placeholder.js',
  'js/core/demo-app-root.js',
  'js/core/demo-boot.js',
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error('Missing files:');
  missing.forEach((file) => console.error(' - ' + file));
  process.exit(1);
}

const jsFiles = required.filter((file) => file.endsWith('.js'));
for (const file of jsFiles) {
  childProcess.execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
}

console.log('Manifest OK:', required.length, 'files checked');

const governanceScripts = [
  'check-no-fontawesome.mjs',
  'check-color-parity.mjs',
  'check-color-oklch.mjs',
  'audit-chrome109-colors.mjs',
  'audit-no-bare-hex.mjs',
  'audit-token-coverage.mjs',
  'audit-no-legacy-tokens.mjs',
  'audit-no-runtime-primary-mix.mjs',
];

console.log('check-manifest: running prototype governance checks');
for (const script of governanceScripts) {
  const result = childProcess.spawnSync(process.execPath, [path.join(sharedScriptsRoot, script), root], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('check-manifest: prototype governance checks completed');
