/**
 * Texture coordinates measured in metres instead of in faces.
 *
 * A box maps 0..1 over every face, so one wall material tiled N times puts N courses of stone on a
 * ten-metre wall and the same N on a one-metre pier. The room reads as a collage. Scaling the UVs by
 * the face's own size instead gives every surface the same texel density, which is what makes the
 * masonry look like one quarry.
 */

/** Babylon's face order for a box, named. */
export const FACE = { front: 0, back: 1, right: 2, left: 3, top: 4, bottom: 5 } as const;

/** `[u1, v1, u2, v2]` per face, in Babylon's `faceUV` order. */
export type FaceUv = [number, number, number, number];

export function boxFaceUvs(width: number, height: number, depth: number, tile: number): FaceUv[] {
  if (!(tile > 0)) throw new Error(`tile size must be positive, got ${tile}`);
  const rect = (across: number, up: number): FaceUv => [0, 0, across / tile, up / tile];
  const faces: FaceUv[] = [];
  faces[FACE.front] = rect(width, height);
  faces[FACE.back] = rect(width, height);
  faces[FACE.right] = rect(depth, height);
  faces[FACE.left] = rect(depth, height);
  faces[FACE.top] = rect(width, depth);
  faces[FACE.bottom] = rect(width, depth);
  return faces;
}
