import { expect, test, type Page } from "@playwright/test";

/** Drives Bobby from the spawn to the blocked doorway using the simulation hooks (no real-time waiting). */
async function walkToObstacle(page: Page): Promise<void> {
  await page.evaluate(() => {
    const g = window.__game!;
    g.command({ type: "move", forward: 1, strafe: 0 });
    g.fastForward(4.4);
    g.command({ type: "look", yaw: Math.PI / 2, pitch: 0 });
    g.fastForward(1.5);
    g.command({ type: "look", yaw: -0.15, pitch: 0 });
    g.fastForward(3);
    g.command({ type: "look", yaw: 0.15, pitch: 0 });
    g.fastForward(3);
    g.command({ type: "move", forward: 0, strafe: 0 });
    g.command({ type: "look", yaw: Math.PI / 2 - g.snapshot().player.yaw, pitch: 0 });
  });
}

/**
 * Points Bobby back at the obstacle through the hooks. Capturing the pointer makes the browser
 * report the harness's virtual cursor as one large look, which a real player never produces; the
 * click tests below are about the button, not about the aim.
 */
async function aimAtObstacle(page: Page): Promise<void> {
  await page.evaluate(() => {
    const g = window.__game!;
    const p = g.snapshot().player;
    g.command({ type: "look", yaw: Math.PI / 2 - p.yaw, pitch: -p.pitch });
  });
  await page.waitForFunction(() => Math.abs(window.__game!.snapshot().player.pitch) < 0.05, null, { timeout: 20_000 });
}

/** Full route through the hooks: break the passage and leave. */
async function completeRun(page: Page): Promise<void> {
  await walkToObstacle(page);
  await page.evaluate(() => {
    const g = window.__game!;
    g.command({ type: "chargeStart" });
    g.fastForward(0.7);
    g.command({ type: "chargeRelease" });
    g.fastForward(0.1);
    g.command({ type: "move", forward: 1, strafe: 0 });
    g.fastForward(2.5);
    g.command({ type: "move", forward: 0, strafe: 0 });
    g.command({ type: "interact" });
    g.fastForward(0.1);
  });
}

