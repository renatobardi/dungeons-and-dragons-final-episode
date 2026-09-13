import { describe, expect, it } from "vitest";
import { heightToNormalRgb } from "../../src/render/normal-map";

/** Reads one texel of the packed result back as a unit vector in -1..1. */
function texel(rgb: Uint8ClampedArray, size: number, x: number, y: number): [number, number, number] {
  const i = (y * size + x) * 4;
  return [(rgb[i]! / 255) * 2 - 1, (rgb[i + 1]! / 255) * 2 - 1, (rgb[i + 2]! / 255) * 2 - 1];
}

describe("height to normal map", () => {
  const size = 8;

  it("points straight up where the stone is flat", () => {
    const flat = new Float32Array(size * size).fill(0.5);
    const [x, y, z] = texel(heightToNormalRgb(flat, size, 4), size, 4, 4);
    expect(x).toBeCloseTo(0, 2);
    expect(y).toBeCloseTo(0, 2);
    expect(z).toBeCloseTo(1, 2);
  });

  it("tilts away from a ridge, so a raised block catches light on the side it faces", () => {
    const ramp = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) ramp[y * size + x] = x / (size - 1);
    const [nx, ny] = texel(heightToNormalRgb(ramp, size, 4), size, 4, 4);
    expect(nx).toBeLessThan(-0.3);
    expect(ny).toBeCloseTo(0, 2);
  });

  it("gets the same slope on the other axis, with no bias between them", () => {
    const ramp = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) ramp[y * size + x] = y / (size - 1);
    const [nx, ny] = texel(heightToNormalRgb(ramp, size, 4), size, 4, 4);
    expect(nx).toBeCloseTo(0, 2);
    expect(ny).toBeLessThan(-0.3);
  });

  it("stays a unit vector, or the lighting picks up the map's own strength", () => {
    const bumps = new Float32Array(size * size);
    for (let i = 0; i < bumps.length; i++) bumps[i] = (i * 37) % 11 / 10;
    const rgb = heightToNormalRgb(bumps, size, 6);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const [nx, ny, nz] = texel(rgb, size, x, y);
        // a byte per channel is a step of 1/255, and three of them can stack up
        expect(Math.abs(Math.hypot(nx, ny, nz) - 1)).toBeLessThan(0.012);
      }
    }
  });

  it("wraps at the edges, so a tiled wall has no seam running down it", () => {
    const ramp = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) ramp[y * size + x] = x / (size - 1);
    // the tile repeats, so column 0 sees column size-1 on its left: the same drop the seam would hide
    const left = texel(heightToNormalRgb(ramp, size, 4), size, 0, 4);
    expect(left[0]).toBeGreaterThan(0.3);
  });

  it("flattens to no relief when the strength is zero", () => {
    const ramp = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) ramp[y * size + x] = x / (size - 1);
    const [nx, ny, nz] = texel(heightToNormalRgb(ramp, size, 0), size, 4, 4);
    expect(nx).toBeCloseTo(0, 2);
    expect(ny).toBeCloseTo(0, 2);
    expect(nz).toBeCloseTo(1, 2);
  });
});
