export interface Extents {
  x: number;
  y: number;
  z: number;
}

/**
 * Scale that makes a model fill a collider. Kitbashed pieces come out of Meshy at whatever proportion
 * the reference frame had, so each axis is stretched on its own to match the volume the level already
 * reserves — the collision boxes are what the simulation tests rely on and they do not move.
 */
export function fitScale(model: Extents, target: Extents): Extents {
  const ratio = (m: number, t: number): number => (m > 1e-6 ? t / m : 1);
  return { x: ratio(model.x, target.x), y: ratio(model.y, target.y), z: ratio(model.z, target.z) };
}
