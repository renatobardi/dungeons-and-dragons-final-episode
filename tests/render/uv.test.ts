import { describe, expect, it } from "vitest";
import { boxFaceUvs, FACE } from "../../src/render/uv";

describe("world-scaled box UVs", () => {
  it("gives a face as many courses as it has metres, so texel density matches everywhere", () => {
    const uvs = boxFaceUvs(10, 4, 1, 2);
    expect(uvs[FACE.front]).toEqual([0, 0, 5, 2]);
  });

  it("measures the side faces across the depth, not the width", () => {
    const uvs = boxFaceUvs(10, 4, 1, 2);
    expect(uvs[FACE.right]).toEqual([0, 0, 0.5, 2]);
  });

  it("lays the top and bottom out on the floor plan", () => {
    const uvs = boxFaceUvs(10, 4, 6, 2);
    expect(uvs[FACE.top]).toEqual([0, 0, 5, 3]);
    expect(uvs[FACE.bottom]).toEqual([0, 0, 5, 3]);
  });

  it("covers all six faces, because an unset one falls back to the whole texture", () => {
    expect(boxFaceUvs(1, 1, 1, 1)).toHaveLength(6);
  });

  it("refuses a tile size of zero instead of returning infinite repeats", () => {
    expect(() => boxFaceUvs(2, 2, 2, 0)).toThrow();
  });
});