test.describe("cenotaph entrance flow", () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/?debug");
  });

  test("P01: shows loading, then the start screen; play starts only on click", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", /loading|ready/);
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await expect(page.locator("#start")).toBeVisible();
    await expect(page.locator("#start .controls")).toContainText("Caminhar");
    await expect(page.locator("#hud")).toBeHidden();
    const backend = await page.evaluate(() => window.__game!.backend());
    expect(["webgpu", "webgl2"]).toContain(backend);

    await page.click("#play");
    await expect(page.locator("body")).toHaveAttribute("data-state", "playing");
    await expect(page.locator("#hud")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("P07: Esc pauses and releases the mouse; losing focus pauses; Bobby does not keep moving", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await page.click("#play");
    // the first frames compile the shaders for every kit piece; on a software renderer that eats into the
    // wall-clock second below, and the simulation clamps its step, so Bobby would cover less ground
    await page.waitForTimeout(1000);
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await expect(page.locator("body")).toHaveAttribute("data-state", "paused");
    await expect(page.locator("#pause")).toBeVisible();
    const zPaused = await page.evaluate(() => window.__game!.snapshot().player.z);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__game!.snapshot().player.z)).toBe(zPaused);
    await page.keyboard.up("KeyW");

    await page.click("#resume");
    await expect(page.locator("body")).toHaveAttribute("data-state", "playing");
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect(page.locator("body")).toHaveAttribute("data-state", "paused");
    expect(errors).toEqual([]);
  });

  test("P08: complete the route and restart three times without duplicates or errors", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    for (let i = 0; i < 3; i++) {
      await page.click("#play");
      await expect(page.locator("body")).toHaveAttribute("data-state", "playing");
      await completeRun(page);
      await expect(page.locator("body")).toHaveAttribute("data-state", "completed");
      await expect(page.locator("#complete")).toBeVisible();
      expect(await page.evaluate(() => window.__game!.snapshot().obstacle)).toBe("broken");

      await page.click("#restart");
      await expect(page.locator("body")).toHaveAttribute("data-state", "ready");
      const s = await page.evaluate(() => window.__game!.snapshot());
      expect(s.obstacle).toBe("intact");
      expect(s.alertFired).toBe(false);
      expect(s.charge.charging).toBe(false);
      expect(s.player.x).toBeCloseTo(0);
      expect(await page.evaluate(() => window.__game!.uniCount())).toBe(1);
      expect(await page.evaluate(() => window.__game!.sceneCount())).toBe(1);
    }
    expect(errors).toEqual([]);
  });

  test("P02: real keys walk Bobby down the corridor and stop him at the portico wall", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await page.click("#play");
    // Held keys are read once per frame and the simulation clamps its step, so a wall-clock wait would
    // measure the renderer, not the controls. Each wait below watches the simulation instead.
    await page.keyboard.down("KeyW");
    await page.waitForFunction(() => window.__game!.snapshot().player.z > 2.5, null, { timeout: 20_000 });
    await page.keyboard.up("KeyW");
    const z = await page.evaluate(() => window.__game!.snapshot().player.z);
    expect(z).toBeLessThan(4.5);
    await page.keyboard.down("KeyS");
    await page.waitForFunction(() => window.__game!.snapshot().player.z < 1.5, null, { timeout: 20_000 });
    await page.keyboard.up("KeyS");
    await page.keyboard.down("KeyD");
    await page.waitForFunction(() => window.__game!.snapshot().player.x > 2, null, { timeout: 20_000 });
    await page.keyboard.up("KeyD");
    const s = await page.evaluate(() => window.__game!.snapshot().player);
    expect(s.x).toBeLessThanOrEqual(3); // the portico wall stops him
    expect(errors).toEqual([]);
  });

  test("P09: the side arrows turn Bobby without a mouse, and Alt makes them strafe", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await page.click("#play");
    const start = await page.evaluate(() => window.__game!.snapshot().player);

    await page.keyboard.down("ArrowRight");
    await page.waitForFunction((y) => window.__game!.snapshot().player.yaw > y + 0.5, start.yaw, { timeout: 20_000 });
    await page.keyboard.up("ArrowRight");
    const turned = await page.evaluate(() => window.__game!.snapshot().player);
    expect(Math.hypot(turned.x - start.x, turned.z - start.z)).toBeLessThan(0.2); // turning is not walking

    await page.keyboard.down("ArrowLeft");
    await page.waitForFunction((y) => window.__game!.snapshot().player.yaw < y - 0.5, turned.yaw, { timeout: 20_000 });
    await page.keyboard.up("ArrowLeft");
    const back = await page.evaluate(() => window.__game!.snapshot().player.yaw);

    await page.keyboard.down("Alt");
    await page.keyboard.down("ArrowRight");
    await page.waitForFunction(
      (p) => Math.hypot(window.__game!.snapshot().player.x - p.x, window.__game!.snapshot().player.z - p.z) > 0.5,
      { x: turned.x, z: turned.z },
      { timeout: 20_000 },
    );
    await page.keyboard.up("ArrowRight");
    await page.keyboard.up("Alt");
    const strafed = await page.evaluate(() => window.__game!.snapshot().player);
    expect(strafed.yaw).toBeCloseTo(back, 5); // Alt turns the arrows into strafe, so the view holds still
    expect(errors).toEqual([]);
  });

  test("P03/P04: a real click does not open the passage; holding the button and releasing does", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await page.click("#play");
    await walkToObstacle(page);
    await aimAtObstacle(page);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__game!.snapshot().obstacle)).toBe("intact");

    // The charge builds per simulation step, so every wait below watches the charge itself:
    // on a software renderer a wall-clock wait buys far fewer steps than it looks like.
    await page.mouse.down();
    await page.waitForFunction(() => window.__game!.snapshot().charge.charging, null, { timeout: 20_000 });
    await expect(page.locator("#charge")).toHaveClass(/visible/);
    await page.waitForFunction(() => window.__game!.snapshot().charge.ready, null, { timeout: 20_000 });
    await expect(page.locator("#charge")).toHaveClass(/ready/);
    // The press itself carries another virtual-cursor look, so the aim is restored right before the
    // strike leaves: the club swings along the view at the moment the button is released.
    await aimAtObstacle(page);
    await page.mouse.up();
    await page.waitForFunction(() => window.__game!.snapshot().obstacle === "broken", null, { timeout: 20_000 });
    await page.keyboard.down("KeyW");
    await page.waitForFunction(() => window.__game!.snapshot().player.x > 21.2, null, { timeout: 20_000 });
    await page.keyboard.up("KeyW");
    expect(errors).toEqual([]);
  });

  test("P05: Uni reaches the room after the turn and stays close", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await page.click("#play");
    await page.evaluate(() => {
      const g = window.__game!;
      g.command({ type: "move", forward: 1, strafe: 0 });
      g.fastForward(4.4);
      g.command({ type: "look", yaw: Math.PI / 2, pitch: 0 });
      g.fastForward(3);
      g.command({ type: "move", forward: 0, strafe: 0 });
      g.fastForward(3);
    });
    const s = await page.evaluate(() => window.__game!.snapshot());
    expect(s.uni.x).toBeGreaterThan(8);
    expect(Math.hypot(s.uni.x - s.player.x, s.uni.z - s.player.z)).toBeLessThanOrEqual(2.5);
    expect(errors).toEqual([]);
  });

  test("P10: Uni's step follows the ground she covers, and holds when she stops", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await page.click("#play");
    await page.keyboard.down("KeyW");
    // Her step is scrubbed from the ground she covers, so the waits watch the clip, not the clock.
    await page.waitForFunction(() => window.__game!.uniGait().clip === "walk", null, { timeout: 20_000 });
    const first = await page.evaluate(() => window.__game!.uniGait());
    await page.waitForFunction((f) => window.__game!.uniGait().frame !== f, first.frame, { timeout: 20_000 });
    const second = await page.evaluate(() => window.__game!.uniGait());
    expect(first.clip).toBe("walk");
    expect(second.frame).not.toBe(first.frame);

    await page.keyboard.up("KeyW");
    await page.waitForFunction(() => window.__game!.uniGait().clip === "idle", null, { timeout: 20_000 });
    const stopped = await page.evaluate(() => window.__game!.uniGait());
    await page.waitForTimeout(600);
    const still = await page.evaluate(() => window.__game!.uniGait());
    expect(stopped.clip).toBe("idle");
    expect(still.frame).toBe(stopped.frame);
    expect(errors).toEqual([]);
  });

  test("Esc while holding the club cancels the charge; releasing after resume does not strike", async ({ page }) => {
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    await page.click("#play");
    await walkToObstacle(page);
    await aimAtObstacle(page);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await expect(page.locator("body")).toHaveAttribute("data-state", "paused");
    expect(await page.evaluate(() => window.__game!.snapshot().charge.charging)).toBe(false);
    await page.mouse.up();
    await page.click("#resume");
    await expect(page.locator("body")).toHaveAttribute("data-state", "playing");
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__game!.command({ type: "chargeRelease" }));
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__game!.snapshot().obstacle)).toBe("intact");
    expect(errors).toEqual([]);
  });
});
