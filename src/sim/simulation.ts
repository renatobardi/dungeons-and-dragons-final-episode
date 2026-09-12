import { MatchStateMachine, type MatchState } from "./match-state";
import type { LevelDefinition } from "./level";
import { circleOverlapsXZ, containsXZ, dist2D, rayBox, type Box, type Vec3 } from "./geometry";
import { aimPitch, easePitch } from "./auto-aim";
import { Path } from "./path";

/** Seconds of a still view before the aim assist takes over again. */
const AIM_RELEASE = 1.5;
/** Height of the light that marks the way out, matching the scene. */
const EXIT_LIGHT_HEIGHT = 1.7;

export type Command =
  | { type: "move"; forward: number; strafe: number }
  | { type: "look"; yaw: number; pitch: number }
  | { type: "chargeStart" }
  | { type: "chargeRelease" }
  | { type: "interact" }
  | { type: "pause" }
  | { type: "resume" };

export type StrikeHit = "obstacle" | "wall" | "none";

export type SimEvent =
  | { type: "strike"; heavy: boolean; hit: StrikeHit }
  | { type: "obstacleBroken" }
  | { type: "uniAlert" }
  | { type: "completed" };

export type ObstacleState = "intact" | "broken";
export type UniMode = "idle" | "walk" | "alert";

export interface Snapshot {
  match: MatchState;
  player: { x: number; z: number; eyeHeight: number; yaw: number; pitch: number };
  charge: { charging: boolean; progress: number; ready: boolean };
  obstacle: ObstacleState;
  uni: { x: number; z: number; yaw: number; mode: UniMode };
  alertFired: boolean;
  interactAvailable: boolean;
}

export const PLAYER = {
  speed: 3.5, // m/s
  eyeHeight: 1.2, // Bobby is a child; low camera is a product pillar
  radius: 0.35,
  maxPitch: Math.PI / 2 - 0.05,
};

export const CLUB = {
  reach: 2.0, // m, from the eyes along the look direction
  chargeTime: 0.6, // s holding before the heavy strike is ready
};

export const UNI = {
  speed: 4.0, // m/s, slightly faster than Bobby so she catches up
  followTarget: 2.0, // m behind Bobby along her path
  followMax: 2.5,
  radius: 0.3,
  alertDuration: 1.5, // s in the alert pose
};

export class Simulation {
  readonly match = new MatchStateMachine();

  private px: number;
  private pz: number;
  private yaw: number;
  private pitch = 0;
  private sinceManualLook = AIM_RELEASE;
  private moveForward = 0;
  private moveStrafe = 0;

  private charging = false;
  private chargeElapsed = 0;

  private obstacle: ObstacleState = "intact";
  private alertFired = false;

  private readonly uniPath: Path;
  private ux: number;
  private uz: number;
  private uniYaw: number;
  private uniMode: UniMode = "idle";
  private uniAlertRemaining = 0;

  private events: SimEvent[] = [];

  constructor(readonly level: LevelDefinition) {
    this.px = level.spawn.x;
    this.pz = level.spawn.z;
    this.yaw = level.spawn.yaw;
    this.uniPath = new Path(level.uniPath);
    const start = this.uniPath.pointAt(this.uniTargetParam());
    this.ux = start.x;
    this.uz = start.z;
    this.uniYaw = level.spawn.yaw;
  }

  command(cmd: Command): void {
    switch (cmd.type) {
      case "pause":
        this.match.pause();
        this.clearIntent();
        return;
      case "resume":
        this.match.resume();
        return;
    }
    if (this.match.state !== "playing") return;
    switch (cmd.type) {
      case "move":
        this.moveForward = clamp(cmd.forward, -1, 1);
        this.moveStrafe = clamp(cmd.strafe, -1, 1);
        return;
      case "look":
        this.yaw += cmd.yaw;
        if (cmd.pitch !== 0) {
          this.pitch = clamp(this.pitch + cmd.pitch, -PLAYER.maxPitch, PLAYER.maxPitch);
          this.sinceManualLook = 0;
        }
        return;
      case "chargeStart":
        this.charging = true;
        this.chargeElapsed = 0;
        return;
      case "chargeRelease":
        if (!this.charging) return;
        this.strike(this.chargeElapsed >= CLUB.chargeTime);
        this.charging = false;
        this.chargeElapsed = 0;
        return;
      case "interact":
        if (!this.interactAvailable()) return;
        this.match.complete();
        this.clearIntent();
        this.events.push({ type: "completed" });
        return;
    }
  }

  step(dt: number): void {
    if (this.match.state !== "playing") return;
    this.stepMovement(dt);
    if (this.charging) this.chargeElapsed += dt;
    this.stepDiscovery();
    this.stepUni(dt);
    this.stepAim(dt);
  }

