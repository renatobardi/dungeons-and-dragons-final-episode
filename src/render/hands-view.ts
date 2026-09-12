import type { Scene } from "@babylonjs/core/scene";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { loadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import type { Snapshot } from "../sim/simulation";

/** Where the kit pieces live and how big they are in the rig. */
const CLUB_URL = "models/bobby/club.glb";
const CLUB_TEXTURE = "models/bobby/club-base-color.jpg";
const HAND_URL = "models/bobby/hand.glb";
const HAND_TEXTURE = "models/bobby/hand-base-color.jpg";
/** Distance from the gripping hand to the club head in the provisional rig. */
const CLUB_LENGTH = 0.48;
/** Bobby's club is a heavy blunt thing; the generated mesh comes out far too slim for it. */
const CLUB_THICKNESS = 1.55;
const HAND_SIZE = 0.13;
/** Where the closed right hand sits in the rig, and so where the club's grip has to land. */
const GRIP = { x: 0, y: -0.05, z: -0.02 };
/** Direction the club points out of the fist: up and forward, as the provisional handle did. */
const HANDLE_LINE = new Vector3(0, 0.35, 0.3);

/**
 * The two ends of a long thin mesh and which of them is the thin one. Meshy returns the club lying on
 * whatever diagonal the reference image had, so the rig cannot assume an orientation: it measures the
 * longest span across the vertices and counts the mass around each end to tell grip from head.
 */
function ends(mesh: Mesh): { grip: Vector3; head: Vector3 } {
  const p = mesh.getVerticesData("position");
  if (!p) return { grip: Vector3.Zero(), head: Vector3.Zero() };
  const at = (i: number): Vector3 => new Vector3(p[i * 3]!, p[i * 3 + 1]!, p[i * 3 + 2]!);
  const count = p.length / 3;

  let a = 0;
  for (let i = 1; i < count; i++) if (at(i).lengthSquared() > at(a).lengthSquared()) a = i;
  let b = 0;
  for (let i = 1; i < count; i++) if (Vector3.DistanceSquared(at(i), at(a)) > Vector3.DistanceSquared(at(b), at(a))) b = i;

  const span = Vector3.Distance(at(a), at(b));
  const near = (end: Vector3): number => {
    let n = 0;
    for (let i = 0; i < count; i++) if (Vector3.Distance(at(i), end) < span * 0.25) n++;
    return n;
  };
  const ea = at(a);
  const eb = at(b);
  return near(ea) < near(eb) ? { grip: ea, head: eb } : { grip: eb, head: ea };
}

/** First-person hands and club, parented to the camera. */
export class HandsView {
  private readonly rig: TransformNode;
  private swingTime = -1;
  private swingHeavy = false;
  private bob = 0;

  constructor(scene: Scene, camera: UniversalCamera) {
    this.rig = new TransformNode("handsRig", scene);
    this.rig.parent = camera;
    this.rig.position = new Vector3(0.32, -0.3, 0.75);

    void this.loadKit(scene);
  }

  /**
   * Bobby's club and hands come from the kit (ticket 09). The rig keeps the anchor points the
   * provisional primitives used, so the swing and the charge in update() are untouched.
   */
  private async loadKit(scene: Scene): Promise<void> {
    const paint = (name: string, texture: string): PBRMaterial => {
      const mat = new PBRMaterial(name, scene);
      mat.albedoTexture = new Texture(texture, scene, { invertY: false });
      mat.metallic = 0;
      mat.roughness = 0.85;
      mat.maxSimultaneousLights = 2;
      return mat;
    };
    const take = async (url: string): Promise<Mesh | null> => {
      const container = await loadAssetContainerAsync(url, scene, { pluginOptions: { gltf: { skipMaterials: true } } });
      if (scene.isDisposed) {
        container.dispose();
        return null;
      }
      container.addAllToScene();
      const mesh = container.meshes.find((m) => m.getTotalVertices() > 0) as Mesh | undefined;
      if (!mesh) return null;
      mesh.parent = null; // the glTF __root__ is scaled -1 on X and would mirror every placement
      mesh.rotationQuaternion = null;
      return mesh;
    };

    const [club, hand] = await Promise.all([take(CLUB_URL), take(HAND_URL)]);

    if (club) {
      club.material = paint("clubPainted", CLUB_TEXTURE);
      const size = club.getBoundingInfo().boundingBox.extendSize.scale(2);
      // the model already lies along the up-and-forward diagonal the rig wants, so only its length matters
      const along = Math.hypot(size.y, size.z);
      const fit = CLUB_LENGTH / along;
      club.scaling.set(fit * CLUB_THICKNESS, fit, fit * CLUB_THICKNESS);
      // the grip is the low corner of the model; it is what has to sit in the closed right hand
      // Point the club along the rig's handle line, then drop the grip into the closed fist.
      const { grip, head } = ends(club);
      club.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
        head.subtract(grip).normalize(),
        HANDLE_LINE.normalizeToNew(),
        new Quaternion(),
      );
      const heldAt = grip.scale(fit).applyRotationQuaternion(club.rotationQuaternion);
      club.position = new Vector3(GRIP.x - heldAt.x, GRIP.y - heldAt.y, GRIP.z - heldAt.z);
      club.parent = this.rig;
    }

    if (hand) {
      hand.material = paint("handPainted", HAND_TEXTURE);
      const size = hand.getBoundingInfo().boundingBox.extendSize.scale(2);
      const fit = HAND_SIZE / size.y;
      hand.scaling.setAll(fit);
      hand.position = new Vector3(0, GRIP.y, GRIP.z);
      hand.parent = this.rig;
      const left = hand.createInstance("handL");
      left.scaling.set(-fit, fit, fit); // the other hand is this one mirrored
      left.position = new Vector3(-0.55, -0.12, 0.05);
      left.parent = this.rig;
    }

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
