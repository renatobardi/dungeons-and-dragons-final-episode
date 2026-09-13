import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { loadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import type { Snapshot } from "../sim/simulation";
import { strikePose, STRIKE_DURATION } from "./strike-pose";

/**
 * Bobby's arms are two generated pieces, each a forearm continuing into a hand with its bracelet.
 * The right one carries the club as part of the same mesh: the fingers close around a grip that was
 * modelled with them, so there is no join to line up and nothing to interpenetrate when the swing
 * scales or rotates the rig — which is what the two-piece hand-plus-club kit kept getting wrong.
 */
const RIGHT_URL = "models/bobby/right-arm-club.glb";
const LEFT_URL = "models/bobby/left-arm.glb";

/** Length of the right piece, elbow to club head, in metres. Bobby is a child; the club is his size. */
const RIGHT_LENGTH = 0.6;
const LEFT_LENGTH = 0.33;
/**
 * The rig turns about Bobby's chest, not about his eyes. Swinging around the camera origin threw the
 * arms off the top of the frame as soon as the charge pulled back; hung from the chest they arc the
 * way a shoulder moves and the elbows stay where they belong.
 */
const CHEST = new Vector3(0, -0.52, -0.12);
/** Where each arm sits relative to the chest, and how it is turned to face back down the view. */
const RIGHT_REST = { position: new Vector3(0.27, 0.2, 0.72), rotation: new Vector3(0.15, Math.PI, 0.1) };
const LEFT_REST = { position: new Vector3(-0.29, 0.24, 0.7), rotation: new Vector3(0.1, Math.PI, -0.14) };
/** The off hand follows the swing, but it is not the one holding the club. */
const OFF_HAND_SHARE = 0.35;

/** First-person arms and club, parented to the camera. */
export class HandsView {
  private readonly rig: TransformNode;
  private readonly right: TransformNode;
  private readonly left: TransformNode;
  /** Resolves once both arms are in the scene, so loading can wait for the equipment. */
  readonly loaded: Promise<void>;
  private swingTime = -1;
  private swingHeavy = false;
  private bob = 0;

  constructor(scene: Scene, camera: UniversalCamera) {
    this.rig = new TransformNode("handsRig", scene);
    this.rig.parent = camera;
    this.rig.position.copyFrom(CHEST);
    this.right = new TransformNode("rightArm", scene);
    this.right.parent = this.rig;
    this.left = new TransformNode("leftArm", scene);
    this.left.parent = this.rig;

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

      // the glTF __root__ is scaled -1 on X to convert handedness and would mirror every placement
      mesh.parent = null;
      mesh.rotationQuaternion = null;

      // These arms keep the maps they were generated with — skin and worn wood are most of what the
      // reference is about — but a glTF material defaults to every light in the scene, and the room
      // has more than WebGPU will bind in one shader stage.
      for (const material of container.materials) {
        if (material instanceof PBRMaterial) material.maxSimultaneousLights = 2;
      }

      const size = mesh.getBoundingInfo().boundingBox.extendSize.scale(2);
      mesh.scaling.setAll(length / Math.max(size.x, size.y, size.z));
      mesh.position = Vector3.Zero();
      mesh.parent = into;
      into.position.copyFrom(rest.position);
      into.rotation.copyFrom(rest.rotation);

      // drawn on top of the world, so a wall or the rubble never hides Bobby's own arms
      mesh.renderingGroupId = 1;
    };

    await Promise.all([
      take(RIGHT_URL, this.right, RIGHT_LENGTH, RIGHT_REST),
      take(LEFT_URL, this.left, LEFT_LENGTH, LEFT_REST),
    ]);
  }

  update(charge: Snapshot["charge"], dt: number): void {
    this.bob += dt;

    // rest: the arms hang and breathe, so they belong to a body instead of floating in front of one
    let pitch = Math.sin(this.bob * 1.8) * 0.012;
    let roll = Math.sin(this.bob * 1.1) * 0.008;
    let lift = Math.sin(this.bob * 1.8) * 0.006;
    let forward = 0;

    if (charge.charging) {
      // the club is pulled back over the shoulder as the charge builds; ready = held high, trembling
      const p = charge.progress;
      // held high and cocked, but still in frame: past about half a radian the club leaves the top of
      // the screen and the charge reads as the arms disappearing rather than as effort
      pitch -= 0.4 * p;
      roll += 0.26 * p;
      lift += 0.06 * p;
      forward -= 0.02 * p;
      if (charge.ready) lift += Math.sin(this.bob * 50) * 0.005;
    }

    if (this.swingTime >= 0) {
      const pose = strikePose(this.swingTime, this.swingHeavy);
      pitch += pose.pitch;
      roll += pose.roll;
      lift += pose.lift;
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
