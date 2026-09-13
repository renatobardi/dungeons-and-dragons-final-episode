import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { Scene } from "@babylonjs/core/scene";
import { heightToNormalRgb } from "./normal-map";

/**
 * Hand-painted looking textures generated at runtime with a canvas: layered brush dabs over a base tone.
 * Deterministic (seeded) so screenshots are comparable between runs.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PaintSpec {
  base: [number, number, number];
  dabs: [number, number, number][];
  dabCount: number;
  dabSize: [number, number];
  cracks?: number;
  blocks?: { w: number; h: number; gap: number; shade: number } | undefined;
  seed: number;
}

export function paintedTexture(scene: Scene, name: string, size: number, spec: PaintSpec): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, true);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  const rnd = mulberry32(spec.seed);
  const [r, g, b] = spec.base;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < spec.dabCount; i++) {
    const c = spec.dabs[Math.floor(rnd() * spec.dabs.length)]!;
    const w = spec.dabSize[0] + rnd() * (spec.dabSize[1] - spec.dabSize[0]);
    const h = w * (0.35 + rnd() * 0.5);
    ctx.save();
    ctx.translate(rnd() * size, rnd() * size);
    ctx.rotate(rnd() * Math.PI);
    ctx.globalAlpha = 0.12 + rnd() * 0.25;
    ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (spec.blocks) {
    const { w, h, gap, shade } = spec.blocks;
    ctx.globalAlpha = 1;
    let row = 0;
    for (let y = 0; y < size; y += h) {
      const offset = row % 2 === 0 ? 0 : w / 2;
      for (let x = -w; x < size + w; x += w) {
        ctx.fillStyle = `rgba(0,0,0,${shade})`;
        ctx.fillRect(x + offset, y, w, gap);
        ctx.fillRect(x + offset, y, gap, h);
        ctx.fillStyle = `rgba(255,255,255,${shade * 0.35})`;
        ctx.fillRect(x + offset + gap, y + gap, w - gap, 1);
      }
      row++;
    }
  }

  if (spec.cracks) {
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < spec.cracks; i++) {
      let x = rnd() * size;
      let y = rnd() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 6 + Math.floor(rnd() * 10);
      for (let s = 0; s < segs; s++) {
        x += (rnd() - 0.5) * 30;
        y += (rnd() - 0.5) * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  tex.update(false);
  return tex;
}

export const STONE_WALL: PaintSpec = {
  base: [96, 88, 82],
  dabs: [[120, 108, 96], [70, 64, 66], [134, 118, 98], [88, 84, 92], [110, 96, 80]],
  dabCount: 1400,
  dabSize: [18, 70],
  cracks: 14,
  blocks: { w: 192, h: 96, gap: 4, shade: 0.32 },
  seed: 11,
};

export const STONE_FLOOR: PaintSpec = {
  base: [78, 72, 70],
  dabs: [[96, 88, 82], [58, 54, 60], [104, 92, 76], [70, 70, 78]],
  dabCount: 1600,
  dabSize: [14, 60],
  cracks: 22,
  blocks: { w: 128, h: 128, gap: 3, shade: 0.3 },
  seed: 23,
};

export const RUBBLE: PaintSpec = {
  base: [122, 108, 96],
  dabs: [[150, 132, 112], [90, 80, 74], [168, 148, 120]],
  dabCount: 900,
  dabSize: [10, 40],
  cracks: 30,
  seed: 37,
};

/**
 * The same stone, drawn as a height field instead of a colour: mortar courses sink, each block sits at
 * its own level, dabs become the pitting of the face and cracks cut grooves. Values are 0..1.
 */
function heightField(size: number, spec: PaintSpec): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  const rnd = mulberry32(spec.seed ^ 0x5eed);

  ctx.fillStyle = "rgb(150,150,150)";
  ctx.fillRect(0, 0, size, size);

  if (spec.blocks) courseHeights(ctx, size, spec.blocks, rnd);
  pitHeights(ctx, size, spec, rnd);
  ctx.globalAlpha = 1;
  if (spec.cracks) crackGrooves(ctx, size, spec.cracks, rnd);

  const data = ctx.getImageData(0, 0, size, size).data;
  const field = new Float32Array(size * size);
  for (let i = 0; i < field.length; i++) field[i] = data[i * 4]! / 255;
  return field;
}

