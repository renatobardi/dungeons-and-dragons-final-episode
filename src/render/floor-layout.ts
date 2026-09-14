export interface FloorRegion {
  name: string;
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export interface FloorDebris {
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  turn: number;
}

/** Non-overlapping pieces of the walkable floor, split where the architecture changes direction. */
export function chapelFloorRegions(): FloorRegion[] {
  return [
    { name: "porticoFloor", minX: -3, minZ: -2, maxX: 3, maxZ: 4 },
    { name: "corridorFloor", minX: -1.5, minZ: 4, maxX: 1.5, maxZ: 14 },
    { name: "turnFloor", minX: -1.5, minZ: 14, maxX: 10, maxZ: 17 },
    { name: "chapelFloor", minX: 10, minZ: 12, maxX: 20, maxZ: 22 },
    { name: "antechamberFloor", minX: 20, minZ: 15.5, maxX: 25, maxZ: 18.5 },
  ];
}

export function containsFloorPoint(regions: readonly FloorRegion[], x: number, z: number): boolean {
  return regions.some((region) => x >= region.minX && x <= region.maxX && z >= region.minZ && z <= region.maxZ);
}

export function overlapArea(a: FloorRegion, b: FloorRegion): number {
  const width = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const depth = Math.max(0, Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ));
  return width * depth;
}

/** Sparse chips at wall edges: enough age and damage to read, while Bobby and Uni keep a clear line. */
export function floorEdgeDebris(): FloorDebris[] {
  return [
    { x: -2.55, z: 0.2, width: 0.28, height: 0.13, depth: 0.2, turn: 0.3 },
    { x: 2.62, z: 2.8, width: 0.2, height: 0.1, depth: 0.32, turn: 1.1 },
    { x: -1.25, z: 7.4, width: 0.22, height: 0.12, depth: 0.18, turn: 0.7 },
    { x: 1.24, z: 11.2, width: 0.31, height: 0.14, depth: 0.2, turn: 2.2 },
    { x: 3.9, z: 14.3, width: 0.34, height: 0.15, depth: 0.22, turn: 0.4 },
    { x: 7.3, z: 16.7, width: 0.24, height: 0.11, depth: 0.36, turn: 1.8 },
    { x: 11.2, z: 12.5, width: 0.4, height: 0.18, depth: 0.27, turn: 0.2 },
    { x: 14.1, z: 21.55, width: 0.26, height: 0.12, depth: 0.34, turn: 2.6 },
    { x: 18.7, z: 12.48, width: 0.3, height: 0.16, depth: 0.2, turn: 1.2 },
    { x: 19.55, z: 20.4, width: 0.22, height: 0.1, depth: 0.28, turn: 0.8 },
    { x: 22.1, z: 15.82, width: 0.25, height: 0.11, depth: 0.19, turn: 2.1 },
  ];
}
