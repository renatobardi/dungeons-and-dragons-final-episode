import { describe, expect, it } from "vitest";
import { UNI_STRIDE_METRES } from "../../src/render/uni-rig-generated";
import { walkPhase } from "../../src/render/uni-gait";

describe("uni gait", () => {
  it("spends exactly one cycle of the clip on one stride of ground", () => {
    expect(walkPhase(0)).toBeCloseTo(0, 6);
    expect(walkPhase(UNI_STRIDE_METRES / 4)).toBeCloseTo(0.25, 6);
    expect(walkPhase(UNI_STRIDE_METRES / 2)).toBeCloseTo(0.5, 6);
  });

  it("wraps without a jump once a stride is complete", () => {
    expect(walkPhase(UNI_STRIDE_METRES)).toBeCloseTo(0, 6);
    expect(walkPhase(UNI_STRIDE_METRES * 3.25)).toBeCloseTo(0.25, 6);
  });

  it("never leaves the clip, however far Uni has walked", () => {
    for (const d of [0.01, 1, 7.5, 123.456]) {
      expect(walkPhase(d)).toBeGreaterThanOrEqual(0);
      expect(walkPhase(d)).toBeLessThan(1);
    }
  });
});
