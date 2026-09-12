import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Snapshot } from "../sim/simulation";

/**
 * Provisional Uni built from primitives. The final rigged GLB (ticket 01/08) replaces this class body;
 * the interface (update/alert) stays the same, so no rule or test changes.
 */
export class UniView {
  private readonly root: TransformNode;
  private readonly body: TransformNode;
  private readonly head: TransformNode;
  private readonly horn: PBRMaterial;
  private readonly legs: TransformNode[] = [];
  private walkPhase = 0;
  private alertTime = 0;

  constructor(scene: Scene, hide: PBRMaterial, shadow: ShadowGenerator) {
    this.root = new TransformNode("uni", scene);
    this.body = new TransformNode("uniBody", scene);
    this.body.parent = this.root;

    const torso = MeshBuilder.CreateSphere("uniTorso", { diameterX: 0.5, diameterY: 0.42, diameterZ: 0.8, segments: 12 }, scene);
    torso.position.y = 0.45;
    torso.material = hide;
    torso.parent = this.body;
    shadow.addShadowCaster(torso);

    this.head = new TransformNode("uniHeadPivot", scene);
    this.head.position = new Vector3(0, 0.62, 0.36);
    this.head.parent = this.body;
    const skull = MeshBuilder.CreateSphere("uniHead", { diameterX: 0.3, diameterY: 0.3, diameterZ: 0.4, segments: 12 }, scene);
    skull.position = new Vector3(0, 0.12, 0.1);
    skull.material = hide;
    skull.parent = this.head;
    shadow.addShadowCaster(skull);

    const maneMat = new PBRMaterial("uniMane", scene);
    maneMat.albedoColor = new Color3(0.95, 0.72, 0.85);
    maneMat.roughness = 0.9;
    const mane = MeshBuilder.CreateSphere("uniManeMesh", { diameterX: 0.22, diameterY: 0.3, diameterZ: 0.4, segments: 8 }, scene);
    mane.position = new Vector3(0, 0.22, -0.05);
    mane.material = maneMat;
    mane.parent = this.head;
    const tail = MeshBuilder.CreateSphere("uniTail", { diameterX: 0.14, diameterY: 0.3, diameterZ: 0.14, segments: 8 }, scene);
    tail.position = new Vector3(0, 0.5, -0.42);
    tail.material = maneMat;
    tail.parent = this.body;

    this.horn = new PBRMaterial("uniHorn", scene);
    this.horn.albedoColor = new Color3(0.98, 0.9, 0.6);
    this.horn.emissiveColor = new Color3(0, 0, 0);
    this.horn.roughness = 0.4;
    const horn = MeshBuilder.CreateCylinder("uniHornMesh", { height: 0.22, diameterTop: 0, diameterBottom: 0.07, tessellation: 8 }, scene);
    horn.position = new Vector3(0, 0.3, 0.16);
    horn.rotation.x = -0.5;
    horn.material = this.horn;
    horn.parent = this.head;

    const eyeMat = new StandardMaterial("uniEye", scene);
    eyeMat.diffuseColor = new Color3(0.05, 0.05, 0.08);
    for (const side of [-1, 1]) {
      const eye = MeshBuilder.CreateSphere(`uniEye${side}`, { diameter: 0.05, segments: 6 }, scene);
      eye.position = new Vector3(side * 0.1, 0.16, 0.26);
      eye.material = eyeMat;
      eye.parent = this.head;
    }

    for (const [x, z] of [[-0.15, 0.25], [0.15, 0.25], [-0.15, -0.25], [0.15, -0.25]] as const) {
      const pivot = new TransformNode(`uniLegPivot${this.legs.length}`, scene);
      pivot.position = new Vector3(x, 0.42, z);
      pivot.parent = this.body;
      const leg = MeshBuilder.CreateCylinder(`uniLeg${this.legs.length}`, { height: 0.42, diameter: 0.09, tessellation: 8 }, scene);
      leg.position.y = -0.21;
      leg.material = hide;
      leg.parent = pivot;
      shadow.addShadowCaster(leg);
      this.legs.push(pivot);
    }
  }

  update(u: Snapshot["uni"], dt: number): void {
    this.root.position.set(u.x, 0, u.z);
    this.root.rotation.y = u.yaw;

    if (u.mode === "walk") {
      // leg swing period matches a 4 m/s trot so the feet do not visibly slide
      this.walkPhase += dt * 14;
      this.legs.forEach((leg, i) => {
        leg.rotation.x = Math.sin(this.walkPhase + (i % 2 === 0 ? 0 : Math.PI) + (i < 2 ? 0 : Math.PI)) * 0.5;
      });
      this.body.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.03;
    } else {
      this.legs.forEach((leg) => (leg.rotation.x *= 0.85));
      this.body.position.y = Math.sin(this.walkPhase * 0.2) * 0.005;
    }

    if (u.mode === "alert") {
      this.alertTime += dt;
      this.head.rotation.x = -0.35 + Math.sin(this.alertTime * 18) * 0.08;
      const pulse = 0.5 + Math.sin(this.alertTime * 10) * 0.5;
      this.horn.emissiveColor.set(0.9 * pulse, 0.7 * pulse, 0.3 * pulse);
    } else {
      this.head.rotation.x *= 0.9;
      this.horn.emissiveColor.scaleInPlace(0.9);
    }
  }

  alert(): void {
    this.alertTime = 0;
  }
}
