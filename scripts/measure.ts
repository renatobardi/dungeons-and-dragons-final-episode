/**
 * Performance measurement against the production build in the installed Google Chrome (real GPU, WebGPU).
 * Usage: pnpm build && pnpm preview &  then  pnpm measure
 * Writes docs/measurements/<timestamp>.json and prints a markdown table.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const URL = process.env["MEASURE_URL"] ?? "http://localhost:4173/?debug";
const SECONDS = Number(process.env["MEASURE_SECONDS"] ?? 10);
const VIEWPORT = { width: Number(process.env["MEASURE_W"] ?? 1512), height: Number(process.env["MEASURE_H"] ?? 945) };

async function main(): Promise<void> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = `docs/measurements/${stamp}`;
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--start-maximized"] });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, recordVideo: { dir: outDir, size: VIEWPORT } });
  const page = await context.newPage();
  const shot = (name: string) => page.screenshot({ path: `${outDir}/${name}.png` });

  // cold-cache load on Chrome DevTools' "Fast 4G" preset (4 Mbps down, 3 Mbps up, 20 ms)
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 20, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 });
  let transferred = 0;
  cdp.on("Network.loadingFinished", (e: { encodedDataLength: number }) => (transferred += e.encodedDataLength));
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForSelector('body[data-state="ready"]', { timeout: 60_000 });
  const readyMs = Date.now() - t0;
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  await shot("01-start");
  await page.click("#play");
  await page.waitForSelector('body[data-state="playing"]');
  const backend = await page.evaluate(() => window.__game!.backend());

  // evidence tour: corridor, Uni, blocked passage, break, exit
  const tour = async (js: string, name: string) => {
    await page.evaluate(js);
    await page.waitForTimeout(700);
    await shot(name);
  };
  await tour("const g=window.__game; g.command({type:'move',forward:1,strafe:0}); g.fastForward(1.2); g.command({type:'move',forward:0,strafe:0});", "02-corridor");
  await tour("const g=window.__game; g.command({type:'move',forward:1,strafe:0}); g.fastForward(2); g.command({type:'move',forward:0,strafe:0}); g.command({type:'look',yaw:Math.PI+0.4,pitch:-0.25});", "03-uni");
  // Uni close and full length, which the spec says a wide shot does not stand in for
  await tour("const g=window.__game; g.fastForward(2.5); const s=g.snapshot(); g.command({type:'look',yaw:0,pitch:-0.5-s.player.pitch});", "03b-uni-close");
  await tour(
    "const g=window.__game; g.command({type:'look',yaw:-Math.PI-0.4,pitch:0.25}); g.command({type:'move',forward:1,strafe:0}); g.fastForward(1.2); g.command({type:'look',yaw:Math.PI/2,pitch:0}); g.fastForward(1.5); g.command({type:'look',yaw:-0.15,pitch:0}); g.fastForward(3); g.command({type:'look',yaw:0.15,pitch:0}); g.fastForward(0.2); g.command({type:'move',forward:0,strafe:0}); g.command({type:'look',yaw:Math.PI/2-g.snapshot().player.yaw,pitch:0.05});",
    "04-blocked-passage",
  );
  // the chapel height, from Bobby's own eyes: the spec will not take an external presentation camera
  await tour("const g=window.__game; const s=g.snapshot(); g.command({type:'look',yaw:0,pitch:1.15-s.player.pitch});", "04b-vault");
  await tour("const g=window.__game; const s=g.snapshot(); g.command({type:'look',yaw:0.9,pitch:0.35-s.player.pitch});", "04c-columns-statues");
  await tour("const g=window.__game; const s=g.snapshot(); g.command({type:'look',yaw:-0.9,pitch:-0.05-s.player.pitch}); g.command({type:'chargeStart'}); g.fastForward(0.8);", "04d-charge");
  await tour(
    "const g=window.__game; g.command({type:'chargeRelease'}); g.fastForward(0.05); const s=g.snapshot(); g.command({type:'look',yaw:0,pitch:-0.05-s.player.pitch});",
    "04e-strike",
  );
  await tour(
    "const g=window.__game; g.command({type:'look',yaw:0,pitch:-0.05}); g.command({type:'move',forward:1,strafe:0}); g.fastForward(1.5); g.command({type:'move',forward:0,strafe:0}); g.command({type:'chargeStart'}); g.fastForward(0.7); g.command({type:'chargeRelease'}); g.fastForward(0.3); g.command({type:'move',forward:-1,strafe:0}); g.fastForward(0.8); g.command({type:'move',forward:0,strafe:0});",
    "05-broken",
  );
  await tour("const g=window.__game; g.command({type:'move',forward:1,strafe:0}); g.fastForward(1.6); g.command({type:'move',forward:0,strafe:0});", "06-exit");
  await page.evaluate("const g=window.__game; g.command({type:'move',forward:1,strafe:0}); g.fastForward(1.5); g.command({type:'move',forward:0,strafe:0});");
  await page.evaluate("window.__game.command({type:'interact'}); window.__game.fastForward(0.1);");
  await page.waitForSelector('body[data-state="completed"]');
  await shot("07-completed");

  const rows: Record<string, unknown>[] = [];
  for (const dpr of [2, 1.5]) {
    const r = await page.evaluate(
      async ({ dpr, seconds }) => {
        const g = window.__game!;
        g.restart();
        await new Promise((r) => setTimeout(r, 500));
        (document.getElementById("play") as HTMLButtonElement).click();
        g.setDpr(dpr);
        await new Promise((r) => setTimeout(r, 1000));
        g.resetCounters();
        // walk the corridor while turning the camera so the whole scene streams through the view
        g.command({ type: "move", forward: 1, strafe: 0 });
        const iv = setInterval(() => g.command({ type: "look", yaw: 0.03, pitch: 0 }), 16);
        await new Promise((r) => setTimeout(r, seconds * 1000));
        clearInterval(iv);
        g.command({ type: "move", forward: 0, strafe: 0 });
        return { dpr, size: g.renderSize(), ...g.report() };
      },
      { dpr, seconds: SECONDS },
    );
    rows.push(r);
  }

  const memory = await cdp.send("SystemInfo.getInfo").catch(() => null);
  const result = {
    date: new Date().toISOString(),
    url: URL,
    browser: await browser.version(),
    backend,
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    readyMs,
    transferredBytes: transferred,
    seconds: SECONDS,
    rows,
    gpu: memory ? (memory as { gpu?: unknown }).gpu : null,
  };
  const file = `${outDir}/measurement.json`;
  writeFileSync(file, JSON.stringify(result, null, 2));

  console.log(`\nChrome ${result.browser} · backend ${backend} · ready in ${readyMs} ms · ${(transferred / 1048576).toFixed(1)} MB transferred (cold, ~50 Mbps)\n`);
  console.log("| DPR | render | avg ms | fps | p95 ms | worst ms | frames >33 ms |");
  console.log("| --- | --- | --- | --- | --- | --- | --- |");
  for (const r of rows as { dpr: number; size: number[]; avgMs: number; p95Ms: number; worstMs: number; over33: number }[]) {
    console.log(`| ${r.dpr} | ${r.size[0]}×${r.size[1]} | ${r.avgMs.toFixed(1)} | ${(1000 / r.avgMs).toFixed(0)} | ${r.p95Ms.toFixed(1)} | ${r.worstMs.toFixed(1)} | ${r.over33} |`);
  }
  console.log(`\nsaved ${file} (+ screenshots and video in ${outDir})`);
  await context.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
