import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("exported chapel texture coverage", () => {
  it("preserves UVs on textured geometry after joining Blender pieces", () => {
    const glb = readFileSync("public/models/cenotaph/chapel-study.glb");
    const jsonLength = glb.readUInt32LE(12);
    const document = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
    const binaryStart = 28 + jsonLength;
    for (const mesh of document.meshes) {
      for (const primitive of mesh.primitives) {
        if (!document.materials[primitive.material].pbrMetallicRoughness.baseColorTexture) continue;
        const accessor = document.accessors[primitive.attributes.TEXCOORD_0];
        const view = document.bufferViews[accessor.bufferView];
        const start = binaryStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
        let mapped = 0;
        for (let i = 0; i < accessor.count; i++) {
          const offset = start + i * (view.byteStride ?? 8);
          // Missing UV layers become Blender (0,0), exported as glTF (0,1).
          if (Math.abs(glb.readFloatLE(offset)) + Math.abs(glb.readFloatLE(offset + 4) - 1) > 1e-6) mapped++;
        }
        expect(mapped / accessor.count, document.materials[primitive.material].name).toBeGreaterThan(.95);
      }
    }
  });
});
