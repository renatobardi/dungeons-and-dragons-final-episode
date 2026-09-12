import { describe, expect, it } from "vitest";
import { playing, run, walkToObstacle } from "./helpers";

describe("aim assist in play", () => {
  it("raises the view toward the rubble once Bobby stands in front of it", () => {
    const sim = playing();
    walkToObstacle(sim);
    run(sim, 2);
    expect(sim.snapshot().player.pitch).toBeGreaterThan(0.1);
  });

  it("keeps the view level while Bobby is still in the corridor, far from anything", () => {
    const sim = playing();
    run(sim, 2);
    expect(sim.snapshot().player.pitch).toBeCloseTo(0, 3);
  });

  it("stands back while the player is looking, and takes over once the view is still", () => {
    const sim = playing();
    walkToObstacle(sim);
    run(sim, 2);
    const assisted = sim.snapshot().player.pitch;

    sim.command({ type: "look", yaw: 0, pitch: -0.6 });
    run(sim, 1);
    const manual = sim.snapshot().player.pitch;
    expect(manual).toBeLessThan(assisted - 0.4); // the assist did not fight the player

    run(sim, 3);
    expect(sim.snapshot().player.pitch).toBeCloseTo(assisted, 2);
  });

  it("does not move the view while the match is paused", () => {
    const sim = playing();
    walkToObstacle(sim);
    run(sim, 2);
    sim.command({ type: "look", yaw: 0, pitch: -0.6 });
    sim.command({ type: "pause" });
    const paused = sim.snapshot().player.pitch;
    run(sim, 3);
    expect(sim.snapshot().player.pitch).toBe(paused);
  });
});
