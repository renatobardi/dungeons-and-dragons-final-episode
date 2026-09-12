import { describe, expect, it } from "vitest";
import { Simulation, CLUB } from "../../src/sim/simulation";
import { CENOTAPH_ENTRANCE } from "../../src/sim/level";
import { playing, run, walkToObstacle, WALL_BETWEEN_LEVEL } from "./helpers";

function breakAndWalkToExit(sim: Simulation): void {
  walkToObstacle(sim);
  sim.command({ type: "look", yaw: Math.PI / 2 - sim.snapshot().player.yaw, pitch: 0 });
  sim.command({ type: "chargeStart" });
  run(sim, CLUB.chargeTime + 0.05);
  sim.command({ type: "chargeRelease" });
  run(sim, 0.1);
  sim.command({ type: "move", forward: 1, strafe: 0 });
  run(sim, 2.5); // into the exit antechamber, pressed against the far wall
  sim.command({ type: "move", forward: 0, strafe: 0 });
}

describe("exit and restart", () => {
  it("interacting outside the exit zone does nothing", () => {
    const sim = playing();
    expect(sim.snapshot().interactAvailable).toBe(false);
    sim.command({ type: "interact" });
    run(sim, 0.1);
    expect(sim.snapshot().match).toBe("playing");
  });

  it("interacting inside the exit zone with the obstacle intact does nothing", () => {
    const sim = playing(WALL_BETWEEN_LEVEL);
    sim.command({ type: "look", yaw: -Math.PI * 0.75, pitch: 0 });
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 1);
    sim.command({ type: "move", forward: 0, strafe: 0 });
    const s = sim.snapshot();
    expect(s.player.x).toBeLessThan(-1);
    expect(s.player.z).toBeLessThan(-1);
    expect(s.interactAvailable).toBe(false);
    sim.command({ type: "interact" });
    run(sim, 0.1);
    expect(sim.snapshot().match).toBe("playing");
  });

  it("interacting inside the exit zone after breaking the obstacle completes the match", () => {
    const sim = playing();
    breakAndWalkToExit(sim);
    const s = sim.snapshot();
    expect(s.player.x).toBeGreaterThan(CENOTAPH_ENTRANCE.exitZone.minX);
    expect(s.interactAvailable).toBe(true);
    sim.command({ type: "interact" });
    const events = run(sim, 0.1);
    expect(sim.snapshot().match).toBe("completed");
    expect(events).toContainEqual({ type: "completed" });
    // nothing moves after completion
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 1);
    expect(sim.snapshot().player.x).toBeCloseTo(s.player.x);
  });

  it("a fresh simulation restores the initial state after a full run", () => {
    const baseline = new Simulation(CENOTAPH_ENTRANCE).snapshot();
    const sim = playing();
    breakAndWalkToExit(sim);
    sim.command({ type: "interact" });
    run(sim, 0.1);
    const restarted = new Simulation(CENOTAPH_ENTRANCE);
    expect(restarted.snapshot()).toEqual(baseline);
    expect(restarted.drainEvents()).toEqual([]);
    expect(restarted.snapshot().obstacle).toBe("intact");
    expect(restarted.snapshot().alertFired).toBe(false);
    expect(restarted.snapshot().charge.charging).toBe(false);
  });
});
