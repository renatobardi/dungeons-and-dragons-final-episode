import type { Page } from "@playwright/test";

/** Shared evidence route through the existing corridor into the chapel. */
export async function walkToChapel(page: Page): Promise<void> {
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
}
