import type { Scene } from "@babylonjs/core/scene";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Material } from "@babylonjs/core/Materials/material";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { PointLight } from "@babylonjs/core/Lights/pointLight";

/**
 * A wall torch: an iron sconce and a real flame.
 *
 * The MVP drew an emissive sphere, which is what the spec calls a lamp rather than a fire. A flame has
 * no silhouette of its own — it is a column of hot particles that are born wide and bright at the
 * wick, narrow as they rise and die out into smoke — so that is what this builds.
 */

export interface Torch {
  light: PointLight;
  flame: ParticleSystem;
  /** Sconce pieces, for the shadow map and for the room's stone material. */
  iron: Mesh[];
}

export interface TorchOptions {
  /** Whether this torch carries a light, or only a flame. The room cannot afford a light on each. */
  lit: boolean;
}

let flameTexture: DynamicTexture | null = null;

/** A soft round blob. Hard-edged particles read as confetti; the flame needs its edges to dissolve. */
function ember(scene: Scene): DynamicTexture {
  // one texture for every torch in a scene; a restart makes a new scene and so a new texture
  if (flameTexture && flameTexture.getScene() === scene) return flameTexture;
  const size = 64;
  const tex = new DynamicTexture("ember", size, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,235,190,0.75)");
  g.addColorStop(0.7, "rgba(255,160,60,0.25)");
  g.addColorStop(1, "rgba(255,120,30,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.update(false);
  flameTexture = tex;
  return tex;
}

export function buildTorch(scene: Scene, at: Vector3, iron: Material, index: number, options: TorchOptions): Torch {
  const bracket = MeshBuilder.CreateCylinder(`torchArm${index}`, { height: 0.34, diameter: 0.07, tessellation: 8 }, scene);
  bracket.position = new Vector3(at.x, at.y - 0.24, at.z);
  bracket.material = iron;
  const bowl = MeshBuilder.CreateCylinder(`torchBowl${index}`, {
    height: 0.16,
    diameterTop: 0.26,
    diameterBottom: 0.11,
    tessellation: 12,
  }, scene);
  bowl.position = new Vector3(at.x, at.y - 0.04, at.z);
  bowl.material = iron;

  const flame = new ParticleSystem(`flame${index}`, 90, scene);
  flame.particleTexture = ember(scene);
  flame.blendMode = ParticleSystem.BLENDMODE_ADD;
  flame.emitter = new Vector3(at.x, at.y + 0.02, at.z);
  flame.minEmitBox = new Vector3(-0.045, 0, -0.045);
  flame.maxEmitBox = new Vector3(0.045, 0.02, 0.045);
  // white-hot at the wick, orange in the body, gone before it reads as smoke
  flame.color1 = new Color4(1, 0.86, 0.5, 1);
  flame.color2 = new Color4(1, 0.48, 0.12, 0.9);
  flame.colorDead = new Color4(0.5, 0.13, 0.02, 0);
  flame.minSize = 0.11;
  flame.maxSize = 0.25;
  flame.minLifeTime = 0.18;
  flame.maxLifeTime = 0.42;
  flame.emitRate = 120;
  flame.direction1 = new Vector3(-0.12, 1, -0.12);
  flame.direction2 = new Vector3(0.12, 1, 0.12);
  flame.minEmitPower = 0.5;
  flame.maxEmitPower = 1.1;
  flame.gravity = new Vector3(0, 0.7, 0); // hot air rises, so the flame accelerates upward
  flame.minAngularSpeed = -2;
  flame.maxAngularSpeed = 2;
  flame.updateSpeed = 0.014;
  flame.isLocal = false;
  flame.start();

  const light = new PointLight(`torch${index}`, new Vector3(at.x, at.y + 0.12, at.z), scene);
  light.diffuse = new Color3(1, 0.6, 0.28);
  light.intensity = options.lit ? 9 : 0;
  light.range = 13;
  light.setEnabled(options.lit);

  return { light, flame, iron: [bracket, bowl] };
}

/**
 * Flicker. Two beats at different rates read as a fire; one reads as a sine, and a fire that pulses
 * evenly is worse than one that does not move at all.
 */
export function flicker(torch: Torch, elapsed: number, index: number): void {
  if (!torch.light.isEnabled()) return;
  const beat = Math.sin(elapsed * (7 + index * 0.6) + index * 1.7) * 0.9 + Math.sin(elapsed * 13.3 + index) * 0.5;
  torch.light.intensity = 8.4 + beat;
}
