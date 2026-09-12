import { describe, expect, it } from "vitest";
import { aimPitch, easePitch, AIM_CONE, AIM_RANGE, AIM_RATE } from "../../src/sim/auto-aim";

const eye = { x: 0, y: 1.2, z: 0 };

describe("auto aim", () => {
  it("looks up at a target above the eyes and down at one below", () => {
    expect(aimPitch(eye, 0, { x: 0, y: 2.2, z: 2 })!).toBeGreaterThan(0.3);
    expect(aimPitch(eye, 0, { x: 0, y: 0.5, z: 2 })!).toBeLessThan(-0.2);
  });

  it("holds the horizon for a target at eye height", () => {
    expect(aimPitch(eye, 0, { x: 0, y: 1.2, z: 2 })!).toBeCloseTo(0, 6);
  });

  it("ignores a target further away than the assist range", () => {
    expect(aimPitch(eye, 0, { x: 0, y: 2.2, z: AIM_RANGE + 0.5 })).toBeNull();
  });

  it("ignores a target outside the cone in front of the player", () => {
    expect(aimPitch(eye, 0, { x: 0, y: 2.2, z: -2 })).toBeNull(); // behind
    const side = Math.tan(AIM_CONE + 0.2) * 2;
    expect(aimPitch(eye, 0, { x: side, y: 2.2, z: 2 })).toBeNull();
  });

  it("follows the player's yaw: the same target leaves the cone when he turns away", () => {
    const target = { x: 0, y: 2.2, z: 2 };
    expect(aimPitch(eye, 0, target)).not.toBeNull();
    expect(aimPitch(eye, Math.PI, target)).toBeNull();
  });

  it("eases toward the target no faster than the aim rate", () => {
    const dt = 1 / 60;
    expect(easePitch(0, 1, dt)).toBeCloseTo(AIM_RATE * dt, 6);
    expect(easePitch(0, -1, dt)).toBeCloseTo(-AIM_RATE * dt, 6);
  });

  it("never overshoots the target angle", () => {
    expect(easePitch(0, 0.01, 1)).toBeCloseTo(0.01, 6);
    expect(easePitch(0.5, 0.5, 1)).toBeCloseTo(0.5, 6);
  });

  it("returns to the horizon when there is nothing to look at", () => {
    expect(easePitch(0.5, null, 1 / 60)).toBeLessThan(0.5);
    expect(easePitch(0.001, null, 1)).toBeCloseTo(0, 6);
  });
});