  /**
   * With no mouse there is no way to look up or down, so the view follows what Bobby can act on.
   * A player who does look keeps control: the assist stands back until the view has been still.
   */
  private stepAim(dt: number): void {
    this.sinceManualLook += dt;
    if (this.sinceManualLook < AIM_RELEASE) return;
    const eye = { x: this.px, y: PLAYER.eyeHeight, z: this.pz };
    const desired = aimPitch(eye, this.yaw, this.aimTarget());
    this.pitch = clamp(easePitch(this.pitch, desired, dt), -PLAYER.maxPitch, PLAYER.maxPitch);
  }

  /** The rubble while it blocks the way, the exit light once it is open. */
  private aimTarget(): Vec3 | null {
    if (this.obstacle === "intact") {
      const o = this.level.obstacle.collider;
      return { x: (o.minX + o.maxX) / 2, y: (o.minY + o.maxY) / 2, z: (o.minZ + o.maxZ) / 2 };
    }
    const e = this.level.exitZone;
    return { x: (e.minX + e.maxX) / 2, y: EXIT_LIGHT_HEIGHT, z: (e.minZ + e.maxZ) / 2 };
  }

  drainEvents(): SimEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  snapshot(): Snapshot {
    return {
      match: this.match.state,
      player: { x: this.px, z: this.pz, eyeHeight: PLAYER.eyeHeight, yaw: this.yaw, pitch: this.pitch },
      charge: {
        charging: this.charging,
        progress: this.charging ? Math.min(1, this.chargeElapsed / CLUB.chargeTime) : 0,
        ready: this.charging && this.chargeElapsed >= CLUB.chargeTime,
      },
      obstacle: this.obstacle,
      uni: { x: this.ux, z: this.uz, yaw: this.uniYaw, mode: this.uniMode },
      alertFired: this.alertFired,
      interactAvailable: this.interactAvailable(),
    };
  }

  // --- player ---------------------------------------------------------------

  private clearIntent(): void {
    this.moveForward = 0;
    this.moveStrafe = 0;
    this.charging = false;
    this.chargeElapsed = 0;
  }

  private colliders(): Box[] {
    return this.obstacle === "intact" ? [...this.level.walls, this.level.obstacle.collider] : this.level.walls;
  }

  private stepMovement(dt: number): void {
    let dx = Math.sin(this.yaw) * this.moveForward + Math.cos(this.yaw) * this.moveStrafe;
    let dz = Math.cos(this.yaw) * this.moveForward - Math.sin(this.yaw) * this.moveStrafe;
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) return;
    dx = (dx / len) * PLAYER.speed * dt;
    dz = (dz / len) * PLAYER.speed * dt;

