import { Scene } from "@babylonjs/core/scene";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { loadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { TAARenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/taaRenderingPipeline";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import "@babylonjs/core/Rendering/prePassRendererSceneComponent";
import "@babylonjs/core/Rendering/geometryBufferRendererSceneComponent";

import type { LevelDefinition } from "../sim/level";
import type { Box } from "../sim/geometry";
import type { SimEvent, Snapshot } from "../sim/simulation";
import { stoneSurface, RUBBLE, STONE_FLOOR, STONE_WALL } from "./textures";
import { buildChapel, TILE, VAULT_CROWN } from "./chapel";
import { boxFaceUvs } from "./uv";
import { buildTorch, flicker, type Torch } from "./torch";
import { UniView } from "./uni-view";
import { fitScale } from "./fit";

/** Cenotaph kit: the column made in ticket 07 and the painted stone that goes with it. */
const COLUMN_MODEL_URL = "models/cenotaph/column.glb";
const COLUMN_TEXTURE_URL = "models/cenotaph/column-base-color.jpg";
/** The volume the level already reserves for a column, so the colliders stay where they are. */
const COLUMN_SIZE = { x: 0.8, y: 4, z: 0.8 };
const RUBBLE_INTACT_URL = "models/cenotaph/rubble-intact.glb";
const RUBBLE_BROKEN_URL = "models/cenotaph/rubble-broken.glb";
const ARCH_URL = "models/cenotaph/arch.glb";
const ARCH_TEXTURE = "models/cenotaph/arch-base-color.jpg";
const STATUE_URL = "models/cenotaph/statue.glb";
const STATUE_TEXTURE = "models/cenotaph/statue-base-color.jpg";
/** Statues stand against the north and south walls of the room, clear of the columns at x 12.5 and 17.5. */
const STATUE_SPOTS: [number, number, number][] = [
  [15, 21.4, Math.PI],
  [15, 12.6, 0],
];
import { HandsView } from "./hands-view";

/**
 * Which sconces carry a real light. The scene tops out at seven lights on WebGPU — the shaft, the sky,
 * the exit and four torches — and asking for one more does not warn, it renders black. Measured, not
 * assumed: five lit torches is a black screen on this Mac in Chrome. The unlit ones still burn, and
 * these four are the ones whose pools of light the route actually passes through.
 */
const LIT_TORCHES = new Set([1, 3, 4, 5]);

export interface QualitySettings {
  taa: boolean;
  highShadows: boolean;
  cameraShake: boolean;
}

/** Draws whatever the simulation says. Holds no game rules. */
export class SceneView {
  readonly scene: Scene;
  readonly camera: UniversalCamera;
  /** Resolves when every asset the scene loads is in place. */
  readonly ready: Promise<void>;
  private readonly uni: UniView;
  private readonly hands: HandsView;
  private readonly obstacleIntact: TransformNode;
  private readonly obstacleBroken: TransformNode;
  private readonly dust: ParticleSystem;
  private readonly torches: Torch[];
  private readonly chapel: ReturnType<typeof buildChapel>;
  private readonly shadow: ShadowGenerator;
  private readonly pipeline: DefaultRenderingPipeline;
  private taa: TAARenderingPipeline | null = null;
  private shakeTime = 0;
  private shakeStrength = 0;
  private elapsed = 0;
  private quality: QualitySettings;

  constructor(engine: AbstractEngine, readonly level: LevelDefinition, quality: QualitySettings) {
    this.quality = { ...quality };
    const scene = new Scene(engine);
    this.scene = scene;
    scene.clearColor = new Color4(0.02, 0.015, 0.03, 1);
    scene.ambientColor = new Color3(0.25, 0.22, 0.28);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.016; // the vault has to stay readable seventeen metres up
    scene.fogColor = new Color3(0.05, 0.04, 0.07);

    this.camera = new UniversalCamera("bobby", new Vector3(0, 1.2, 0), scene);
    this.camera.inputs.clear();
    this.camera.minZ = 0.05;
    this.camera.maxZ = 120;
    this.camera.fov = 1.1;

    // Key light: a cold shaft from the portico. Torches add the warm painted contrast.
    const sun = new DirectionalLight("shaft", new Vector3(-0.35, -1, 0.55), scene);
    sun.intensity = 1.6;
    sun.diffuse = new Color3(0.72, 0.78, 0.95);
    sun.position = new Vector3(6, VAULT_CROWN + 6, 4);
    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 60;
    const hemi = new HemisphericLight("sky", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.55;
    hemi.diffuse = new Color3(0.56, 0.6, 0.74); // daylight down the clerestory
    hemi.groundColor = new Color3(0.34, 0.26, 0.22); // torchlight bouncing off the floor, which is all the vault gets

    this.shadow = new ShadowGenerator(quality.highShadows ? 2048 : 1024, sun);
    this.shadow.usePercentageCloserFiltering = true;
    this.shadow.filteringQuality = quality.highShadows ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_LOW;
    this.shadow.bias = 0.0015;
    this.shadow.normalBias = 0.02;

    const wallMat = this.stone("wall", STONE_WALL);
    const floorMat = this.stone("floor", STONE_FLOOR, 9);
    const rubbleMat = this.stone("rubble", RUBBLE, 18);

    const floor = this.slab("floor", -30, -30, 50, 50, 0, false);
    floor.material = floorMat;
    floor.receiveShadows = true;
    // The corridor and the portico keep their low ceiling; the room is left open, because the chapel
    // vault closes it seventeen metres up. Four slabs around the room do what one 80 m slab used to.
    const r = level.room;
    const lid = (name: string, minX: number, minZ: number, maxX: number, maxZ: number): void => {
      this.slab(name, minX, minZ, maxX, maxZ, 4, true).material = wallMat;
    };
    lid("ceilingS", -30, -30, 50, r.minZ);
    lid("ceilingN", -30, r.maxZ, 50, 50);
    lid("ceilingW", -30, r.minZ, r.minX, r.maxZ);
    lid("ceilingE", r.maxX, r.minZ, 50, r.maxZ);

    this.chapel = buildChapel(scene, r, wallMat);
    // the chapel takes light but casts none: a vault in the shadow map would put the whole room under
    // its own shadow, which is the opposite of what the height is there to show
    for (const m of this.chapel.stone) m.receiveShadows = true;

    // the column colliders live in the wall list too; the kit model stands in their place, so the box
    // that would hide it is not drawn
    const isColumn = (b: Box): boolean =>
      level.columns.some((c) => Math.abs((b.minX + b.maxX) / 2 - c.x) < 0.01 && Math.abs((b.minZ + b.maxZ) / 2 - c.z) < 0.01);
    level.walls.filter((b) => !isColumn(b)).forEach((b, i) => {
      const m = this.boxMesh(`wall${i}`, b);
      m.material = wallMat;
      m.receiveShadows = true;
      this.shadow.addShadowCaster(m);
    });

    // torches along the route
    const torchSpots: [number, number, number][] = [
      [-1.35, 2.6, 8],
      [1.35, 2.6, 12],
      [5, 2.6, 16.85],
      [10.15, 2.6, 20],
      [19.85, 2.6, 13.5],
      [19.85, 2.6, 20.5],
      [24.85, 2.6, 17],
    ];
    const glow = new GlowLayer("glow", scene, { blurKernelSize: 32 });
    glow.intensity = 0.32; // enough to bloom the wick, not enough to swallow the flame into a ball
    // Every torch burns, but only the first few carry a light. WebGPU binds a limited number of
    // uniform buffers per shader stage, and with the chapel and Uni in the scene the room cannot
    // afford one light per sconce; the flames still light themselves through the glow layer.
    this.torches = torchSpots.map(([x, y, z], i) =>
      buildTorch(scene, new Vector3(x, y, z), rubbleMat, i, { lit: LIT_TORCHES.has(i) }),
    );
    for (const torch of this.torches) {
      for (const piece of torch.iron) this.shadow.addShadowCaster(piece);
    }

    // obstacle: intact pile vs broken rubble
    this.obstacleIntact = new TransformNode("obstacleIntact", scene);
    this.obstacleBroken = new TransformNode("obstacleBroken", scene);
    this.obstacleBroken.setEnabled(false);

    // exit: a warm glow beyond the doorway
    const exitMat = new StandardMaterial("exitMat", scene);
    exitMat.emissiveColor = new Color3(0.62, 0.5, 0.28);
    exitMat.disableLighting = true;
    exitMat.backFaceCulling = false;
    const e = level.exitZone;
    const exitPlane = MeshBuilder.CreatePlane("exitGlow", { width: 2.6, height: 3.2 }, scene);
    exitPlane.position = new Vector3(e.maxX - 0.05, 1.7, (e.minZ + e.maxZ) / 2);
    exitPlane.rotation.y = -Math.PI / 2;
    exitPlane.material = exitMat;
    const exitLight = new PointLight("exitLight", new Vector3(e.maxX - 0.6, 1.8, (e.minZ + e.maxZ) / 2), scene);
    exitLight.diffuse = new Color3(1, 0.85, 0.5);
    exitLight.intensity = 12;
    exitLight.range = 8;

    this.dust = this.buildDust(level.obstacle.collider);

    this.uni = new UniView(scene, this.shadow);
    this.hands = new HandsView(scene, this.camera);
    this.ready = Promise.all([this.uni.loaded, this.hands.loaded, this.loadColumns(), this.loadObstacle(), this.loadDecor()]).then(() => undefined);

    this.pipeline = new DefaultRenderingPipeline("post", true, scene, [this.camera]);
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 0.75;
    this.pipeline.bloomWeight = 0.25;
    this.pipeline.bloomKernel = 48;
    this.pipeline.imageProcessingEnabled = true;
    this.pipeline.imageProcessing.contrast = 1.15;
    this.pipeline.imageProcessing.exposure = 1.05;
    this.pipeline.imageProcessing.vignetteEnabled = true;
    this.pipeline.imageProcessing.vignetteWeight = 1.4;
    this.pipeline.fxaaEnabled = !quality.taa;
    this.setTaa(quality.taa);
  }

  setQuality(q: Partial<QualitySettings>): void {
    this.quality = { ...this.quality, ...q };
    if (q.taa !== undefined) {
      this.setTaa(q.taa);
      this.pipeline.fxaaEnabled = !q.taa;
    }
    if (q.highShadows !== undefined) {
      this.shadow.filteringQuality = q.highShadows ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_LOW;
    }
  }

  private setTaa(on: boolean): void {
    if (on && !this.taa) {
      this.taa = new TAARenderingPipeline("taa", this.scene, [this.camera]);
      this.taa.samples = 8;
      this.taa.factor = 0.1;
      this.taa.isEnabled = true;
    } else if (!on && this.taa) {
      this.taa.dispose();
      this.taa = null;
    }
  }

  /** Called once per rendered frame with the latest simulation state. */
  update(s: Snapshot, dt: number): void {
    this.elapsed += dt;
    const shake = this.shakeStrength > 0 && this.quality.cameraShake ? this.shakeStrength * Math.sin(this.shakeTime * 60) : 0;
    this.shakeTime += dt;
    this.shakeStrength = Math.max(0, this.shakeStrength - dt * 0.6);
    this.camera.position.set(s.player.x, s.player.eyeHeight + shake * 0.04, s.player.z);
    this.camera.rotation.set(-s.player.pitch + shake * 0.01, s.player.yaw, shake * 0.01);

    this.obstacleIntact.setEnabled(s.obstacle === "intact");
    this.obstacleBroken.setEnabled(s.obstacle === "broken");

    this.uni.update(s.uni, dt);
    this.hands.update(s.charge, dt);

    // the shafts drift, the way dust in a real beam never holds still
    this.chapel.shafts.forEach((shaft, i) => {
      const mat = shaft.material as StandardMaterial;
      mat.alpha = 0.2 + Math.sin(this.elapsed * 0.5 + i * 1.3) * 0.04;
    });

    this.torches.forEach((torch, i) => flicker(torch, this.elapsed, i));
  }

  /** For browser tests: the clip Uni is playing and the frame of it she is holding. */
  uniGait(): ReturnType<UniView["gait"]> {
    return this.uni.gait();
  }

  applyEvent(ev: SimEvent): void {
    switch (ev.type) {
      case "strike":
        this.hands.swing(ev.heavy);
        if (ev.heavy) this.shakeStrength = 1;
        else if (ev.hit !== "none") this.shakeStrength = 0.3;
        break;
      case "obstacleBroken":
        this.dust.manualEmitCount = 160;
        this.dust.start();
        this.shakeStrength = 1.6;
        break;
      case "uniAlert":
        this.uni.alert();
        break;
    }
  }

  dispose(): void {
    this.scene.dispose();
  }

  // --- builders -------------------------------------------------------------

  /**
   * One masonry material: colour, relief and roughness from the same procedural stone, so the walls
   * answer a torch the way a carved block does instead of like a printed card.
   */
  private stone(name: string, spec: typeof STONE_WALL, relief = 14): PBRMaterial {
    const mat = new PBRMaterial(name, this.scene);
    const surface = stoneSurface(this.scene, name, 1024, spec, relief);
    for (const tex of [surface.albedo, surface.normal, surface.roughness]) {
      tex.wrapU = Texture.WRAP_ADDRESSMODE;
      tex.wrapV = Texture.WRAP_ADDRESSMODE;
      // every mesh carries UVs measured in metres, so the material itself tiles once
    }
    mat.albedoTexture = surface.albedo;
    mat.bumpTexture = surface.normal;
    mat.metallicTexture = surface.roughness;
    mat.useRoughnessFromMetallicTextureGreen = true;
    mat.useMetallnessFromMetallicTextureBlue = true;
    mat.metallic = 0;
    mat.roughness = 1;
    mat.ambientColor = new Color3(0.4, 0.38, 0.45);
    return mat;
  }


  private boxMesh(name: string, b: Box): Mesh {
    const width = b.maxX - b.minX;
    const height = b.maxY - b.minY;
    const depth = b.maxZ - b.minZ;
    const faceUV = boxFaceUvs(width, height, depth, TILE).map((f) => new Vector4(...f));
    const m = MeshBuilder.CreateBox(name, { width, height, depth, faceUV, wrap: true }, this.scene);
    m.position = new Vector3((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2);
    return m;
  }

  /** A floor or ceiling slab whose UVs are metres, like every other surface in the room. */
  private slab(name: string, minX: number, minZ: number, maxX: number, maxZ: number, y: number, flip: boolean): Mesh {
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const m = MeshBuilder.CreateGround(name, { width, height: depth, subdivisions: 2 }, this.scene);
    const uvs = m.getVerticesData("uv")!;
    for (let i = 0; i < uvs.length; i += 2) {
      uvs[i] = uvs[i]! * (width / TILE);
      uvs[i + 1] = uvs[i + 1]! * (depth / TILE);
    }
    m.setVerticesData("uv", uvs);
    m.position = new Vector3((minX + maxX) / 2, y, (minZ + maxZ) / 2);
    if (flip) m.rotation.x = Math.PI;
    return m;
  }

  /**
   * Columns come from the Cenotaph kit (ticket 07). The collider each one gets in the level definition
   * is the volume the model is stretched into, so the simulation keeps the boxes it always had.
   * Same recipe as Uni: the mesh is loaded bare and painted here, or the glTF material carries every
   * scene light into the vertex stage and WebGPU rejects the frame.
   */
  /**
   * The blocked passage. The intact pile is a real heap of broken blocks with a fallen column drum in
   * it, so it is placed whole and scaled uniformly: stretching it to the doorway, the way the old flat
   * relief was, would smear the blocks into prisms and take the mass out of the obstacle.
   *
   * The broken state is the same heap of debris swept to either jamb, with the middle of the doorway
   * left clear. Bobby needs 0.35 m of room and a path he can see is open; a pile left across the
   * centre reads as still blocked even when the collider is gone.
   */
  private async loadObstacle(): Promise<void> {
    const b = this.level.obstacle.collider;
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const doorway = { width: b.maxZ - b.minZ, height: b.maxY - b.minY };

    const take = async (url: string): Promise<Mesh | null> => {
      const container = await loadAssetContainerAsync(url, this.scene);
      if (this.scene.isDisposed) {
        container.dispose();
        return null;
      }
      container.addAllToScene();
      const mesh = container.meshes.find((m) => m.getTotalVertices() > 0) as Mesh | undefined;
      if (!mesh) return null;
      mesh.parent = null; // the glTF __root__ is scaled -1 on X and would mirror the placement
      mesh.rotationQuaternion = null;
      for (const material of container.materials) {
        if (material instanceof PBRMaterial) material.maxSimultaneousLights = 2;
      }
      return mesh;
    };

    const [intact, broken] = await Promise.all([take(RUBBLE_INTACT_URL), take(RUBBLE_BROKEN_URL)]);

    if (intact) {
      const size = intact.getBoundingInfo().boundingBox.extendSize.scale(2);
      // The heap is widest along one horizontal axis; that axis has to lie across the doorway, or the
      // pile blocks the passage edge-on and Bobby can see straight past it.
      // The generation was made from a straight-on reference, so its detail is on one face and its
      // back is the flat cut where the crop ended. That face has to meet Bobby, who comes from -X.
      const acrossIsX = size.x >= size.z;
      intact.rotation.y = acrossIsX ? -Math.PI / 2 : Math.PI;
      const across = Math.max(size.x, size.z);
      // filling the doorway means covering its width and its height; the depth can overhang
      const fit = Math.max(doorway.width / across, (doorway.height * 1.08) / size.y);
      intact.scaling.setAll(fit);
      intact.position = new Vector3(cx, (size.y * fit) / 2, cz);
      intact.parent = this.obstacleIntact;
      intact.receiveShadows = true;
      this.shadow.addShadowCaster(intact);
    }

    if (broken) {
      const size = broken.getBoundingInfo().boundingBox.extendSize.scale(2);
      const heapWidth = 1.05;
      const fit = heapWidth / Math.max(size.x, size.z);
      const jambs: [number, number][] = [
        [cz - doorway.width / 2 + heapWidth / 2, 0.4],
        [cz + doorway.width / 2 - heapWidth / 2, -2.1],
      ];
      jambs.forEach(([z, turn], i) => {
        const heap = i === 0 ? broken : (broken.createInstance(`rubbleHeap${i}`) as unknown as Mesh);
        heap.scaling.setAll(fit);
        heap.rotationQuaternion = null;
        heap.rotation.y = turn; // the two heaps are the same stones seen from different sides
        heap.position = new Vector3(cx, 0, z);
        heap.parent = this.obstacleBroken;
        this.shadow.addShadowCaster(heap);
      });
    }
  }

  /** Decoration with no collider: the arch framing the portico mouth and the statues along the room. */
  private async loadDecor(): Promise<void> {
    const paint = (name: string, texture: string): PBRMaterial => {
      const mat = new PBRMaterial(name, this.scene);
      mat.albedoTexture = new Texture(texture, this.scene, { invertY: false });
      mat.metallic = 0;
      mat.roughness = 0.92;
      mat.maxSimultaneousLights = 2;
      return mat;
    };

    const [archBox, statueBox] = await Promise.all([
      loadAssetContainerAsync(ARCH_URL, this.scene, { pluginOptions: { gltf: { skipMaterials: true } } }),
      loadAssetContainerAsync(STATUE_URL, this.scene, { pluginOptions: { gltf: { skipMaterials: true } } }),
    ]);
    if (this.scene.isDisposed) {
      archBox.dispose();
      statueBox.dispose();
      return;
    }
    archBox.addAllToScene();
    statueBox.addAllToScene();

    const arch = archBox.meshes.find((m) => m.getTotalVertices() > 0);
    if (arch) {
      arch.parent = null;
      arch.material = paint("archPainted", ARCH_TEXTURE);
      arch.receiveShadows = false;
      const size = arch.getBoundingInfo().boundingBox.extendSize.scale(2);
      const MOUTH = 3; // the corridor opening the portico wall leaves
      const up = 4 / size.y;
      arch.scaling = new Vector3(MOUTH / size.x, up, MOUTH / size.x);
      arch.rotationQuaternion = null;
      arch.position = new Vector3(0, (size.y * up) / 2, 4);
      this.shadow.addShadowCaster(arch as Mesh);
    }

    const statue = statueBox.meshes.find((m) => m.getTotalVertices() > 0);
    if (statue) {
      statue.parent = null;
      statue.material = paint("statuePainted", STATUE_TEXTURE);
      statue.receiveShadows = false;
      const size = statue.getBoundingInfo().boundingBox.extendSize.scale(2);
      const up = 2.2 / size.y;
      statue.scaling = new Vector3(up, up, up);
      STATUE_SPOTS.forEach(([x, z, facing], i) => {
        const piece = i === 0 ? (statue as Mesh) : (statue as Mesh).createInstance(`statue${i}`);
        piece.rotationQuaternion = null;
        piece.rotation.y = facing;
        piece.position = new Vector3(x, (size.y * up) / 2, z);
        this.shadow.addShadowCaster(piece as Mesh);
      });
    }
  }

  private async loadColumns(): Promise<void> {
    if (this.level.columns.length === 0) return;
    const container = await loadAssetContainerAsync(COLUMN_MODEL_URL, this.scene, { pluginOptions: { gltf: { skipMaterials: true } } });
    if (this.scene.isDisposed) {
      container.dispose();
      return;
    }
    container.addAllToScene();
    const source = container.meshes.find((m) => m.getTotalVertices() > 0);
    if (!source) return;

    // the glTF loader wraps the mesh in a __root__ scaled -1 on X to convert handedness; anything placed
    // while still parented to it lands mirrored, so the piece is detached before it is put in the room
    source.parent = null;
    source.rotationQuaternion = null;

    const painted = new PBRMaterial("columnPainted", this.scene);
    painted.albedoTexture = new Texture(COLUMN_TEXTURE_URL, this.scene, { invertY: false });
    painted.metallic = 0;
    painted.roughness = 0.9;
    painted.maxSimultaneousLights = 2;
    source.material = painted;
    source.receiveShadows = false;

    const size = source.getBoundingInfo().boundingBox.extendSize.scale(2);
    const fit = fitScale({ x: size.x, y: size.y, z: size.z }, COLUMN_SIZE);
    source.scaling = new Vector3(fit.x, fit.y, fit.z);

    this.level.columns.forEach(({ x, z }, i) => {
      const piece = i === 0 ? (source as Mesh) : (source as Mesh).createInstance(`col${i}`);
      piece.position = new Vector3(x, COLUMN_SIZE.y / 2, z);
      this.shadow.addShadowCaster(piece as Mesh);
    });
  }

  private buildDust(b: Box): ParticleSystem {
    const ps = new ParticleSystem("dust", 200, this.scene);
    ps.particleTexture = this.dustTexture();
    ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    ps.emitter = new Vector3((b.minX + b.maxX) / 2, 1.2, (b.minZ + b.maxZ) / 2);
    ps.minEmitBox = new Vector3(-0.7, -1, -1.4);
    ps.maxEmitBox = new Vector3(0.7, 1.4, 1.4);
    ps.color1 = new Color4(0.36, 0.31, 0.27, 0.45);
    ps.color2 = new Color4(0.28, 0.24, 0.22, 0.35);
    ps.colorDead = new Color4(0.2, 0.18, 0.17, 0);
    ps.minSize = 0.3;
    ps.maxSize = 0.8;
    ps.minLifeTime = 0.9;
    ps.maxLifeTime = 2.2;
    ps.emitRate = 0;
    ps.manualEmitCount = 0;
    ps.direction1 = new Vector3(-1.5, 1.5, -1.5);
    ps.direction2 = new Vector3(1.5, 3, 1.5);
    ps.gravity = new Vector3(0, -1.2, 0);
    ps.minEmitPower = 0.8;
    ps.maxEmitPower = 2.2;
    ps.updateSpeed = 0.012;
    ps.targetStopDuration = 0.4;
    ps.disposeOnStop = false;
    return ps;
  }

  private dustTexture(): Texture {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.5, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new Texture(canvas.toDataURL(), this.scene, false, false);
  }
}
