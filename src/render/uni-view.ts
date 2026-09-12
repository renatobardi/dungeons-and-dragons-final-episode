import type { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { loadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/loaders/glTF/2.0";
import type { Snapshot, UniMode } from "../sim/simulation";
import { walkPhase } from "./uni-gait";
import { hornGlow } from "./uni-horn";

/** Where the rigged Uni lives, relative to the page. Built by `scripts/rig-uni.py`. */
export const UNI_MODEL_URL = "models/uni/uni-rigged.glb";

/** Painted base colour that goes with the model. */
export const UNI_TEXTURE_URL = "models/uni/uni-base-color.jpg";

/**
 * Draws the Uni made in ticket 01, on the quadruped rig of ticket 13. Standing, walking and the alert
 * are the three clips baked into the model; the walk is scrubbed by the ground she has covered instead
 * of by the clock, so her hooves stay planted whatever speed the simulation moves her at.
 */
export class UniView {
  /** Resolves once the model is in the scene, so the first frame is drawn with it already there. */
  readonly loaded: Promise<void>;
  private readonly root: TransformNode;
  private readonly hornMaterial: StandardMaterial;
  private readonly glow: Mesh;
  private readonly clips = new Map<UniMode, AnimationGroup>();
  private playing: UniMode | null = null;
  private distance = 0;
  private last: { x: number; z: number } | null = null;
  private alertTime = 0;
  private frame = 0;

  constructor(scene: Scene, shadow: ShadowGenerator) {
    this.root = new TransformNode("uni", scene);

    this.hornMaterial = new StandardMaterial("uniHornGlow", scene);
    this.hornMaterial.diffuseColor = new Color3(0, 0, 0);
    this.hornMaterial.emissiveColor = new Color3(0, 0, 0);
    this.hornMaterial.disableLighting = true;
    this.glow = MeshBuilder.CreateSphere("uniHornGlowMesh", { diameter: 0.12, segments: 8 }, scene);
    this.glow.material = this.hornMaterial;
    this.glow.parent = this.root;
    this.glow.isVisible = false;

    // The material the glTF loader builds carries every scene light into the vertex stage and blows the
    // WebGPU uniform-buffer limit, so the mesh is loaded bare and painted with the scene's own PBR.
    this.loaded = loadAssetContainerAsync(UNI_MODEL_URL, scene, { pluginOptions: { gltf: { skipMaterials: true } } }).then((container) => {
      if (this.root.isDisposed()) {
        container.dispose();
        return;
      }
      container.addAllToScene();
      const painted = new PBRMaterial("uniPainted", scene);
      painted.albedoTexture = new Texture(UNI_TEXTURE_URL, scene, { invertY: false });
      painted.metallic = 0;
      painted.roughness = 0.85;
      painted.maxSimultaneousLights = 2;

      let horn: Vector3 | null = null;
      let skinned: AbstractMesh | null = null;
      for (const mesh of container.meshes) {
        if (!mesh.parent) mesh.parent = this.root;
        if (mesh.getTotalVertices() === 0) continue;
        mesh.material = painted;
        // shadow maps push light data into the vertex stage; Uni casts shadows but does not receive them,
        // which keeps the WebGPU uniform-buffer budget inside the limit
        mesh.receiveShadows = false;
        horn = higher(horn, highestVertex(mesh));
        skinned ??= mesh.skeleton ? mesh : null;
        shadow.addShadowCaster(mesh);
      }

      for (const group of container.animationGroups) {
        group.stop();
        if (group.name === "idle" || group.name === "walk" || group.name === "alert") this.clips.set(group.name, group);
      }

      // the horn is the highest point of the model, and the alert lifts the head, so the glow rides the
      // head bone rather than sitting where the horn happened to be at rest. Both the vertex and the
      // bone's bind pose are in the skinned mesh's space, which is what the glow has to be attached to:
      // the loader puts a flipped __root__ between that mesh and this one.
      const head = skinned?.skeleton?.bones.find((b) => b.name === "head");
      if (horn && head && skinned) {
        this.glow.attachToBone(head, skinned);
        this.glow.position = Vector3.TransformCoordinates(horn, head.getInvertedAbsoluteTransform());
      } else if (horn) {
        this.glow.position.copyFrom(horn);
      }
    });
  }

  update(u: Snapshot["uni"], dt: number): void {
    this.root.position.set(u.x, 0, u.z);
    this.root.rotation.y = u.yaw;

    if (u.mode === "alert") this.alertTime += dt;
    if (this.last) this.distance += Math.hypot(u.x - this.last.x, u.z - this.last.z);
    this.last = { x: u.x, z: u.z };

    this.play(u.mode);
    const walk = this.clips.get("walk");
    // the phase is read every frame, walking or not, so that standing still visibly holds the cycle
    if (walk) this.frame = walk.from + walkPhase(this.distance) * (walk.to - walk.from);
    if (walk && this.playing === "walk") walk.goToFrame(this.frame);

    const glow = hornGlow(u.mode, this.alertTime);
    this.glow.isVisible = glow > 0.02;
    this.hornMaterial.emissiveColor.set(glow, glow * 0.8, glow * 0.35);
  }

  alert(): void {
    this.alertTime = 0;
  }

  /** For browser tests: which clip is playing and the frame of it Uni is holding. */
  gait(): { clip: UniMode | null; frame: number } {
    return { clip: this.playing, frame: this.frame };
  }

  private play(clip: UniMode): void {
    if (this.playing === clip) return;
    if (this.playing) this.clips.get(this.playing)?.stop();
    const group = this.clips.get(clip);
    // the walk is scrubbed frame by frame from the distance covered, so it is started and then held
    group?.play(clip !== "walk");
    if (clip === "walk") group?.pause();
    this.playing = clip;
  }
}

function higher(a: Vector3 | null, b: Vector3 | null): Vector3 | null {
  if (!a) return b;
  if (!b) return a;
  return b.y > a.y ? b : a;
}

function highestVertex(mesh: { getVerticesData(kind: string): Float32Array | number[] | null }): Vector3 | null {
  const positions = mesh.getVerticesData("position");
  if (!positions) return null;
  let top = 0;
  for (let i = 1; i < positions.length / 3; i++) {
    if (positions[i * 3 + 1]! > positions[top * 3 + 1]!) top = i;
  }
  return new Vector3(positions[top * 3]!, positions[top * 3 + 1]!, positions[top * 3 + 2]!);
}
