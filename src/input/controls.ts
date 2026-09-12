import type { Command } from "../sim/simulation";
import { keyMotion } from "./key-motion";

export interface ControlsHost {
  send(cmd: Command): void;
  /** Pointer lock was lost or the page lost focus. */
  interrupted(): void;
  /** Player pressed Esc while unlocked (e.g. lock refused). */
  escape(): void;
  /** The browser refused pointer lock; the game keeps running on keyboard, the UI should say how to capture the mouse. */
  lockRefused(): void;
  lockAcquired(): void;
}

const LOOK_BASE = 0.0022; // rad per pixel at sensitivity 1

/** Translates keyboard and mouse into simulation commands. Holds no game rules. */
export class Controls {
  sensitivity = 1;
  private readonly keys = new Set<string>();
  private active = false;
  private readonly onKeyDown = (e: KeyboardEvent) => this.keyDown(e);
  private readonly onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  // Pointer events, not mouse events: Babylon cancels pointerdown on the canvas, which suppresses the
  // compatibility mousedown/mouseup entirely.
  private readonly onMouseMove = (e: PointerEvent) => this.mouseMove(e);
  private readonly onMouseDown = (e: PointerEvent) => this.mouseDown(e);
  private readonly onMouseUp = (e: PointerEvent) => this.mouseUp(e);
  private readonly onLockChange = () => this.lockChange();
  private readonly onLockError = () => this.host.lockRefused();
  private readonly onBlur = () => this.blur();
  private readonly onVisibility = () => document.hidden && this.blur();

  constructor(private readonly canvas: HTMLCanvasElement, private readonly host: ControlsHost) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("pointermove", this.onMouseMove);
    canvas.addEventListener("pointerdown", this.onMouseDown);
    window.addEventListener("pointerup", this.onMouseUp);
    document.addEventListener("pointerlockchange", this.onLockChange);
    document.addEventListener("pointerlockerror", this.onLockError);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  /** Called when play starts or resumes. Requests pointer lock; the game runs even if the browser refuses it. */
  activate(): void {
    this.active = true;
    this.keys.clear();
    this.canvas.focus();
    this.requestLock();
  }

  /** Safari returns void and reports refusal through `pointerlockerror`; Chrome returns a promise. Both paths end in lockRefused(). */
  private requestLock(): void {
    try {
      const r = this.canvas.requestPointerLock() as unknown;
      if (r instanceof Promise) r.catch(() => this.host.lockRefused());
    } catch {
      this.host.lockRefused();
    }
  }

  deactivate(): void {
    this.active = false;
    this.keys.clear();
    this.host.send({ type: "move", forward: 0, strafe: 0 });
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  /** Once per frame: turn the held keys into a move command, and into a turn when there is no mouse. */
  pump(dt: number): void {
    if (!this.active) return;
    const motion = keyMotion(this.keys, dt);
    this.host.send({ type: "move", forward: motion.forward, strafe: motion.strafe });
    if (motion.yaw !== 0) this.host.send({ type: "look", yaw: motion.yaw, pitch: 0 });
  }


  private keyDown(e: KeyboardEvent): void {
    if (e.code === "Escape") {
      if (this.active) this.host.escape();
      return;
    }
    if (!this.active) return;
    if (e.code === "KeyE") this.host.send({ type: "interact" });
    this.keys.add(e.code);
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  }

  private mouseMove(e: PointerEvent): void {
    if (!this.active || document.pointerLockElement !== this.canvas) return;
    const k = LOOK_BASE * this.sensitivity;
    this.host.send({ type: "look", yaw: e.movementX * k, pitch: -e.movementY * k });
  }

  private mouseDown(e: PointerEvent): void {
    if (!this.active || e.button !== 0) return;
    if (document.pointerLockElement !== this.canvas) this.requestLock(); // "click to capture the mouse"
    this.host.send({ type: "chargeStart" });
  }

  private mouseUp(e: PointerEvent): void {
    if (!this.active || e.button !== 0) return;
    this.host.send({ type: "chargeRelease" });
  }

  private lockChange(): void {
    const locked = document.pointerLockElement === this.canvas;
    if (this.active && !locked && this.hadLock) this.host.interrupted();
    if (locked) this.host.lockAcquired();
    this.hadLock = locked;
  }
  private hadLock = false;

  private blur(): void {
    if (this.active) this.host.interrupted();
  }
}
