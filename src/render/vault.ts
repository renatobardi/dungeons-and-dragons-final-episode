/**
 * Geometry of the chapel vault, kept apart from Babylon so it can be read and tested on its own.
 *
 * The room's ceiling is a quadripartite rib vault, the shape the approved chapel reference leans on.
 * A rib vault is two pointed barrels crossing at right angles: the stone that survives is the lower
 * of the two surfaces, and the seam where they meet is the diagonal the ribs follow.
 *
 * Bay coordinates are normalised: u and v run -1..1 across the bay, so the same maths serves bays of
 * any size and the room only has to say how wide each one is.
 */

export interface BayProfile {
  /** Height of the springing line, where the web leaves the pier. */
  springing: number;
  /** How far the crown climbs above the springing. */
  rise: number;
}

/** A point on the vault: bay coordinate u, world height y, bay coordinate v. */
export type RibPoint = [number, number, number];

/**
 * Height of a two-centred (pointed) arch over the span -1..1, normalised to 1 at the crown.
 *
 * `radius` is the arc's radius in half-spans: 1 draws a semicircle, 2 the equilateral arch of the
 * reference. Outside the span the arch has already landed, so it stays at zero rather than turning
 * imaginary.
 */
export function archProfile(t: number, radius = 2): number {
  const x = Math.abs(t);
  if (x >= 1) return 0;
  const offset = x + radius - 1;
  const half = radius * radius - offset * offset;
  const crown = radius * radius - (radius - 1) * (radius - 1);
  return half <= 0 ? 0 : Math.sqrt(half / crown);
}

/** Height of the vault web over a bay coordinate — the lower of the two crossing barrels. */
export function groinHeight(u: number, v: number, bay: BayProfile, radius = 2): number {
  return bay.springing + bay.rise * Math.min(archProfile(u, radius), archProfile(v, radius));
}

/**
 * Points of a rib running from `from` to `to` across the bay, riding on the vault surface. The
 * diagonals give the groin ribs; an edge pair gives the transverse arch against the wall.
 */
export function ribCurve(
  from: [number, number],
  to: [number, number],
  bay: BayProfile,
  segments: number,
  radius = 2,
): RibPoint[] {
  if (!Number.isInteger(segments) || segments < 1) throw new Error(`rib needs at least one segment, got ${segments}`);
  const points: RibPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = from[0] + (to[0] - from[0]) * t;
    const v = from[1] + (to[1] - from[1]) * t;
    points.push([u, groinHeight(u, v, bay, radius), v]);
  }
  return points;
}
