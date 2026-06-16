const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = __dirname;
const targets = [
  "01-control-room",
  "02-boardroom-report",
  "03-graph-atlas",
];
const shotDir = path.join(root, "screenshots");
fs.mkdirSync(shotDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--allow-file-access-from-files"],
  });
  const results = [];
  for (const id of targets) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    const fileUrl = pathToFileURL(path.join(root, id, "index.html")).href;
    await page.goto(fileUrl, { waitUntil: "load" });
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 3000 });
    const activeCount = await page.locator(".slide.active").count();
    const h1Text = await page.locator(".slide.active h1, .slide.active h2").first().innerText();
    await page.screenshot({ path: path.join(shotDir, `${id}.png`), fullPage: false });
    results.push({ id, activeCount, h1Text, errors });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(shotDir, "render-report.json"), JSON.stringify(results, null, 2), "utf8");
  console.log(JSON.stringify(results, null, 2));
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
