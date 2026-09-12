import type { UniMode } from "../sim/simulation";
import { UNI_STRIDE_METRES } from "./uni-rig-generated";

/** The clips baked into the rigged model by `scripts/rig-uni.py`. */
export type UniClip = "idle" | "walk" | "alert";

export function clipFor(mode: UniMode): UniClip {
  return mode;
}

/**
 * Where in the walk cycle Uni is, from the ground she has covered rather than from the clock. Driving
 * it this way is what keeps the hooves from sliding: the clip is built so one cycle carries the body
 * exactly one stride, so as long as the phase follows the distance the planted hoof stays put however
 * fast or slow she happens to be going.
 */
export function walkPhase(distance: number): number {
  const cycles = distance / UNI_STRIDE_METRES;
  return cycles - Math.floor(cycles);
}
