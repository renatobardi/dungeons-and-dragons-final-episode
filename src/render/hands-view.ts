import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { loadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import type { Snapshot } from "../sim/simulation";
import { strikePose, STRIKE_DURATION } from "./strike-pose";

/** Finished Blender forearms; the right grip and wooden club share the source mesh. */
const RIGHT_URL = "models/bobby/right-arm-club.glb";
const LEFT_URL = "models/bobby/left-arm.glb";

/** Length of the right piece, elbow to club head, in metres. Bobby is a child; the club is his size. */
const RIGHT_LENGTH = 0.90;
const LEFT_LENGTH = 0.40;
/** Motion originates below the eyes; the finished forearms continue towards the body. */
const CHEST = new Vector3(0, -0.52, -0.12);
/** Where each arm sits relative to the chest, and how it is turned to face back down the view. */
const RIGHT_REST = { position: new Vector3(0.36, 0.45, 0.82), rotation: new Vector3(0.08, 0, -0.04) };
const LEFT_REST = { position: new Vector3(-0.30, 0.23, 0.65), rotation: new Vector3(-0.65, 0, -0.14) };
/** The off hand follows the swing, but it is not the one holding the club. */
const OFF_HAND_SHARE = 0.35;

/** First-person arms and club, parented to the camera. */
export class HandsView {
  private readonly rig: TransformNode;
  private readonly right: TransformNode;
  private readonly left: TransformNode;
  private readonly bounce: PointLight;
  /** Resolves once both arms are in the scene, so loading can wait for the equipment. */
  readonly loaded: Promise<void>;
  private swingTime = -1;
  private swingHeavy = false;
  private bob = 0;
  private heldCharge = 0;
  private releaseCharge = 0;

  constructor(scene: Scene, camera: UniversalCamera) {
    this.rig = new TransformNode("handsRig", scene);
    this.rig.parent = camera;
    this.rig.position.copyFrom(CHEST);
    this.right = new TransformNode("rightArm", scene);
    this.right.parent = this.rig;
    this.left = new TransformNode("leftArm", scene);
    this.left.parent = this.rig;

    // A restrained warm bounce keeps close skin/wood readable under the cold overhead key.
    this.bounce = new PointLight("equipmentBounce", new Vector3(-0.35, 0.35, 0.1), scene);
    this.bounce.parent = camera;
    this.bounce.diffuse = new Color3(1, 0.78, 0.58);
    this.bounce.intensity = 0.65;
    this.bounce.range = 2;
    this.bounce.renderPriority = 1;
    this.bounce.setEnabled(false);
    this.loaded = this.loadArms(scene);
  }

  private async loadArms(scene: Scene): Promise<void> {
    const take = async (url: string, into: TransformNode, length: number, rest: typeof RIGHT_REST): Promise<void> => {
      const container = await loadAssetContainerAsync(url, scene);
      if (scene.isDisposed) {
        container.dispose();
        return;
      }
      container.addAllToScene();
      const mesh = container.meshes.find((m) => m.getTotalVertices() > 0) as Mesh | undefined;
      if (!mesh) return;

      // Apply the glTF handedness conversion explicitly after detaching the generated root.
      mesh.parent = null;
      mesh.rotationQuaternion = null;

      // These arms keep the maps they were generated with — skin and worn wood are most of what the
      // reference is about. Limit bindings to the equipment bounce and two scene lights.
      for (const material of container.materials) {
        if (material instanceof PBRMaterial) material.maxSimultaneousLights = 3;
      }

      // Both sources span 1.904 units before the Blender forearm continuation.
      // Including that continuation in normalization would shrink the hands and club.
      mesh.scaling.setAll(length / 1.904);
      // Convert glTF to the left-handed camera without mirroring Bobby's grip.
      mesh.scaling.z *= -1;
      mesh.position = Vector3.Zero();
      mesh.parent = into;
      into.position.copyFrom(rest.position);
      into.rotation.copyFrom(rest.rotation);

      // drawn on top of the world, so a wall or the rubble never hides Bobby's own arms
      mesh.renderingGroupId = 1;
      this.bounce.includedOnlyMeshes.push(mesh);
    };

    await Promise.all([
      take(RIGHT_URL, this.right, RIGHT_LENGTH, RIGHT_REST),
      take(LEFT_URL, this.left, LEFT_LENGTH, LEFT_REST),
    ]);
    this.bounce.setEnabled(true);
  }

  update(charge: Snapshot["charge"], dt: number): void {
    this.bob += dt;

    // rest: the arms hang and breathe, so they belong to a body instead of floating in front of one
    let pitch = Math.sin(this.bob * 1.8) * 0.012;
    let roll = Math.sin(this.bob * 1.1) * 0.008;
    let lift = Math.sin(this.bob * 1.8) * 0.006;
    let forward = 0;

    this.heldCharge = charge.charging ? charge.progress : 0;
    const carry = this.swingTime >= 0 ? this.releaseCharge * Math.max(0, 1 - this.swingTime / (this.swingHeavy ? STRIKE_DURATION.heavy : STRIKE_DURATION.light)) : 0;
    if (charge.charging || carry > 0) {
      // A compact preparation keeps the child's grip visible; readiness adds a restrained tremor.
      const p = charge.charging ? charge.progress : carry;
      pitch -= 0.06 * p;
      roll += 0.08 * p;
      lift += 0.012 * p;
      forward -= 0.02 * p;
      if (charge.ready) lift += Math.sin(this.bob * 12) * 0.0007;
    }

    if (this.swingTime >= 0) {
      const pose = strikePose(this.swingTime, this.swingHeavy);
      pitch += pose.pitch * 0.32;
      roll += pose.roll * 0.5;
      lift += pose.lift * 0.3;
      this.swingTime += dt;
      if (pose.done) this.swingTime = -1;
    }

    this.rig.rotation.set(pitch, 0, roll);
    this.rig.position.set(CHEST.x, CHEST.y + lift, CHEST.z + forward);
    // the off hand shares the motion without leading it, which is what keeps it from mirroring
    this.left.rotation.set(
      LEFT_REST.rotation.x - pitch * (1 - OFF_HAND_SHARE),
      LEFT_REST.rotation.y,
      LEFT_REST.rotation.z - roll * (1 - OFF_HAND_SHARE),
    );
  }

  swing(heavy: boolean): void {
    this.releaseCharge = this.heldCharge;
    this.swingTime = 0;
    this.swingHeavy = heavy;
  }

  /** For browser tests: whether a swing is playing and which one. */
  strike(): { playing: boolean; heavy: boolean; duration: number } {
    return {
      playing: this.swingTime >= 0,
      heavy: this.swingHeavy,
      duration: this.swingHeavy ? STRIKE_DURATION.heavy : STRIKE_DURATION.light,
    };
  }
}
