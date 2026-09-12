import { describe, expect, it } from "vitest";
import { hornGlow } from "../../src/render/uni-horn";

describe("uni horn", () => {
  it("keeps the horn dark unless Uni is alert", () => {
    expect(hornGlow("idle", 0)).toBe(0);
    expect(hornGlow("walk", 1.2)).toBe(0);
  });

  it("pulses the horn between dark and full while alert", () => {
    const glows = [0, 0.1, 0.2, 0.3, 0.4, 0.5].map((t) => hornGlow("alert", t));
    expect(Math.min(...glows)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...glows)).toBeLessThanOrEqual(1);
    expect(Math.max(...glows) - Math.min(...glows)).toBeGreaterThan(0.5);
  });
});
