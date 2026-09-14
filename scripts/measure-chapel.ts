/** Production evidence for issue 27. Run against the isolated production preview. */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
const output = "docs/chapel-visual-study";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  recordVideo: { dir: output, size: { width: 1440, height: 900 } } });
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("framenavigated", frame => { if (frame === page.mainFrame()) console.log("Navigation", frame.url()); });
const started = Date.now();
await page.goto(process.env["CHAPEL_URL"] ?? "http://127.0.0.1:4190/?debug&nolock");
await page.waitForSelector('body[data-state="ready"]', { timeout: 60_000 });
const readyMs = Date.now() - started;
await page.click("#play");
await page.waitForTimeout(1500);
// Use the same walk as the existing browser suite; stop in the chapel with the intact obstacle ahead.
await page.evaluate(() => {
  const g = window.__game!;
  g.command({ type: "move", forward: 1, strafe: 0 }); g.fastForward(4.4);
  g.command({ type: "look", yaw: Math.PI / 2, pitch: 0 }); g.fastForward(1.5);
  g.command({ type: "look", yaw: -0.15, pitch: 0 }); g.fastForward(2.6);
  g.command({ type: "move", forward: 0, strafe: 0 });
  g.command({ type: "look", yaw: 0.15, pitch: 0 });
});
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const g = window.__game!; const p = g.snapshot().player;
  g.command({ type: "look", yaw: Math.PI - p.yaw, pitch: .25 - p.pitch });
  g.resetCounters();
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${output}/01-bay.jpg`, quality: 95 });
await page.waitForTimeout(10000);
await page.evaluate(() => window.__game!.command({ type: "look", yaw: -.45, pitch: .4 }));
await page.waitForTimeout(250);
await page.screenshot({ path: `${output}/02-column.jpg`, quality: 95 });
await page.evaluate(() => window.__game!.command({ type: "look", yaw: .45, pitch: .5 }));
await page.waitForTimeout(250);
await page.screenshot({ path: `${output}/03-window.jpg`, quality: 95 });
const measurement = await page.evaluate(() => ({ backend: window.__game!.backend(), size: window.__game!.renderSize(), report: window.__game!.report() }));
writeFileSync(`${output}/measurement.json`, JSON.stringify({ date: new Date().toISOString(), browser: await browser.version(), readyMs, ...measurement, errors }, null, 2));
const video = page.video()!;
await context.close();
await video.saveAs(`${output}/chapel-in-game.webm`);
unlinkSync(await video.path());
await browser.close();
console.log(JSON.stringify({ readyMs, ...measurement, errors }));
