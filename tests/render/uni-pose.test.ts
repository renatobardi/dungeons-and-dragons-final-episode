import { describe, expect, it } from "vitest";
import { advanceWalkPhase, uniPose, WALK_BOB_RATE } from "../../src/render/uni-pose";

describe("uni pose", () => {
  it("keeps the horn dark unless Uni is alert", () => {
    expect(uniPose("idle", 0, 0).hornGlow).toBe(0);
    expect(uniPose("walk", 1.2, 0).hornGlow).toBe(0);
  });

  it("pulses the horn between dark and full while alert", () => {
    const glows = [0, 0.1, 0.2, 0.3, 0.4, 0.5].map((t) => uniPose("alert", 0, t).hornGlow);
    expect(Math.min(...glows)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...glows)).toBeLessThanOrEqual(1);
    expect(Math.max(...glows) - Math.min(...glows)).toBeGreaterThan(0.5);
  });

  it("lifts the muzzle while alert and keeps it level otherwise", () => {
    expect(uniPose("alert", 0, 0).pitch).toBeLessThan(-0.1);
    expect(Math.abs(uniPose("idle", 0, 0).pitch)).toBeLessThan(0.01);
  });

  it("bobs the body within a foal-sized range while walking", () => {
    const bobs = Array.from({ length: 24 }, (_, i) => uniPose("walk", (i * Math.PI) / 8, 0).bobY);
    expect(Math.min(...bobs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...bobs)).toBeGreaterThan(0.02);
    expect(Math.max(...bobs)).toBeLessThanOrEqual(0.06);
  });

  it("breathes almost imperceptibly when standing still", () => {
    const bobs = Array.from({ length: 24 }, (_, i) => uniPose("idle", i * 0.5, 0).bobY);
    expect(Math.max(...bobs)).toBeLessThan(0.01);
  });

  it("advances the walk cycle only while walking, at a fixed rate", () => {
    expect(advanceWalkPhase(0, 0.5, "walk")).toBeCloseTo(WALK_BOB_RATE * 0.5, 6);
    expect(advanceWalkPhase(2, 0.5, "idle")).toBe(2);
    expect(advanceWalkPhase(2, 0.5, "alert")).toBe(2);
  });
});
