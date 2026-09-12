import type { UniMode } from "../sim/simulation";

/**
 * What is left of Uni's pose once the rig took over the body: her horn. The bones carry the stance, the
 * step and the lifted muzzle, none of which a shader can do, but the glow is a material and stays here.
 */
export function hornGlow(mode: UniMode, alertTime: number): number {
  if (mode !== "alert") return 0;
  return 0.5 + Math.sin(alertTime * 10) * 0.5;
}
