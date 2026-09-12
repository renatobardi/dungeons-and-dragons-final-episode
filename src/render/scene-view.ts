import { Scene } from "@babylonjs/core/scene";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
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
import { paintedTexture, RUBBLE, STONE_FLOOR, STONE_WALL } from "./textures";
import { UniView } from "./uni-view";
import { fitScale } from "./fit";

/** Cenotaph kit: the column made in ticket 07 and the painted stone that goes with it. */
const COLUMN_MODEL_URL = "models/cenotaph/column.glb";
const COLUMN_TEXTURE_URL = "models/cenotaph/column-base-color.jpg";
/** The volume the level already reserves for a column, so the colliders stay where they are. */
const COLUMN_SIZE = { x: 0.8, y: 4, z: 0.8 };
import { HandsView } from "./hands-view";

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
  private readonly torches: PointLight[] = [];
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
    scene.fogDensity = 0.028;
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
    sun.position = new Vector3(6, 12, 4);
    const hemi = new HemisphericLight("sky", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.35;
    hemi.diffuse = new Color3(0.5, 0.48, 0.6);
    hemi.groundColor = new Color3(0.12, 0.08, 0.1);

    this.shadow = new ShadowGenerator(quality.highShadows ? 2048 : 1024, sun);
    this.shadow.usePercentageCloserFiltering = true;
    this.shadow.filteringQuality = quality.highShadows ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_LOW;
    this.shadow.bias = 0.0015;
    this.shadow.normalBias = 0.02;

    const wallMat = this.stone("wall", STONE_WALL, 2.5);
    const floorMat = this.stone("floor", STONE_FLOOR, 4);
    const rubbleMat = this.stone("rubble", RUBBLE, 1.2);

    const floor = MeshBuilder.CreateGround("floor", { width: 80, height: 80, subdivisions: 2 }, scene);
    floor.position = new Vector3(10, 0, 10);
    floor.material = floorMat;
    floor.receiveShadows = true;
    const ceiling = MeshBuilder.CreateGround("ceiling", { width: 80, height: 80 }, scene);
    ceiling.position = new Vector3(10, 4, 10);
    ceiling.rotation.x = Math.PI;
    ceiling.material = wallMat;

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
    glow.intensity = 0.6;
    const flameMat = new StandardMaterial("flame", scene);
    flameMat.emissiveColor = new Color3(1, 0.55, 0.15);
    flameMat.disableLighting = true;
    for (const [x, y, z] of torchSpots) {
      const light = new PointLight(`torch${this.torches.length}`, new Vector3(x, y, z), scene);
      light.diffuse = new Color3(1, 0.62, 0.3);
      light.intensity = 9;
      light.range = 12;
      this.torches.push(light);
      const flame = MeshBuilder.CreateSphere(`flame${this.torches.length}`, { diameter: 0.22, segments: 6 }, scene);
      flame.position = new Vector3(x, y, z);
      flame.material = flameMat;
      const holder = MeshBuilder.CreateCylinder(`holder${this.torches.length}`, { height: 0.5, diameter: 0.08 }, scene);
      holder.position = new Vector3(x, y - 0.3, z);
      holder.material = rubbleMat;
    }

    // obstacle: intact pile vs broken rubble
    this.obstacleIntact = this.buildIntactObstacle(level.obstacle.collider, rubbleMat);
    this.obstacleBroken = this.buildBrokenObstacle(level.obstacle.collider, rubbleMat);
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
    this.ready = Promise.all([this.uni.loaded, this.loadColumns()]).then(() => undefined);

    // WebGPU allows 12 uniform buffers per shader stage. With Uni's model in the scene the room cannot
    // afford a light per torch, so only the nearest three torches cast light; the flames still glow.
    for (const torch of this.torches.slice(3)) torch.dispose();

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

    this.torches.forEach((t, i) => {
      t.intensity = 8 + Math.sin(this.elapsed * (7 + i) + i * 1.7) * 0.9 + Math.sin(this.elapsed * 13 + i) * 0.5;
    });
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

  private stone(name: string, spec: typeof STONE_WALL, tiles: number): PBRMaterial {
    const mat = new PBRMaterial(name, this.scene);
    const tex = paintedTexture(this.scene, `${name}Tex`, 1024, spec);
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    tex.uScale = tiles;
    tex.vScale = tiles;
    mat.albedoTexture = tex;
    mat.metallic = 0;
    mat.roughness = 0.92;
    mat.ambientColor = new Color3(0.4, 0.38, 0.45);
    return mat;
  }


  private boxMesh(name: string, b: Box): Mesh {
    const m = MeshBuilder.CreateBox(name, { width: b.maxX - b.minX, height: b.maxY - b.minY, depth: b.maxZ - b.minZ }, this.scene);
    m.position = new Vector3((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2);
    return m;
  }

  /**
   * Columns come from the Cenotaph kit (ticket 07). The collider each one gets in the level definition
   * is the volume the model is stretched into, so the simulation keeps the boxes it always had.
   * Same recipe as Uni: the mesh is loaded bare and painted here, or the glTF material carries every
   * scene light into the vertex stage and WebGPU rejects the frame.
   */
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

  private buildIntactObstacle(b: Box, mat: PBRMaterial): TransformNode {
    const root = new TransformNode("obstacleIntact", this.scene);
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const pieces: [number, number, number, number, number, number, number][] = [
      // dx, dy, dz, w, h, d, rotY
      [0, 0.8, 0, 1.4, 1.6, 2.9, 0],
      [-0.2, 2.0, -0.6, 1.2, 1.0, 1.3, 0.3],
      [0.1, 2.0, 0.7, 1.1, 1.0, 1.2, -0.25],
      [0, 2.75, 0, 0.9, 0.7, 1.4, 0.15],
      [-0.55, 0.35, 1.2, 0.7, 0.7, 0.7, 0.5],
    ];
    pieces.forEach(([dx, dy, dz, w, h, d, ry], i) => {
      const m = MeshBuilder.CreateBox(`rockI${i}`, { width: w, height: h, depth: d }, this.scene);
      m.position = new Vector3(cx + dx, dy, cz + dz);
      m.rotation.y = ry;
      m.material = mat;
      m.parent = root;
      this.shadow.addShadowCaster(m);
    });
    return root;
  }

  private buildBrokenObstacle(b: Box, mat: PBRMaterial): TransformNode {
    const root = new TransformNode("obstacleBroken", this.scene);
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const pieces: [number, number, number, number][] = [
      [-0.9, 1.25, 0.45, 0.8], [1.1, -1.15, 0.5, 0.4], [0.3, 1.35, 0.35, 0.2], [-1.2, -0.9, 0.3, 1.1],
      [1.3, 1.0, 0.4, 0.6], [0.0, -1.3, 0.25, 0.9], [-0.4, 0.2, 0.28, 0.1], [0.9, 0.3, 0.22, 0.7],
    ];
    pieces.forEach(([dx, dz, size, ry], i) => {
      const m = MeshBuilder.CreateBox(`rockB${i}`, { width: size, height: size * 0.7, depth: size * 0.9 }, this.scene);
      m.position = new Vector3(cx + dx, size * 0.3, cz + dz);
      m.rotation.set(ry * 0.3, ry, ry * 0.2);
      m.material = mat;
      m.parent = root;
      this.shadow.addShadowCaster(m);
    });
    return root;
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
