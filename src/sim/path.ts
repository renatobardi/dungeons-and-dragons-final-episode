export interface Point2 {
  x: number;
  z: number;
}

/** Polyline parameterized by arc length. */
export class Path {
  private readonly cumulative: number[] = [0];
  readonly length: number;

  constructor(readonly points: Point2[]) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!;
      const b = points[i]!;
      this.cumulative.push(this.cumulative[i - 1]! + Math.hypot(b.x - a.x, b.z - a.z));
    }
    this.length = this.cumulative[this.cumulative.length - 1]!;
  }

  pointAt(s: number): Point2 {
    const t = Math.max(0, Math.min(this.length, s));
    for (let i = 1; i < this.points.length; i++) {
      const s0 = this.cumulative[i - 1]!;
      const s1 = this.cumulative[i]!;
      if (t <= s1 || i === this.points.length - 1) {
        const a = this.points[i - 1]!;
        const b = this.points[i]!;
        const f = s1 === s0 ? 0 : (t - s0) / (s1 - s0);
        return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
      }
    }
    return this.points[0]!;
  }

  /** Arc-length parameter of the closest point on the polyline. */
  project(x: number, z: number): number {
    let best = 0;
    let bestD = Infinity;
    for (let i = 1; i < this.points.length; i++) {
      const a = this.points[i - 1]!;
      const b = this.points[i]!;
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const len2 = abx * abx + abz * abz;
      const f = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / len2));
      const px = a.x + abx * f;
      const pz = a.z + abz * f;
      const d = Math.hypot(x - px, z - pz);
      if (d < bestD) {
        bestD = d;
        best = this.cumulative[i - 1]! + Math.sqrt(len2) * f;
      }
    }
    return best;
  }
}