/** Each block laid a little proud or a little sunk, the way a real course never is flush. */
function courseHeights(
  ctx: CanvasRenderingContext2D,
  size: number,
  blocks: NonNullable<PaintSpec["blocks"]>,
  rnd: () => number,
): void {
  const { w, h, gap } = blocks;
  let row = 0;
  for (let y = 0; y < size; y += h) {
    const offset = row % 2 === 0 ? 0 : w / 2;
    for (let x = -w; x < size + w; x += w) {
      const level = 150 + (rnd() - 0.4) * 70;
      ctx.fillStyle = `rgb(${level},${level},${level})`;
      ctx.fillRect(x + offset + gap, y + gap, w - gap * 2, h - gap * 2);
    }
    row++;
  }
  // the mortar itself is the recess between them, left at the dark base
}

/** Pitting and erosion over the faces. */
function pitHeights(ctx: CanvasRenderingContext2D, size: number, spec: PaintSpec, rnd: () => number): void {
  for (let i = 0; i < spec.dabCount; i++) {
    const w = spec.dabSize[0] + rnd() * (spec.dabSize[1] - spec.dabSize[0]);
    const shade = rnd() < 0.5 ? 0 : 255;
    ctx.save();
    ctx.translate(rnd() * size, rnd() * size);
    ctx.rotate(rnd() * Math.PI);
    ctx.globalAlpha = 0.05 + rnd() * 0.12;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, (w * (0.35 + rnd() * 0.5)) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Cracks, cut as grooves rather than drawn as lines. */
function crackGrooves(ctx: CanvasRenderingContext2D, size: number, count: number, rnd: () => number): void {
  ctx.strokeStyle = "rgb(40,40,40)";
  for (let i = 0; i < count; i++) {
    let x = rnd() * size;
    let y = rnd() * size;
    ctx.lineWidth = 1 + rnd() * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 6 + Math.floor(rnd() * 10);
    for (let s = 0; s < segs; s++) {
      x += (rnd() - 0.5) * 30;
      y += (rnd() - 0.5) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export interface StoneSurface {
  albedo: DynamicTexture;
  normal: DynamicTexture;
  /** Metallic-roughness packing: green is roughness, blue is metallic, red is unused. */
  roughness: DynamicTexture;
}

/**
 * Albedo, relief and roughness for one stone, all derived from the same procedural pass so the three
 * maps agree: what sinks in the normal map is what darkens in the colour and what stays damp underfoot.
 * `relief` is how hard the bump is carved; the floor takes less than a wall so the tiling stays calm.
 */
export function stoneSurface(scene: Scene, name: string, size: number, spec: PaintSpec, relief = 14): StoneSurface {
  const albedo = paintedTexture(scene, `${name}Albedo`, size, spec);
  const field = heightField(size, spec);

  const normal = new DynamicTexture(`${name}Normal`, size, scene, false);
  const nCtx = normal.getContext() as CanvasRenderingContext2D;
  const nImage = nCtx.createImageData(size, size);
  nImage.data.set(heightToNormalRgb(field, size, relief));
  nCtx.putImageData(nImage, 0, 0);
  normal.update(false);

  // deep stone holds water and dirt and answers light softly; the proud faces are worn smoother
  const roughness = new DynamicTexture(`${name}Rough`, size, scene, false);
  const rCtx = roughness.getContext() as CanvasRenderingContext2D;
  const rImage = rCtx.createImageData(size, size);
  for (let i = 0; i < field.length; i++) {
    rImage.data[i * 4 + 1] = (0.98 - field[i]! * 0.28) * 255;
    rImage.data[i * 4 + 3] = 255;
  }
  rCtx.putImageData(rImage, 0, 0);
  roughness.update(false);

  return { albedo, normal, roughness };
}
