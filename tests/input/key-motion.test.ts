import { describe, expect, it } from "vitest";
import { keyMotion, TURN_RATE } from "../../src/input/key-motion";

const held = (...codes: string[]) => new Set(codes);
const DT = 1 / 60;

describe("key motion", () => {
  it("walks with W/S and with the up/down arrows", () => {
    expect(keyMotion(held("KeyW"), DT).forward).toBe(1);
    expect(keyMotion(held("ArrowUp"), DT).forward).toBe(1);
    expect(keyMotion(held("KeyS"), DT).forward).toBe(-1);
    expect(keyMotion(held("ArrowDown"), DT).forward).toBe(-1);
    expect(keyMotion(held("KeyW", "KeyS"), DT).forward).toBe(0);
  });

  it("strafes with A/D", () => {
    expect(keyMotion(held("KeyD"), DT).strafe).toBe(1);
    expect(keyMotion(held("KeyA"), DT).strafe).toBe(-1);
    expect(keyMotion(held("KeyA", "KeyD"), DT).strafe).toBe(0);
  });

  it("turns the body with the side arrows instead of strafing", () => {
    const right = keyMotion(held("ArrowRight"), DT);
    expect(right.yaw).toBeCloseTo(TURN_RATE * DT, 6);
    expect(right.strafe).toBe(0);

    const left = keyMotion(held("ArrowLeft"), DT);
    expect(left.yaw).toBeCloseTo(-TURN_RATE * DT, 6);
    expect(left.strafe).toBe(0);

    expect(keyMotion(held("ArrowLeft", "ArrowRight"), DT).yaw).toBe(0);
  });

  it("strafes with the side arrows while Alt is held, without turning", () => {
    const right = keyMotion(held("AltLeft", "ArrowRight"), DT);
    expect(right.strafe).toBe(1);
    expect(right.yaw).toBe(0);

    const left = keyMotion(held("AltRight", "ArrowLeft"), DT);
    expect(left.strafe).toBe(-1);
    expect(left.yaw).toBe(0);
  });

  it("keeps A/D strafing while Alt is held", () => {
    expect(keyMotion(held("AltLeft", "KeyD"), DT).strafe).toBe(1);
  });

  it("turns by the same angle per second whatever the frame rate", () => {
    const slow = keyMotion(held("ArrowRight"), 1 / 30).yaw;
    const fast = keyMotion(held("ArrowRight"), 1 / 60).yaw;
    expect(slow).toBeCloseTo(fast * 2, 6);
  });

  it("never strafes faster than one direction, even doubling up D and Alt+right", () => {
    expect(keyMotion(held("AltLeft", "KeyD", "ArrowRight"), DT).strafe).toBe(1);
    expect(keyMotion(held("AltLeft", "KeyA", "ArrowLeft"), DT).strafe).toBe(-1);
  });

  it("stands still with nothing held", () => {
    expect(keyMotion(held(), DT)).toEqual({ forward: 0, strafe: 0, yaw: 0 });
  });
});
