import type { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { loadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/loaders/glTF/2.0";
import type { Snapshot } from "../sim/simulation";
import { advanceWalkPhase, uniPose } from "./uni-pose";

/** Where the final Uni model lives, relative to the page. */
export const UNI_MODEL_URL = "models/uni/uni.glb";

/** Painted base colour that goes with the model. */
export const UNI_TEXTURE_URL = "models/uni/uni-base-color.jpg";

/**
 * Draws the Uni made in ticket 01 (Meshy, painted texture, no outline). The model is a single mesh,
 * so walking and the alert are body motion plus the horn glow; the interface (update/alert) is the
 * one the scene already used, so no rule or test changes.
 */
export class UniView {
  /** Resolves once the model is in the scene, so the first frame is drawn with it already there. */
  readonly loaded: Promise<void>;
  private readonly root: TransformNode;
  private readonly body: TransformNode;
  private readonly hornGlow: StandardMaterial;
  private readonly glow: Mesh;
  private walkPhase = 0;
  private alertTime = 0;

  constructor(scene: Scene, shadow: ShadowGenerator) {
    this.root = new TransformNode("uni", scene);
    this.body = new TransformNode("uniBody", scene);
    this.body.parent = this.root;

    this.hornGlow = new StandardMaterial("uniHornGlow", scene);
    this.hornGlow.diffuseColor = new Color3(0, 0, 0);
    this.hornGlow.emissiveColor = new Color3(0, 0, 0);
    this.hornGlow.disableLighting = true;
    this.glow = MeshBuilder.CreateSphere("uniHornGlowMesh", { diameter: 0.12, segments: 8 }, scene);
    this.glow.material = this.hornGlow;
    this.glow.parent = this.body;
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
      for (const mesh of container.meshes) {
        if (!mesh.parent) mesh.parent = this.body;
        if (mesh.getTotalVertices() === 0) continue;
        mesh.material = painted;
        // shadow maps push light data into the vertex stage; Uni casts shadows but does not receive them,
        // which keeps the WebGPU uniform-buffer budget inside the limit
        mesh.receiveShadows = false;
        // the horn is the highest point of the model, so the glow of the alert sits on that vertex
        const positions = mesh.getVerticesData("position");
        if (positions) {
          let top = 0;
          for (let i = 1; i < positions.length / 3; i++) {
            if (positions[i * 3 + 1]! > positions[top * 3 + 1]!) top = i;
          }
          this.glow.position.set(positions[top * 3]!, positions[top * 3 + 1]!, positions[top * 3 + 2]!);
        }
        shadow.addShadowCaster(mesh);
      }
    });
  }

  update(u: Snapshot["uni"], dt: number): void {
    this.root.position.set(u.x, 0, u.z);
    this.root.rotation.y = u.yaw;

    if (u.mode === "alert") this.alertTime += dt;
    this.walkPhase = advanceWalkPhase(this.walkPhase, dt, u.mode);

    const pose = uniPose(u.mode, this.walkPhase, this.alertTime);
    this.body.position.y = pose.bobY;
    this.body.rotation.x = pose.pitch;
    this.glow.isVisible = pose.hornGlow > 0.02;
    this.hornGlow.emissiveColor.set(pose.hornGlow, pose.hornGlow * 0.8, pose.hornGlow * 0.35);
  }

  alert(): void {
    this.alertTime = 0;
  }
}
