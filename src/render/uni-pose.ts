import type { UniMode } from "../sim/simulation";

/** Radians per second of the body bob cycle while Uni trots. */
export const WALK_BOB_RATE = 9;

export interface UniPose {
  /** Vertical offset of the body, in metres. */
  bobY: number;
  /** Body pitch in radians; negative lifts the muzzle. */
  pitch: number;
  /** Horn emission, 0 (dark) to 1 (full). */
  hornGlow: number;
}

export function uniPose(mode: UniMode, walkPhase: number, alertTime: number): UniPose {
  if (mode === "walk") {
    return {
      bobY: Math.abs(Math.sin(walkPhase)) * 0.05,
      pitch: Math.sin(walkPhase * 2) * 0.03,
      hornGlow: 0,
    };
  }
  const breathing = Math.abs(Math.sin(walkPhase * 0.2)) * 0.006;
  if (mode === "alert") {
    return {
      bobY: breathing,
      pitch: -0.28 + Math.sin(alertTime * 18) * 0.06,
      hornGlow: 0.5 + Math.sin(alertTime * 10) * 0.5,
    };
  }
  return { bobY: breathing, pitch: 0, hornGlow: 0 };
}

export function advanceWalkPhase(phase: number, dt: number, mode: UniMode): number {
  return mode === "walk" ? phase + dt * WALK_BOB_RATE : phase;
}
