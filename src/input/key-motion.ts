/** Radians per second the body turns with the side arrows — Doom's turn, for playing without a mouse. */
export const TURN_RATE = 2.4;

export interface KeyMotion {
  /** 1 forward, -1 back. */
  forward: number;
  /** 1 right, -1 left. */
  strafe: number;
  /** Angle to add to the view this frame, in radians. */
  yaw: number;
}

const axis = (keys: ReadonlySet<string>, positive: string[], negative: string[]): number =>
  (positive.some((c) => keys.has(c)) ? 1 : 0) - (negative.some((c) => keys.has(c)) ? 1 : 0);

export function keyMotion(keys: ReadonlySet<string>, dt: number): KeyMotion {
  const alt = keys.has("AltLeft") || keys.has("AltRight");
  const sideArrows = axis(keys, ["ArrowRight"], ["ArrowLeft"]);
  return {
    forward: axis(keys, ["KeyW", "ArrowUp"], ["KeyS", "ArrowDown"]),
    strafe: Math.sign(axis(keys, ["KeyD"], ["KeyA"]) + (alt ? sideArrows : 0)),
    yaw: alt ? 0 : sideArrows * TURN_RATE * dt,
  };
}
