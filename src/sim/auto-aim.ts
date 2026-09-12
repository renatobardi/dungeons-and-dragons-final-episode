import type { Vec3 } from "./geometry";

/** Metres within which the view starts following an interactable. */
export const AIM_RANGE = 5;
/** Half-angle of the cone in front of the player where the assist engages. */
export const AIM_CONE = 0.9;
/** Radians per second the view eases toward (or away from) the target. */
export const AIM_RATE = 2.5;

/**
 * Bobby has no mouse and no key to look up or down, so the view follows whatever he can act on —
 * the rubble is 3.2 m tall and the exit light sits above a child's eyes. Returns the angle to hold,
 * or null when nothing nearby deserves the view.
 */
export function aimPitch(eye: Vec3, yaw: number, target: Vec3 | null): number | null {
  if (!target) return null;
  const dx = target.x - eye.x;
  const dz = target.z - eye.z;
  const ground = Math.hypot(dx, dz);
  if (ground > AIM_RANGE || ground < 1e-6) return null;
  const off = Math.abs(wrapAngle(Math.atan2(dx, dz) - yaw));
  if (off > AIM_CONE) return null;
  return Math.atan2(target.y - eye.y, ground);
}

export function easePitch(current: number, desired: number | null, dt: number): number {
  const goal = desired ?? 0;
  const step = AIM_RATE * dt;
  const delta = goal - current;
  if (Math.abs(delta) <= step) return goal;
  return current + Math.sign(delta) * step;
}

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}
