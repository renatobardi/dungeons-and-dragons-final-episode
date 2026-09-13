import { beforeEach, describe, expect, it, vi } from "vitest";
import { Controls } from "../../src/input/controls";
import type { Command } from "../../src/sim/simulation";

/** Minimal event target: enough DOM for Controls, which only listens and emits. */
function target() {
  const listeners = new Map<string, ((e: unknown) => void)[]>();
  return {
    addEventListener(type: string, fn: (e: unknown) => void) {
      listeners.set(type, [...(listeners.get(type) ?? []), fn]);
    },
    emit(type: string, event: unknown = {}) {
      for (const fn of listeners.get(type) ?? []) fn(event);
    },
  };
}

describe("controls", () => {
  const commands: Command[] = [];
  let canvas: ReturnType<typeof target> & { focus: () => void; requestPointerLock: () => void };
  let doc: ReturnType<typeof target> & { pointerLockElement: unknown };
  let controls: Controls;

  beforeEach(() => {
    commands.length = 0;
    canvas = Object.assign(target(), { focus: () => {}, requestPointerLock: () => {} });
    doc = Object.assign(target(), { pointerLockElement: null as unknown });
    vi.stubGlobal("window", target());
    vi.stubGlobal("document", doc);
    controls = new Controls(canvas as unknown as HTMLCanvasElement, {
      send: (cmd) => commands.push(cmd),
      interrupted: () => {},
      escape: () => {},
      lockRefused: () => {},
      lockAcquired: () => {},
    });
    controls.activate();
  });

  const lock = () => {
    doc.pointerLockElement = canvas;
    doc.emit("pointerlockchange");
  };

  it("drops the jump the browser reports when it captures the mouse", () => {
    lock();
    // Chrome recentres the cursor on lock and reports the whole distance as one move;
    // obeying it would throw the camera at the ceiling the moment the player clicks.
    doc.emit("pointermove", { movementX: 640, movementY: 400 });
    expect(commands.filter((c) => c.type === "look")).toEqual([]);
  });

  it("still looks with the moves that follow", () => {
    lock();
    doc.emit("pointermove", { movementX: 640, movementY: 400 });
    doc.emit("pointermove", { movementX: 10, movementY: 0 });
    const looks = commands.filter((c) => c.type === "look");
    expect(looks).toHaveLength(1);
    expect(looks[0]).toMatchObject({ yaw: expect.any(Number) });
  });
});
