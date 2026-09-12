import { describe, expect, it } from "vitest";
import { Simulation } from "../../src/sim/simulation";
import { CENOTAPH_ENTRANCE } from "../../src/sim/level";

const STEP = 1 / 60;

function playing(): Simulation {
  const sim = new Simulation(CENOTAPH_ENTRANCE);
  sim.match.loaded();
  sim.match.start();
  return sim;
}

function run(sim: Simulation, seconds: number, dt = STEP): void {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) sim.step(dt);
}

describe("movement", () => {
  it("spawns at the level spawn point, eyes at child height, facing the corridor", () => {
    const s = playing().snapshot();
    expect(s.player.x).toBeCloseTo(CENOTAPH_ENTRANCE.spawn.x);
    expect(s.player.z).toBeCloseTo(CENOTAPH_ENTRANCE.spawn.z);
    expect(s.player.eyeHeight).toBeCloseTo(1.2);
    expect(s.player.yaw).toBeCloseTo(CENOTAPH_ENTRANCE.spawn.yaw);
  });

  it("walks forward at the configured speed, independent of step size", () => {
    const a = playing();
    a.command({ type: "move", forward: 1, strafe: 0 });
    run(a, 1, 1 / 60);
    const b = playing();
    b.command({ type: "move", forward: 1, strafe: 0 });
    run(b, 1, 1 / 30);
    expect(a.snapshot().player.z - CENOTAPH_ENTRANCE.spawn.z).toBeCloseTo(3.5, 1);
    expect(b.snapshot().player.z).toBeCloseTo(a.snapshot().player.z, 1);
  });

  it("look turns yaw and clamps pitch", () => {
    const sim = playing();
    sim.command({ type: "look", yaw: 0.5, pitch: 0 });
    expect(sim.snapshot().player.yaw).toBeCloseTo(CENOTAPH_ENTRANCE.spawn.yaw + 0.5);
    sim.command({ type: "look", yaw: 0, pitch: 10 });
    expect(sim.snapshot().player.pitch).toBeLessThanOrEqual(Math.PI / 2 - 0.05);
    sim.command({ type: "look", yaw: 0, pitch: -20 });
    expect(sim.snapshot().player.pitch).toBeGreaterThanOrEqual(-Math.PI / 2 + 0.05);
  });

  it("is blocked by walls: walking sideways into the corridor wall stops at the wall", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 0, strafe: 1 });
    run(sim, 5);
    const s = sim.snapshot();
    const halfWidth = CENOTAPH_ENTRANCE.porticoHalfWidth;
    expect(s.player.x).toBeLessThanOrEqual(halfWidth);
    expect(s.player.x).toBeGreaterThan(halfWidth - 1);
  });

  it("slides along a wall instead of sticking", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 1 });
    run(sim, 2);
    const s = sim.snapshot();
    expect(s.player.z).toBeGreaterThan(CENOTAPH_ENTRANCE.spawn.z + 3);
  });

  it("ignores movement and look while not playing", () => {
    const sim = new Simulation(CENOTAPH_ENTRANCE);
    sim.match.loaded();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    sim.command({ type: "look", yaw: 1, pitch: 0 });
    run(sim, 1);
    expect(sim.snapshot().player.z).toBeCloseTo(CENOTAPH_ENTRANCE.spawn.z);
    expect(sim.snapshot().player.yaw).toBeCloseTo(CENOTAPH_ENTRANCE.spawn.yaw);

    sim.match.start();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    sim.command({ type: "pause" });
    run(sim, 1);
    expect(sim.snapshot().match).toBe("paused");
    expect(sim.snapshot().player.z).toBeCloseTo(CENOTAPH_ENTRANCE.spawn.z);
  });

  it("pause discards the pending move so resuming does not keep walking", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    sim.command({ type: "pause" });
    sim.command({ type: "resume" });
    run(sim, 1);
    expect(sim.snapshot().player.z).toBeCloseTo(CENOTAPH_ENTRANCE.spawn.z);
  });

  it("can walk the whole corridor and reach the room without leaving the walkable area", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 4.4); // z ≈ 15.4, middle of the turn
    sim.command({ type: "look", yaw: Math.PI / 2, pitch: 0 });
    run(sim, 6);
    const s = sim.snapshot();
    const room = CENOTAPH_ENTRANCE.room;
    expect(s.player.x).toBeGreaterThan(room.minX);
    expect(s.player.x).toBeLessThan(room.maxX);
    expect(s.player.z).toBeGreaterThan(room.minZ);
    expect(s.player.z).toBeLessThan(room.maxZ);
  });
});

describe("columns", () => {
  it("block bobby like walls: walking diagonally into a corridor column stops short of it", () => {
    const sim = playing();
    const col = CENOTAPH_ENTRANCE.columns[0]!;
    // aim straight at the first column from the spawn
    const yaw = Math.atan2(col.x - CENOTAPH_ENTRANCE.spawn.x, col.z - CENOTAPH_ENTRANCE.spawn.z);
    sim.command({ type: "look", yaw, pitch: 0 });
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 6);
    const p = sim.snapshot().player;
    expect(Math.hypot(p.x - col.x, p.z - col.z)).toBeGreaterThan(0.6);
  });
});
