import { describe, expect, it } from "vitest";
import { fitScale } from "../../src/render/fit";

describe("fit scale", () => {
  it("leaves a model that already matches the target alone", () => {
    expect(fitScale({ x: 2, y: 4, z: 2 }, { x: 2, y: 4, z: 2 })).toEqual({ x: 1, y: 1, z: 1 });
  });

  it("scales each axis on its own, so a stocky model can fill a tall collider", () => {
    const s = fitScale({ x: 0.6, y: 1, z: 0.6 }, { x: 0.8, y: 4, z: 0.8 });
    expect(s.x).toBeCloseTo(0.8 / 0.6, 6);
    expect(s.y).toBeCloseTo(4, 6);
    expect(s.z).toBeCloseTo(0.8 / 0.6, 6);
  });

  it("keeps a flat model usable instead of dividing by zero", () => {
    expect(fitScale({ x: 0, y: 1, z: 2 }, { x: 3, y: 2, z: 4 })).toEqual({ x: 1, y: 2, z: 2 });
  });
});
