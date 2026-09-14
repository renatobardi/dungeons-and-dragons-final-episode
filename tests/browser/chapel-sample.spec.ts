import { expect, test } from "@playwright/test";

test("the chapel study is a required asset, so failed loading cannot masquerade as a finished scene", async ({ page }) => {
  await page.route("**/chapel-study.glb", (route) => route.abort());
  await page.goto("/?debug&nolock");
  await expect(page.locator("body")).toHaveAttribute("data-state", "load-error", { timeout: 30000 });
});
