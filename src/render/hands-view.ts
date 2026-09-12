import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import type { Snapshot } from "../sim/simulation";

/** Provisional first-person hands and club, parented to the camera. Final art (ticket 09) replaces the mesh, not the interface. */
export class HandsView {
  private readonly rig: TransformNode;
  private swingTime = -1;
  private swingHeavy = false;
  private bob = 0;

  constructor(scene: Scene, camera: UniversalCamera) {
    this.rig = new TransformNode("handsRig", scene);
    this.rig.parent = camera;
    this.rig.position = new Vector3(0.32, -0.3, 0.75);

    const skin = new PBRMaterial("skin", scene);
    skin.albedoColor = new Color3(0.93, 0.72, 0.58);
    skin.roughness = 0.8;
    const wood = new PBRMaterial("wood", scene);
    wood.albedoColor = new Color3(0.42, 0.26, 0.14);
    wood.roughness = 0.85;
    const fur = new PBRMaterial("fur", scene);
    fur.albedoColor = new Color3(0.55, 0.32, 0.16);
    fur.roughness = 1;

    // handle runs from the right hand (0,-0.05,-0.02) to the club head (0,0.3,0.28)
    const handleLen = Math.hypot(0.35, 0.3);
    const handle = MeshBuilder.CreateCylinder("clubHandle", { height: handleLen, diameterTop: 0.05, diameterBottom: 0.04, tessellation: 10 }, scene);
    handle.rotation.x = Math.atan2(0.3, 0.35);
    handle.position = new Vector3(0, 0.125, 0.13);
    handle.material = wood;
    handle.parent = this.rig;
    const head = MeshBuilder.CreateSphere("clubHead", { diameterX: 0.14, diameterY: 0.18, diameterZ: 0.14, segments: 10 }, scene);
    head.position = new Vector3(0, 0.3, 0.28);
    head.material = wood;
    head.parent = this.rig;
    for (let i = 0; i < 6; i++) {
      const knob = MeshBuilder.CreateSphere(`knob${i}`, { diameter: 0.045, segments: 6 }, scene);
      const a = (i / 6) * Math.PI * 2;
      knob.position = new Vector3(Math.cos(a) * 0.07, 0.3 + Math.sin(a * 2) * 0.05, 0.28 + Math.sin(a) * 0.07);
      knob.material = wood;
      knob.parent = this.rig;
    }
    const hand = MeshBuilder.CreateSphere("handR", { diameterX: 0.11, diameterY: 0.09, diameterZ: 0.13, segments: 8 }, scene);
    hand.position = new Vector3(0, -0.05, -0.02);
    hand.material = skin;
    hand.parent = this.rig;
    const cuff = MeshBuilder.CreateCylinder("cuffR", { height: 0.12, diameter: 0.12, tessellation: 8 }, scene);
    cuff.position = new Vector3(0, -0.15, -0.08);
    cuff.rotation.x = 0.6;
    cuff.material = fur;
    cuff.parent = this.rig;
    const handL = hand.clone("handL");
    handL.position = new Vector3(-0.55, -0.12, 0.05);
    handL.parent = this.rig;
    const cuffL = cuff.clone("cuffL");
    cuffL.position = new Vector3(-0.56, -0.22, -0.02);
    cuffL.parent = this.rig;
    // draw on top of the world so a wall or the rubble never hides Bobby's own hands
    for (const m of this.rig.getChildMeshes()) m.renderingGroupId = 1;
  }

  update(charge: Snapshot["charge"], dt: number): void {
    this.bob += dt;
    const restX = 0.32;
    const restY = -0.3 + Math.sin(this.bob * 1.8) * 0.006;
    let rotX = 0;
    let rotZ = 0;
    let posY = restY;
    let posX = restX;

    if (charge.charging) {
      // pull back over the shoulder as the charge builds; ready = held high and trembling
      const p = charge.progress;
      rotX = -0.9 * p;
      rotZ = 0.35 * p;
      posY += 0.12 * p;
      posX += 0.06 * p;
      if (charge.ready) posX += Math.sin(this.bob * 50) * 0.004;
    }

    if (this.swingTime >= 0) {
      const dur = this.swingHeavy ? 0.32 : 0.2;
      const t = Math.min(1, this.swingTime / dur);
      const arc = Math.sin(t * Math.PI);
      rotX += arc * (this.swingHeavy ? 1.6 : 0.9);
      rotZ -= arc * 0.4;
      posY -= arc * (this.swingHeavy ? 0.2 : 0.1);
      this.swingTime += dt;
      if (t >= 1) this.swingTime = -1;
    }

    this.rig.rotation.set(rotX, 0, rotZ);
    this.rig.position.set(posX, posY, 0.75);
  }

  swing(heavy: boolean): void {
    this.swingTime = 0;
    this.swingHeavy = heavy;
  }
}