    const colliders = this.colliders();
    this.px += dx;
    this.px = resolveAxis(colliders, this.px, this.pz, "x");
    this.pz += dz;
    this.pz = resolveAxis(colliders, this.px, this.pz, "z");
  }

  private interactAvailable(): boolean {
    return (
      this.match.state === "playing" &&
      this.obstacle === "broken" &&
      containsXZ(this.level.exitZone, this.px, this.pz)
    );
  }

  // --- club -----------------------------------------------------------------

  private strike(heavy: boolean): void {
    const origin = { x: this.px, y: PLAYER.eyeHeight, z: this.pz };
    const cp = Math.cos(this.pitch);
    const dir = { x: Math.sin(this.yaw) * cp, y: Math.sin(this.pitch), z: Math.cos(this.yaw) * cp };

    let tWall = Infinity;
    for (const w of this.level.walls) {
      const t = rayBox(origin, dir, w);
      if (t !== null && t < tWall) tWall = t;
    }
    const tObstacle = this.obstacle === "intact" ? rayBox(origin, dir, this.level.obstacle.collider) : null;

    let hit: StrikeHit = "none";
    if (tObstacle !== null && tObstacle <= CLUB.reach && tObstacle <= tWall) hit = "obstacle";
    else if (tWall <= CLUB.reach) hit = "wall";

    this.events.push({ type: "strike", heavy, hit });
    if (hit === "obstacle" && heavy) {
      this.obstacle = "broken";
      this.events.push({ type: "obstacleBroken" });
    }
  }

  // --- discovery / alert ----------------------------------------------------

  private stepDiscovery(): void {
    if (this.alertFired) return;
    if (!containsXZ(this.level.obstacle.discoveryZone, this.px, this.pz)) return;
    this.alertFired = true;
    this.uniAlertRemaining = UNI.alertDuration;
    this.uniMode = "alert";
    const o = this.level.obstacle.collider;
    this.uniYaw = Math.atan2((o.minX + o.maxX) / 2 - this.ux, (o.minZ + o.maxZ) / 2 - this.uz);
    this.events.push({ type: "uniAlert" });
  }

  // --- uni ------------------------------------------------------------------

  /** Furthest path parameter Uni may occupy: holds before the doorway while blocked, never enters the exit zone. */
  private uniCap(): number {
    const o = this.level.obstacle.collider;
    if (this.obstacle === "intact") {
      const face = this.uniPath.project(o.minX, (o.minZ + o.maxZ) / 2);
      return Math.max(0, face - this.level.uniHoldDistanceWhileBlocked);
    }
    const e = this.level.exitZone;
    return Math.max(0, this.uniPath.project((e.minX + e.maxX) / 2, (e.minZ + e.maxZ) / 2) - 1.5);
  }

  private uniTargetParam(): number {
    const sb = this.uniPath.project(this.px, this.pz);
    return clamp(sb - UNI.followTarget, 0, this.uniCap());
  }

  /** Places Uni may never stand: the blocked doorway (while intact) and the exit zone. */
  private uniForbidden(x: number, z: number): boolean {
    const o = this.level.obstacle.collider;
    if (this.obstacle === "intact") {
      const faceZ = (o.minZ + o.maxZ) / 2;
      if (dist2D(x, z, o.minX, faceZ) < this.level.uniHoldDistanceWhileBlocked) return true;
    }
    return containsXZ(this.level.exitZone, x, z);
  }

  /** True when Uni can walk in a straight line from her position to (x, z) without touching a wall or the intact obstacle. */
  private uniLineClear(x: number, z: number): boolean {
    const colliders = this.colliders();
    const len = dist2D(this.ux, this.uz, x, z);
    const samples = Math.max(1, Math.ceil(len / 0.15));
    for (let i = 1; i <= samples; i++) {
      const f = i / samples;
      const sx = this.ux + (x - this.ux) * f;
      const sz = this.uz + (z - this.uz) * f;
      if (colliders.some((c) => circleOverlapsXZ(c, sx, sz, UNI.radius))) return false;
    }
    return true;
  }

  private stepUni(dt: number): void {
    if (this.uniAlertRemaining > 0) {
      this.uniAlertRemaining -= dt;
      if (this.uniAlertRemaining > 0) return;
      this.uniMode = "idle";
    }
    const d = dist2D(this.ux, this.uz, this.px, this.pz);
    if (d <= UNI.followMax && !this.uniForbidden(this.ux, this.uz)) {
      this.uniMode = "idle";
      this.uniYaw = Math.atan2(this.px - this.ux, this.pz - this.uz);
      return;
    }

    // Preferred: walk straight toward a spot `followTarget` short of Bobby, if nothing is in the way.
    let goal: { x: number; z: number } | null = null;
    if (d > 1e-6) {
      const gx = this.px + ((this.ux - this.px) / d) * UNI.followTarget;
      const gz = this.pz + ((this.uz - this.pz) / d) * UNI.followTarget;
      if (!this.uniForbidden(gx, gz) && this.uniLineClear(gx, gz)) goal = { x: gx, z: gz };
    }
    // Otherwise: follow her route (the corridor centre line) toward Bobby's projection, held before the doorway/exit.
    if (!goal) {
      const s = this.uniPath.project(this.ux, this.uz);
      const target = this.uniTargetParam();
      const next = s + clamp(target - s, -UNI.speed * dt, UNI.speed * dt);
      goal = this.uniPath.pointAt(next);
    }

    const gd = dist2D(this.ux, this.uz, goal.x, goal.z);
    if (gd < 0.02) {
      this.uniMode = "idle";
      return;
    }
    const stepLen = Math.min(gd, UNI.speed * dt);
    const dx = ((goal.x - this.ux) / gd) * stepLen;
    const dz = ((goal.z - this.uz) / gd) * stepLen;
    this.ux += dx;
    this.uz += dz;
    this.uniMode = "walk";
    this.uniYaw = Math.atan2(dx, dz);
  }
}

/** Pushes the player circle out of any overlapping box along one axis. */
function resolveAxis(colliders: Box[], x: number, z: number, axis: "x" | "z"): number {
  let pos = axis === "x" ? x : z;
  for (const w of colliders) {
    const cx = axis === "x" ? pos : x;
    const cz = axis === "z" ? pos : z;
    if (!circleOverlapsXZ(w, cx, cz, PLAYER.radius)) continue;
    const lo = axis === "x" ? w.minX : w.minZ;
    const hi = axis === "x" ? w.maxX : w.maxZ;
    const center = (lo + hi) / 2;
    pos = pos < center ? lo - PLAYER.radius : hi + PLAYER.radius;
  }
  return pos;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
