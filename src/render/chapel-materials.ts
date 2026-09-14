import albedo from "../../assets/materials/chapel/rock_surface_Diffuse.jpg?url";
import normal from "../../assets/materials/chapel/rock_surface_nor_gl.jpg?url";
import arm from "../../assets/materials/chapel/rock_surface_arm.jpg?url";

/** The approved local PBR stone shared by walls, arches and columns. */
export const chapelStoneSources = { albedo, normal, arm } as const;

export function chapelMaterialRole(name: string): "masonry" | "cut" | "procedural" {
  if (name === "wall") return "masonry";
  if (name === "cutStone") return "cut";
  return "procedural";
}
