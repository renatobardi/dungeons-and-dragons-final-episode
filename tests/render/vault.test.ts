import { describe, expect, it } from "vitest";
import { archProfile, chapelColumnSections, groinHeight, ribCurve } from "../../src/render/vault";

describe("chapel column profile", () => {
  it("runs continuously from the floor to the vault with ornaments only at its ends", () => {
    const sections = chapelColumnSections(9);
    expect(sections.map(({ kind }) => kind)).toEqual(["base", "shaft", "capital"]);
    expect(sections[0]!.bottom).toBe(0);
    expect(sections.at(-1)!.top).toBe(9);
    for (let i = 1; i < sections.length; i++) expect(sections[i]!.bottom).toBe(sections[i - 1]!.top);
  });
});

describe("pointed arch profile", () => {
  it("springs from zero at both haunches and peaks at the crown", () => {
    expect(archProfile(-1)).toBeCloseTo(0, 6);
    expect(archProfile(1)).toBeCloseTo(0, 6);
    expect(archProfile(0)).toBeCloseTo(1, 6);
  });

  it("is a semicircle when the radius equals the half span", () => {
    expect(archProfile(0.5, 1)).toBeCloseTo(Math.sqrt(1 - 0.25), 6);
  });

  it("carries its span lower than a semicircle, the steep flank of a pointed arch", () => {
    expect(archProfile(0.5, 2)).toBeLessThan(archProfile(0.5, 1));
  });

  it("breaks at the crown instead of rounding over it, so the apex reads as a point", () => {
    expect(1 - archProfile(0.01, 2)).toBeGreaterThan(10 * (1 - archProfile(0.01, 1)));
  });

  it("stays inside the vault past the haunches instead of going imaginary", () => {
    expect(archProfile(-1.4)).toBe(0);
    expect(archProfile(1.4)).toBe(0);
  });
});

describe("groin vault surface", () => {
  const bay = { springing: 6, rise: 8 };

  it("meets the springing line at the wall, where the web dies into the pier", () => {
    expect(groinHeight(1, 0, bay)).toBeCloseTo(6, 6);
    expect(groinHeight(0, -1, bay)).toBeCloseTo(6, 6);
  });

  it("reaches the crown at the centre of the bay", () => {
    expect(groinHeight(0, 0, bay)).toBeCloseTo(14, 6);
  });

  /** A groin vault is the lower envelope of two barrels, so the diagonal is the seam between them. */
  it("follows the lower of the two barrels away from the diagonal", () => {
    const shallow = groinHeight(0.8, 0.2, bay);
    expect(shallow).toBeCloseTo(bay.springing + bay.rise * archProfile(0.8), 6);
    expect(shallow).toBeLessThan(groinHeight(0.2, 0.2, bay));
  });

  it("puts the two barrels at the same height along the diagonal, where the rib runs", () => {
    expect(groinHeight(0.6, 0.6, bay)).toBeCloseTo(groinHeight(0.6, -0.6, bay), 6);
  });
});

describe("rib curve", () => {
  const bay = { springing: 6, rise: 8 };

  it("runs corner to crown, sitting on the vault the whole way", () => {
    const points = ribCurve([-1, -1], [0, 0], bay, 8);
    expect(points).toHaveLength(9);
    expect(points[0]).toEqual([-1, 6, -1]);
    expect(points[8]![1]).toBeCloseTo(14, 6);
    for (const [u, y, v] of points) expect(y).toBeCloseTo(groinHeight(u, v, bay), 6);
  });

  it("refuses a segment count that would collapse the curve to a line", () => {
    expect(() => ribCurve([-1, -1], [0, 0], bay, 0)).toThrow();
  });
});
