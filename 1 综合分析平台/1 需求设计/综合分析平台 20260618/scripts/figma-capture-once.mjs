import { chromium } from 'playwright';

const captureId = process.argv[2];
if (!captureId) {
  console.error('Usage: node figma-capture-once.mjs <captureId>');
  process.exit(1);
}

const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;
const url =
  'http://127.0.0.1:8765/demo.html?figmadelay=5000#freeaudit?projectId=PRJ-2026-001';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('.workbench-v2-title', { timeout: 90000 });
  await page.waitForTimeout(6000);

  const scriptText = await (
    await page.context().request.get('https://mcp.figma.com/mcp/html-to-design/capture.js')
  ).text();

  await page.evaluate((source) => {
    const el = document.createElement('script');
    el.textContent = source;
    document.head.appendChild(el);
  }, scriptText);

  await page.waitForFunction(() => typeof window.figma?.captureForDesign === 'function', null, {
    timeout: 30000,
  });

  const result = await page.evaluate(
    ({ captureId, endpoint }) =>
      window.figma.captureForDesign({ captureId, endpoint, selector: 'body' }),
    { captureId, endpoint },
  );

  console.log(JSON.stringify({ ok: true, result }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: String(error) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
