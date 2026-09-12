export interface Box {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function box(minX: number, minZ: number, maxX: number, maxZ: number, minY = 0, maxY = 4): Box {
  return { minX, minY, minZ, maxX, maxY, maxZ };
}

export function containsXZ(b: Box, x: number, z: number): boolean {
  return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
}

/** Circle (radius r at x,z) overlaps the box footprint on the XZ plane. */
export function circleOverlapsXZ(b: Box, x: number, z: number, r: number): boolean {
  const cx = Math.max(b.minX, Math.min(x, b.maxX));
  const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < r * r;
}

/** Distance along the ray to the first box hit, or null. Slab method. */
export function rayBox(origin: Vec3, dir: Vec3, b: Box): number | null {
  let tMin = 0;
  let tMax = Infinity;
  const axes: ["x" | "y" | "z", number, number][] = [
    ["x", b.minX, b.maxX],
    ["y", b.minY, b.maxY],
    ["z", b.minZ, b.maxZ],
  ];
  for (const [axis, lo, hi] of axes) {
    const o = origin[axis];
    const d = dir[axis];
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return null;
      continue;
    }
    let t1 = (lo - o) / d;
    let t2 = (hi - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin;
}

export function dist2D(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}
