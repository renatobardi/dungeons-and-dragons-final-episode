import { afterEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { readFileSync } from "node:fs";
import { HandsView } from "../../src/render/hands-view";

vi.mock("@babylonjs/core/Loading/sceneLoader", () => ({
  loadAssetContainerAsync: async (url: string, scene: Scene) => {
    const bytes = readFileSync(`public/${url}`);
    const jsonSize = bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
    const primitive = gltf.meshes[0].primitives[0];
    const accessor = gltf.accessors[primitive.attributes.POSITION];
    const view = gltf.bufferViews[accessor.bufferView];
    const offset = 28 + jsonSize + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const positions = Array.from({ length: accessor.count * 3 }, (_, i) => bytes.readFloatLE(offset + i * 4));
    const mesh = new Mesh("arm", scene);
    mesh.setVerticesData(VertexBuffer.PositionKind, positions);
    return { meshes: [mesh], materials: [], addAllToScene() {}, dispose() {} };
  },
}));
const engines: NullEngine[] = [];
async function setup() {
  const engine = new NullEngine(); engines.push(engine);
  const scene = new Scene(engine);
  const camera = new UniversalCamera("camera", Vector3.Zero(), scene);
  camera.fov = 1.1;
  const hands = new HandsView(scene, camera);
  await hands.loaded;
  return { scene, hands };
}
afterEach(() => engines.splice(0).forEach((e) => e.dispose()));
const rest = { charging: false, progress: 0, ready: false };

describe("first-person equipment continuity", () => {
  it("releases a charged strike from the held pose without snapping back to rest", async () => {
    const { scene, hands } = await setup();
    hands.update({ charging: true, progress: 1, ready: true }, 0);
    const arm = scene.getTransformNodeByName("rightArm")!;
    const held = arm.computeWorldMatrix(true).clone();
    hands.swing(true);
    hands.update(rest, 0);
    const released = arm.computeWorldMatrix(true);
    expect(Array.from(released.m)).toEqual(Array.from(held.m));
  });

  it("keeps the elbow below the first-person frame at full charge", async () => {
    const { scene, hands } = await setup();
    hands.update({ charging: true, progress: 1, ready: true }, 0);
    const arm = scene.getTransformNodeByName("rightArm")!;
    // The source forearm ends at the lower end of its local Y axis.
    const mesh = arm.getChildMeshes()[0]!;
    const elbow = Vector3.TransformCoordinates(new Vector3(0, -0.95, 0), mesh.computeWorldMatrix(true));
    expect(elbow.y).toBeLessThan(-Math.max(0, elbow.z) * Math.tan(1.1 / 2));
  });
});

// Test the shipped geometry, not an idealized arm bounding box.
it("keeps both source elbow caps outside the frame throughout each strike", async () => {
  for (const heavy of [false, true]) {
    const { scene, hands } = await setup();
    hands.update({ charging: true, progress: 1, ready: true }, 0);
    hands.swing(heavy);
    for (let t = 0; t < 0.8; t += 1 / 120) {
      hands.update(rest, 1 / 120);
      for (const name of ["rightArm", "leftArm"]) {
        const mesh = scene.getTransformNodeByName(name)!.getChildMeshes()[0]!;
        const vertices = mesh.getVerticesData(VertexBuffer.PositionKind)!;
        const world = mesh.computeWorldMatrix(true);
        const { minimum, maximum } = mesh.getBoundingInfo().boundingBox;
        for (let i = 0; i < vertices.length; i += 3) {
          const p = new Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
          const atCap = name === "rightArm"
            ? p.y < minimum.y + (maximum.y - minimum.y) * 0.05
            : p.z > maximum.z - (maximum.z - minimum.z) * 0.05;
          if (!atCap) continue;
          const camera = Vector3.TransformCoordinates(p, world);
          expect(camera.y, `${name} cap at ${t.toFixed(3)}s`).toBeLessThan(-Math.max(0, camera.z) * Math.tan(1.1 / 2));
        }
      }
    }
  }
});
