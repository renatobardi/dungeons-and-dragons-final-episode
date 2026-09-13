/** Production evidence for issue 25. Run against the isolated production preview. */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
const output = "docs/bobby-visual-finish";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false });
const context = await browser.newContext({ viewport: { width: 1512, height: 945 }, deviceScaleFactor: 2,
  recordVideo: { dir: output, size: { width: 1512, height: 945 } } });
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
const started = Date.now();
await page.goto(process.env["BOBBY_URL"] ?? "http://127.0.0.1:4186/?debug&nolock");
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
await page.screenshot({ path: `${output}/01-rest.jpg`, quality: 95 });
await page.evaluate(() => window.__game!.command({ type: "chargeStart" }));
await page.waitForTimeout(1000);
await page.screenshot({ path: `${output}/02-charge.jpg`, quality: 95 });
await page.evaluate(() => window.__game!.command({ type: "chargeRelease" }));
await page.waitForTimeout(160);
await page.screenshot({ path: `${output}/03-heavy-preparation.jpg`, quality: 95 });
await page.waitForTimeout(1000);
// Count actual rendered charge/light/heavy sequences; do not fast-forward inside the measured interval.
await page.evaluate(() => window.__game!.resetCounters());
let strikes = 0;
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => { window.__game!.command({ type: "chargeStart" }); window.__game!.command({ type: "chargeRelease" }); });
  strikes++;
  await page.waitForTimeout(650);
  await page.evaluate(() => window.__game!.command({ type: "chargeStart" }));
  await page.waitForTimeout(850);
  await page.evaluate(() => window.__game!.command({ type: "chargeRelease" }));
  strikes++;
  await page.waitForTimeout(850);
}
const measurement = await page.evaluate(() => ({ backend: window.__game!.backend(), size: window.__game!.renderSize(), report: window.__game!.report(), quality: { dpr: devicePixelRatio } }));
await page.screenshot({ path: `${output}/04-recovered.jpg`, quality: 95 });
await page.keyboard.press("Escape");
await page.waitForSelector('body[data-state="paused"]');
await page.waitForTimeout(600);
await page.click("#resume");
await page.waitForTimeout(600);
await page.screenshot({ path: `${output}/05-resumed.jpg`, quality: 95 });
writeFileSync(`${output}/measurement.json`, JSON.stringify({ date: new Date().toISOString(), browser: await browser.version(), readyMs, strikes, ...measurement, errors }, null, 2));
const video = page.video()!;
await context.close();
await video.saveAs(`${output}/bobby-in-game.webm`);
unlinkSync(await video.path());
await browser.close();
console.log(JSON.stringify({ readyMs, strikes, ...measurement, errors }));
