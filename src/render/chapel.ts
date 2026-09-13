import type { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector4 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";

import type { Box } from "../sim/geometry";
import { archProfile, groinHeight, ribCurve, type BayProfile } from "./vault";
import { boxFaceUvs } from "./uv";

/**
 * The chapel volume over the room: the upper walls the MVP never had, the piers that carry them, a
 * quadripartite rib vault and the clerestory light that makes the height readable from Bobby's eye.
 *
 * Nothing here collides. The simulation's walls stop at 4 m and stay exactly where they were; this is
 * the stone Bobby sees when he looks up, drawn above the volume he can walk through.
 */

/** Where the web leaves the piers and how far the crown climbs above it. Chosen in composition. */
export const BAY: BayProfile = { springing: 9, rise: 8 };
/** Crown of the vault above the room floor, in metres. This is the height the room is built to. */
export const VAULT_CROWN = BAY.springing + BAY.rise;
/** Top of the walls the simulation collides with — the vault starts from the stone above them. */
const COLLIDER_TOP = 4;
/** Windows sit in the upper wall, out of reach and high enough to throw a shaft across the floor. */
const WINDOW = { sill: 5.4, head: 8.6, width: 1.5 };
const WEB_STEPS = 24;
/** Metres of wall per repeat of the stone texture. Every surface uses it, so the courses match. */
export const TILE = 2.2;

export interface ChapelParts {
  root: TransformNode;
  /** Stone that should take the room's shadows and light like the rest of the masonry. */
  stone: Mesh[];
  /** The light shafts, which breathe with the scene clock instead of standing still. */
  shafts: Mesh[];
}

/**
 * Builds the chapel over `room`. `stoneMaterial` is the same masonry the walls use, so the vault reads
 * as one building; the shafts get their own additive material and are returned for animation.
 */
export function buildChapel(scene: Scene, room: Box, stoneMaterial: Material): ChapelParts {
  const root = new TransformNode("chapel", scene);
  const stone: Mesh[] = [];
  const cx = (room.minX + room.maxX) / 2;
  const cz = (room.minZ + room.maxZ) / 2;
  const halfX = (room.maxX - room.minX) / 2;
  const halfZ = (room.maxZ - room.minZ) / 2;

  const piece = (mesh: Mesh): Mesh => {
    mesh.material = stoneMaterial;
    mesh.parent = root;
    stone.push(mesh);
    return mesh;
  };

  // --- upper walls, pierced by the clerestory -------------------------------
  // Each side is drawn as a sill course, a head course and the piers between the window openings,
  // rather than one slab with holes: the same stone, and no CSG to pay for.
  const T = 1;
  const sides: { axis: "x" | "z"; at: number; span: [number, number] }[] = [
    { axis: "z", at: room.minZ - T / 2, span: [room.minX, room.maxX] },
    { axis: "z", at: room.maxZ + T / 2, span: [room.minX, room.maxX] },
    { axis: "x", at: room.minX - T / 2, span: [room.minZ, room.maxZ] },
    { axis: "x", at: room.maxX + T / 2, span: [room.minZ, room.maxZ] },
  ];

  for (const [i, side] of sides.entries()) {
    const length = side.span[1] - side.span[0];
    const mid = (side.span[0] + side.span[1]) / 2;
    const slab = (name: string, bottom: number, top: number, width: number, along: number): Mesh => {
      const size = side.axis === "z"
        ? { width, height: top - bottom, depth: T }
        : { width: T, height: top - bottom, depth: width };
      const faceUV = boxFaceUvs(size.width, size.height, size.depth, TILE).map((f) => new Vector4(...f));
      const m = MeshBuilder.CreateBox(`${name}${i}`, { ...size, faceUV, wrap: true }, scene);
      m.position = side.axis === "z"
        ? new Vector3(along, (bottom + top) / 2, side.at)
        : new Vector3(side.at, (bottom + top) / 2, along);
      return piece(m);
    };

    slab("upperSill", COLLIDER_TOP, WINDOW.sill, length, mid);
    slab("upperHead", WINDOW.head, BAY.springing, length, mid);
    // three windows a side, with wall between them
    const bays = 3;
    const step = length / bays;
    for (let b = 0; b <= bays; b++) {
      const centre = side.span[0] + step * b;
      const pierWidth = b === 0 || b === bays ? step - WINDOW.width : step - WINDOW.width;
      if (pierWidth <= 0) continue;
      const offset = b === 0 ? pierWidth / 2 : b === bays ? -pierWidth / 2 : 0;
      slab("mullion", WINDOW.sill, WINDOW.head, b === 0 || b === bays ? pierWidth / 1 : pierWidth, centre + offset);
    }
  }

  // --- piers rising from the columns to the springing -----------------------
  const pierSpots: [number, number][] = [
    [room.minX + 0.45, room.minZ + 0.5],
    [room.minX + 0.45, room.maxZ - 0.5],
    [room.maxX - 0.45, room.minZ + 0.5],
    [room.maxX - 0.45, room.maxZ - 0.5],
  ];
  for (const [x, z] of pierSpots) {
    const shaft = MeshBuilder.CreateCylinder("pierShaft", {
      height: BAY.springing - COLLIDER_TOP,
      diameter: 0.7,
      tessellation: 12,
    }, scene);
    shaft.position = new Vector3(x, (COLLIDER_TOP + BAY.springing) / 2, z);
    piece(shaft);
    const capital = MeshBuilder.CreateCylinder("pierCapital", {
      height: 0.45,
      diameterTop: 1.15,
      diameterBottom: 0.8,
      tessellation: 12,
    }, scene);
    capital.position = new Vector3(x, BAY.springing - 0.2, z);
    piece(capital);
  }

  // --- the vault web --------------------------------------------------------
  const web = webMesh(scene, cx, cz, halfX, halfZ);
  piece(web);

  // --- ribs: the diagonals and the transverse arches against each wall ------
  const ribTube = (name: string, from: [number, number], to: [number, number], radius: number): void => {
    const path = ribCurve(from, to, BAY, WEB_STEPS).map(
      ([u, y, v]) => new Vector3(cx + u * halfX, y - 0.06, cz + v * halfZ),
    );
    piece(MeshBuilder.CreateTube(name, { path, radius, tessellation: 8, cap: Mesh.CAP_ALL }, scene));
  };
  ribTube("ribNE", [-1, -1], [1, 1], 0.16);
  ribTube("ribNW", [-1, 1], [1, -1], 0.16);
  ribTube("archS", [-1, -1], [1, -1], 0.2);
  ribTube("archN", [-1, 1], [1, 1], 0.2);
  ribTube("archW", [-1, -1], [-1, 1], 0.2);
  ribTube("archE", [1, -1], [1, 1], 0.2);

  // --- clerestory shafts ----------------------------------------------------
  // Additive cones from the windows. They fall steeply and land near the wall, well clear of the line
  // Bobby walks, and they die out above his head: an additive volume the camera enters whites out the
  // frame. The falloff texture fades them at both ends and at the silhouette, so no hard cone edge.
  const shaftMat = new StandardMaterial("shaftMat", scene);
  shaftMat.emissiveColor = new Color3(0.30, 0.35, 0.46);
  shaftMat.diffuseColor = Color3.Black();
  shaftMat.disableLighting = true;
  shaftMat.opacityTexture = shaftFalloff(scene);
  shaftMat.backFaceCulling = false;
  shaftMat.alphaMode = 1; // additive: the shaft adds light to what is behind it, never occludes it

  const shafts: Mesh[] = [];
  const SHAFT_LENGTH = 7;
  for (const [i, side] of sides.entries()) {
    const length = side.span[1] - side.span[0];
    const along = side.span[0] + length / 2;
    const inward = side.axis === "z"
      ? new Vector3(0, 0, side.at < cz ? 1 : -1)
      : new Vector3(side.at < cx ? 1 : -1, 0, 0);
    const from = side.axis === "z"
      ? new Vector3(along, WINDOW.head - 0.4, side.at)
      : new Vector3(side.at, WINDOW.head - 0.4, along);
    const to = from.add(inward.scale(2.6)).add(new Vector3(0, -5.6, 0));

    const shaft = MeshBuilder.CreateCylinder(`shaft${i}`, {
      height: SHAFT_LENGTH,
      diameterTop: WINDOW.width * 0.7,
      diameterBottom: WINDOW.width * 1.5,
      tessellation: 18,
    }, scene);
    shaft.material = shaftMat;
    shaft.isPickable = false;
    shaft.receiveShadows = false;
    shaft.parent = root;
    const dir = to.subtract(from).normalize();
    shaft.position = from.add(dir.scale(SHAFT_LENGTH / 2));
    shaft.lookAt(to);
    shaft.rotate(new Vector3(1, 0, 0), Math.PI / 2);
    shafts.push(shaft);
  }

  return { root, stone, shafts };
}

/**
 * The web itself, built as a grid over the bay. Babylon's ribbon would give the same surface, but a
 * raw vertex buffer keeps the seam along the groin explicit and lets the UVs follow the bay so the
 * masonry does not stretch towards the crown.
 */
function webMesh(scene: Scene, cx: number, cz: number, halfX: number, halfZ: number): Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const point = (u: number, v: number): [number, number, number] => [
    cx + u * halfX,
    groinHeight(u, v, BAY),
    cz + v * halfZ,
  ];
  const step = (i: number): number => -1 + (2 * i) / WEB_STEPS;

  // UVs measured along the surface, not across the bay. Projecting the bay coordinates straight onto
  // the texture smears the courses into rays as the web turns up towards the crown; walking the real
  // distance keeps a block the same size wherever it sits on the vault.
  const spanU: number[][] = [];
  const spanV: number[][] = [];
  for (let i = 0; i <= WEB_STEPS; i++) {
    const along: number[] = [0];
    for (let j = 1; j <= WEB_STEPS; j++) {
      const a = point(step(i), step(j - 1));
      const b = point(step(i), step(j));
      along.push(along[j - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    spanV.push(along);
  }
  for (let j = 0; j <= WEB_STEPS; j++) {
    const along: number[] = [0];
    for (let i = 1; i <= WEB_STEPS; i++) {
      const a = point(step(i - 1), step(j));
      const b = point(step(i), step(j));
      along.push(along[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    spanU.push(along);
  }

  for (let i = 0; i <= WEB_STEPS; i++) {
    for (let j = 0; j <= WEB_STEPS; j++) {
      positions.push(...point(step(i), step(j)));
      uvs.push(spanU[j]![i]! / TILE, spanV[i]![j]! / TILE);
    }
  }
  const row = WEB_STEPS + 1;
  for (let i = 0; i < WEB_STEPS; i++) {
    for (let j = 0; j < WEB_STEPS; j++) {
      const a = i * row + j;
      indices.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }

  // The web is only ever seen from below, so its normals are taken straight off the surface and
  // pointed into the room. Letting Babylon compute them from the winding got the side wrong and left
  // the vault either invisible or lit as if it were a floor; the slope of the vault is known exactly,
  // so there is no reason to infer it.
  const normals: number[] = [];
  const EPS = 1e-3;
  for (let i = 0; i <= WEB_STEPS; i++) {
    const u = -1 + (2 * i) / WEB_STEPS;
    for (let j = 0; j <= WEB_STEPS; j++) {
      const v = -1 + (2 * j) / WEB_STEPS;
      const dx = (groinHeight(u + EPS, v, BAY) - groinHeight(u - EPS, v, BAY)) / (2 * EPS * halfX);
      const dz = (groinHeight(u, v + EPS, BAY) - groinHeight(u, v - EPS, BAY)) / (2 * EPS * halfZ);
      const len = Math.hypot(dx, 1, dz);
      normals.push(dx / len, -1 / len, dz / len);
    }
  }

  // The grid is already wound so its front faces look down into the room, which is the only side the
  // web is ever seen from. Reversing it here — or letting Babylon derive the normals from it — drops
  // the whole vault to backface culling and leaves the ribs hanging against an empty sky.
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.uvs = uvs;
  data.normals = normals;

  const mesh = new Mesh("vaultWeb", scene);
  data.applyToMesh(mesh);
  return mesh;
}

/**
 * Opacity over a shaft: strongest just under the window, gone before the floor, and fading towards the
 * silhouette so the cone has no visible edge. Without the horizontal fade the beam reads as a solid
 * wedge of ice rather than lit air. Written per pixel — a stop list leaves visible bands.
 */
function shaftFalloff(scene: Scene): DynamicTexture {
  const w = 64;
  const h = 128;
  const tex = new DynamicTexture("shaftFalloff", { width: w, height: h }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const down = Math.min(1, t / 0.18) * (1 - t) ** 1.6;
    for (let x = 0; x < w; x++) {
      // the cylinder wraps U once, so the silhouette edges sit a quarter turn from the lit face
      const across = Math.abs(Math.sin(2 * Math.PI * (x / w))) ** 0.8;
      const v = Math.round(down * across * 255);
      const i = (y * w + x) * 4;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  tex.update(false);
  tex.getAlphaFromRGB = true;
  return tex;
}

export interface ExitParts {
  /** The lit opening itself, and the stone that frames it. */
  glow: Mesh;
  stone: Mesh[];
  /** Dust hanging in the light, so the beam has something in it. */
  motes: ParticleSystem;
}

/**
 * The way out.
 *
 * The MVP drew a flat emissive rectangle, which the spec rejects by name: a blown white pane reads as
 * a hole in the render, not as daylight at the end of a tomb. What sells it is the shape and what is
 * around it — a pointed arch cut in a stone reveal, voussoirs over it, a run of transverse arches
 * receding towards it, and the light falling off within the opening instead of clipping flat.
 */
export function buildExit(scene: Scene, zone: Box, stoneMaterial: Material): ExitParts {
  const stone: Mesh[] = [];
  const cz = (zone.minZ + zone.maxZ) / 2;
  const width = 2.4;
  const springing = 1.9;
  const rise = 1.5;
  const face = zone.maxX - 0.08;

  const piece = (mesh: Mesh): Mesh => {
    mesh.material = stoneMaterial;
    stone.push(mesh);
    return mesh;
  };

  // --- the opening -----------------------------------------------------------
  const segments = 28;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = -1 + (2 * i) / segments;
    const head = springing + rise * archProfile(t);
    positions.push(face, 0, cz + (t * width) / 2, face, head, cz + (t * width) / 2);
    uvs.push((t + 1) / 2, 0, (t + 1) / 2, 1);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const glow = new Mesh("exitGlow", scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.uvs = uvs;
  data.normals = positions.map((_, i) => (i % 3 === 0 ? -1 : 0));
  data.applyToMesh(glow);

  const glowMat = new StandardMaterial("exitMat", scene);
  glowMat.emissiveTexture = exitLightTexture(scene);
  glowMat.diffuseColor = Color3.Black();
  glowMat.disableLighting = true;
  glowMat.backFaceCulling = false;
  glow.material = glowMat;

  // --- the reveal the opening is cut in --------------------------------------
  const jambDepth = 0.5;
  for (const side of [-1, 1]) {
    const jamb = MeshBuilder.CreateBox("exitJamb", { width: jambDepth, height: springing + rise, depth: 0.45 }, scene);
    jamb.position = new Vector3(face - jambDepth / 2, (springing + rise) / 2, cz + side * (width / 2 + 0.2));
    piece(jamb);
  }
  const voussoirs = 9;
  for (let i = 0; i < voussoirs; i++) {
    const t = -1 + (2 * (i + 0.5)) / voussoirs;
    const head = springing + rise * archProfile(t);
    const stoneBlock = MeshBuilder.CreateBox("exitVoussoir", { width: jambDepth, height: 0.42, depth: (width / voussoirs) * 1.35 }, scene);
    stoneBlock.position = new Vector3(face - jambDepth / 2, head + 0.16, cz + (t * width) / 2);
    stoneBlock.rotation.x = -Math.atan2(rise * (archProfile(t + 0.05) - archProfile(t - 0.05)), (0.1 * width) / 2);
    piece(stoneBlock);
  }

  // --- transverse arches receding towards it ---------------------------------
  // Depth is what a lit rectangle has none of: three ribs between Bobby and the light give the eye
  // something to measure the distance against.
  // spread back down the antechamber, not bunched against the arch, where they measure nothing
  const RIBS = 4;
  for (let i = 1; i <= RIBS; i++) {
    const x = zone.minX - 2 + ((zone.maxX - 0.6 - (zone.minX - 2)) * i) / (RIBS + 1);
    const path: Vector3[] = [];
    for (let j = 0; j <= 14; j++) {
      const t = -1 + (2 * j) / 14;
      path.push(new Vector3(x, springing * 0.9 + rise * 1.1 * archProfile(t), cz + (t * (width + 0.5)) / 2));
    }
    piece(MeshBuilder.CreateTube(`exitRib${i}`, { path, radius: 0.13, tessellation: 8, cap: Mesh.CAP_ALL }, scene));
  }

  // --- dust in the beam ------------------------------------------------------
  const motes = new ParticleSystem("exitMotes", 120, scene);
  motes.particleTexture = moteTexture(scene);
  motes.blendMode = ParticleSystem.BLENDMODE_ADD;
  motes.emitter = new Vector3((zone.minX + zone.maxX) / 2, 1.4, cz);
  motes.minEmitBox = new Vector3(-1.6, -1.2, -1.1);
  motes.maxEmitBox = new Vector3(1.6, 1.4, 1.1);
  motes.color1 = new Color4(1, 0.88, 0.6, 0.35);
  motes.color2 = new Color4(1, 0.78, 0.45, 0.2);
  motes.colorDead = new Color4(1, 0.8, 0.5, 0);
  motes.minSize = 0.012;
  motes.maxSize = 0.045;
  motes.minLifeTime = 2.5;
  motes.maxLifeTime = 6;
  motes.emitRate = 22;
  motes.direction1 = new Vector3(-0.05, 0.04, -0.05);
  motes.direction2 = new Vector3(0.05, 0.09, 0.05);
  motes.minEmitPower = 0.02;
  motes.maxEmitPower = 0.08;
  motes.gravity = Vector3.Zero();
  motes.updateSpeed = 0.01;
  motes.start();

  return { glow, stone, motes };
}

/**
 * What is beyond the doorway: warm, brightest a little above the threshold and falling off into the
 * jambs. A flat fill is what makes an exit look like a hole punched in the frame.
 */
function exitLightTexture(scene: Scene): DynamicTexture {
  const size = 256;
  const tex = new DynamicTexture("exitLight", size, scene, true);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = "rgb(26,17,9)";
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size * 0.62, size * 0.04, size / 2, size * 0.62, size * 0.62);
  g.addColorStop(0, "rgb(255,244,214)");
  g.addColorStop(0.28, "rgb(236,190,110)");
  g.addColorStop(0.6, "rgb(150,104,50)");
  g.addColorStop(1, "rgb(38,25,14)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.update(false);
  return tex;
}

/** A soft mote of dust. */
function moteTexture(scene: Scene): DynamicTexture {
  const size = 32;
  const tex = new DynamicTexture("mote", size, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.update(false);
  return tex;
}
