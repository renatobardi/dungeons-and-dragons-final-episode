/**
 * Turns a height field into a tangent-space normal map.
 *
 * The painted stone of the MVP had colour and nothing else, so every wall answered light like a flat
 * card. Relief is what separates a photographed block from a printed one, and the cheapest way to get
 * it into the browser is to derive it from the same procedural height the texture is drawn with.
 */

/**
 * Central-difference slopes packed as RGB, ready for a Babylon bump texture.
 *
 * Sampling wraps, because the stone tiles: reading past the edge has to come back on the other side or
 * every repeat shows a lit seam. `strength` scales the slope — 0 gives a flat map, higher values carve
 * deeper without touching the height field itself.
 */
export function heightToNormalRgb(height: ArrayLike<number>, size: number, strength: number): Uint8ClampedArray {
  const rgb = new Uint8ClampedArray(size * size * 4);
  const at = (x: number, y: number): number => height[(((y % size) + size) % size) * size + (((x % size) + size) % size)]!;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      rgb[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      rgb[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      rgb[i + 2] = (1 / len) * 0.5 * 255 + 127.5;
      rgb[i + 3] = 255;
    }
  }
  return rgb;
}
