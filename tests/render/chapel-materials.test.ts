import { describe, expect, it } from "vitest";
import { chapelMaterialRole, chapelStoneSources } from "../../src/render/chapel-materials";

describe("chapel stone material", () => {
  it("uses one complete local PBR set across walls, arches and columns", () => {
    expect(chapelStoneSources.albedo).toMatch(/rock_surface_Diffuse\.jpg/);
    expect(chapelStoneSources.normal).toMatch(/rock_surface_nor_gl\.jpg/);
    expect(chapelStoneSources.arm).toMatch(/rock_surface_arm\.jpg/);
    expect(new Set(Object.values(chapelStoneSources)).size).toBe(3);
  });

  it("keeps masonry joints off carved columns and arches", () => {
    expect(chapelMaterialRole("wall")).toBe("masonry");
    expect(chapelMaterialRole("cutStone")).toBe("cut");
    expect(chapelMaterialRole("floor")).toBe("procedural");
  });
});
