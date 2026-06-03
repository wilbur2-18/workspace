import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const port = 9231;

async function getPageWs() {
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = tabs.find((item) => item.type === 'page');
  if (!page) throw new Error('No Chrome page target found');
  return page.webSocketDebuggerUrl;
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result || {});
  };
  return {
    send(method, params = {}) {
      const msgId = ++id;
      ws.send(JSON.stringify({ id: msgId, method, params }));
      return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
    },
    close() {
      ws.close();
    },
  };
}

async function waitFor(client, expression, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await client.send('Runtime.evaluate', { expression, returnByValue: true });
    if (res.result?.value) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function screenshot(client, filename) {
  await client.send('Page.bringToFront');
  const res = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
  });
  await fs.writeFile(path.join(auditDir, filename), Buffer.from(res.data, 'base64'));
}

async function clickCenter(client, selector) {
  const res = await client.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  });
  const point = res.result.value;
  if (!point) throw new Error(`Element not found: ${selector}`);
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
}

const client = await connect(await getPageWs());
await client.send('Page.enable');
await client.send('Runtime.enable');
await client.send('DOM.enable');
await client.send('Emulation.setDeviceMetricsOverride', {
  width: 1600,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await client.send('Page.reload', { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 1000));

await waitFor(client, "document.body.innerText.includes('信息统计')");
await client.send('Runtime.evaluate', {
  expression: "[...document.querySelectorAll('*')].find((el) => el.textContent.trim() === '信息统计')?.click()",
});
await waitFor(client, "!!document.querySelector('.ds-page-shell--statistics')");
await screenshot(client, '01-default-desktop.png');

await clickCenter(client, '.ds-settings-statistics-org-select .ant-select-selector');
await waitFor(client, "!!document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')");
await screenshot(client, '02-org-filter-open.png');

await client.send('Runtime.evaluate', {
  expression: "document.querySelector('.ant-select-dropdown')?.remove()",
});
await new Promise((resolve) => setTimeout(resolve, 100));
await clickCenter(client, '.ds-settings-statistics-panel--org .ant-table-row');
await client.send('Runtime.evaluate', {
  expression: `(() => {
    const row = document.querySelector('.ds-settings-statistics-panel--org .ant-table-row');
    if (!row) return false;
    row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return true;
  })()`,
});
await new Promise((resolve) => setTimeout(resolve, 400));
await screenshot(client, '03-org-row-selected.png');

const desktop = await client.send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      return el ? JSON.parse(JSON.stringify(el.getBoundingClientRect())) : null;
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight
      },
      selected: document.querySelector('.ds-settings-statistics-org-row.is-selected')?.innerText || '',
      text: document.body.innerText.slice(0, 5000),
      rects: {
        head: rect('.ds-settings-statistics-head'),
        actions: rect('.ds-settings-statistics-head__actions'),
        grid: rect('.ds-settings-statistics-grid'),
        orgPanel: rect('.ds-settings-statistics-panel--org'),
        userPanel: rect('.ds-settings-statistics-panel--users')
      }
    };
  })()`,
});

await client.send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 900,
  deviceScaleFactor: 2,
  mobile: true,
});
await client.send('Page.reload', { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 1000));
await waitFor(client, "document.body.innerText.includes('信息统计')");
await client.send('Runtime.evaluate', {
  expression: "[...document.querySelectorAll('*')].find((el) => el.textContent.trim() === '信息统计')?.click()",
});
await waitFor(client, "!!document.querySelector('.ds-page-shell--statistics')");
await screenshot(client, '04-mobile.png');

const mobile = await client.send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    document: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    },
    text: document.body.innerText.slice(0, 3000)
  }))()`,
});

await fs.writeFile(
  path.join(auditDir, 'capture-summary.json'),
  JSON.stringify({ desktop: desktop.result.value, mobile: mobile.result.value }, null, 2)
);

client.close();
