import { describe, expect, it } from "vitest";
import { STRIKE_DURATION, strikePose } from "../../src/render/strike-pose";

describe("strike pose", () => {
  it("starts from rest, so the swing grows out of the pose the arm was already in", () => {
    const start = strikePose(0, false);
    expect(start.pitch).toBeCloseTo(0, 6);
    expect(start.lift).toBeCloseTo(0, 6);
    expect(start.done).toBe(false);
  });

  it("winds up before it comes down: the club goes back first", () => {
    const wind = strikePose(STRIKE_DURATION.light * 0.15, false);
    expect(wind.pitch).toBeLessThan(0);
    expect(wind.lift).toBeGreaterThan(0);
  });

  it("passes through the impact on the way down, not at the end of the swing", () => {
    const impact = strikePose(STRIKE_DURATION.light * 0.5, false);
    const after = strikePose(STRIKE_DURATION.light * 0.8, false);
    expect(impact.pitch).toBeGreaterThan(0);
    expect(after.pitch).toBeLessThan(impact.pitch);
  });

  it("recovers to rest by the end, so the next swing has somewhere to start", () => {
    const end = strikePose(STRIKE_DURATION.light, false);
    expect(end.pitch).toBeCloseTo(0, 3);
    expect(end.lift).toBeCloseTo(0, 3);
    expect(end.done).toBe(true);
  });

  it("gives the heavy strike more weight: a longer swing and a deeper arc", () => {
    expect(STRIKE_DURATION.heavy).toBeGreaterThan(STRIKE_DURATION.light);
    const heavyPeak = strikePose(STRIKE_DURATION.heavy * 0.5, true).pitch;
    const lightPeak = strikePose(STRIKE_DURATION.light * 0.5, false).pitch;
    expect(heavyPeak).toBeGreaterThan(lightPeak * 1.4);
  });

  it("winds the heavy strike back further, which is what reads as effort", () => {
    const heavyWind = strikePose(STRIKE_DURATION.heavy * 0.15, true);
    const lightWind = strikePose(STRIKE_DURATION.light * 0.15, false);
    expect(heavyWind.pitch).toBeLessThan(lightWind.pitch);
  });

  /**
   * A jump between two frames is exactly what the spec calls an artificial transition. The bound is
   * loose enough for a strike that is meant to be fast and tight enough that a real discontinuity —
   * a whole amplitude in one frame — cannot pass.
   */
  it("moves continuously from first frame to last", () => {
    for (const heavy of [false, true]) {
      const duration = heavy ? STRIKE_DURATION.heavy : STRIKE_DURATION.light;
      let previous = strikePose(0, heavy);
      for (let t = 1 / 240; t <= duration + 1 / 240; t += 1 / 240) {
        const now = strikePose(t, heavy);
        expect(Math.abs(now.pitch - previous.pitch)).toBeLessThan(0.25);
        expect(Math.abs(now.roll - previous.roll)).toBeLessThan(0.25);
        expect(Math.abs(now.lift - previous.lift)).toBeLessThan(0.05);
        previous = now;
      }
    }
  });

  it("holds the rest pose once the swing is over instead of wrapping round again", () => {
    const late = strikePose(STRIKE_DURATION.heavy * 3, true);
    expect(late.pitch).toBeCloseTo(0, 6);
    expect(late.done).toBe(true);
  });
});
