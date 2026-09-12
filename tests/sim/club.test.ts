import { describe, expect, it } from "vitest";
import { CENOTAPH_ENTRANCE } from "../../src/sim/level";
import { CLUB } from "../../src/sim/simulation";
import { playing, run, walkToObstacle, WALL_BETWEEN_LEVEL } from "./helpers";

describe("club and blocked passage", () => {
  it("bobby ends the approach pressed against the intact obstacle", () => {
    const sim = playing();
    walkToObstacle(sim);
    const s = sim.snapshot();
    expect(s.obstacle).toBe("intact");
    expect(s.player.x).toBeGreaterThan(CENOTAPH_ENTRANCE.obstacle.collider.minX - 1);
    expect(s.player.x).toBeLessThan(CENOTAPH_ENTRANCE.obstacle.collider.minX);
  });

  it("a simple strike in range hits the obstacle but does not break it", () => {
    const sim = playing();
    walkToObstacle(sim);
    sim.command({ type: "look", yaw: Math.PI / 2 - sim.snapshot().player.yaw, pitch: 0 });
    sim.command({ type: "chargeStart" });
    sim.command({ type: "chargeRelease" });
    const events = run(sim, 0.1);
    expect(events).toContainEqual({ type: "strike", heavy: false, hit: "obstacle" });
    expect(sim.snapshot().obstacle).toBe("intact");
  });

  it("a strike out of range hits nothing", () => {
    const sim = playing();
    sim.command({ type: "chargeStart" });
    sim.command({ type: "chargeRelease" });
    const events = run(sim, 0.1);
    expect(events).toContainEqual({ type: "strike", heavy: false, hit: "none" });
    expect(sim.snapshot().obstacle).toBe("intact");
  });

  it("charge becomes ready after the charge time and is visible in the snapshot", () => {
    const sim = playing();
    sim.command({ type: "chargeStart" });
    run(sim, CLUB.chargeTime / 2);
    let c = sim.snapshot().charge;
    expect(c.charging).toBe(true);
    expect(c.ready).toBe(false);
    expect(c.progress).toBeGreaterThan(0.3);
    expect(c.progress).toBeLessThan(0.7);
    run(sim, CLUB.chargeTime);
    c = sim.snapshot().charge;
    expect(c.ready).toBe(true);
    expect(c.progress).toBe(1);
  });

  it("a heavy strike in range breaks the obstacle once and removes its collision", () => {
    const sim = playing();
    walkToObstacle(sim);
    sim.command({ type: "look", yaw: Math.PI / 2 - sim.snapshot().player.yaw, pitch: 0 });
    sim.command({ type: "chargeStart" });
    run(sim, CLUB.chargeTime + 0.05);
    sim.command({ type: "chargeRelease" });
    const events = run(sim, 0.1);
    expect(events).toContainEqual({ type: "strike", heavy: true, hit: "obstacle" });
    expect(events.filter((e) => e.type === "obstacleBroken")).toHaveLength(1);
    expect(sim.snapshot().obstacle).toBe("broken");

    // a second heavy strike does not break again
    sim.command({ type: "chargeStart" });
    run(sim, CLUB.chargeTime + 0.05);
    sim.command({ type: "chargeRelease" });
    const again = run(sim, 0.1);
    expect(again.filter((e) => e.type === "obstacleBroken")).toHaveLength(0);

    // Bobby can now walk through the doorway
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 1.5);
    expect(sim.snapshot().player.x).toBeGreaterThan(CENOTAPH_ENTRANCE.obstacle.collider.maxX);
  });

  it("a heavy strike through a wall does not reach the obstacle", () => {
    const sim = playing(WALL_BETWEEN_LEVEL);
    sim.command({ type: "chargeStart" });
    run(sim, CLUB.chargeTime + 0.05);
    sim.command({ type: "chargeRelease" });
    const events = run(sim, 0.1);
    expect(events).toContainEqual({ type: "strike", heavy: true, hit: "wall" });
    expect(sim.snapshot().obstacle).toBe("intact");
  });

  it("pausing cancels a charge in progress", () => {
    const sim = playing();
    sim.command({ type: "chargeStart" });
    run(sim, CLUB.chargeTime / 2);
    sim.command({ type: "pause" });
    expect(sim.snapshot().charge.charging).toBe(false);
    sim.command({ type: "resume" });
    run(sim, CLUB.chargeTime);
    expect(sim.snapshot().charge.charging).toBe(false);
    sim.command({ type: "chargeRelease" });
    const events = run(sim, 0.1);
    expect(events.filter((e) => e.type === "strike")).toHaveLength(0);
  });
});

describe("pause via the state machine first (the way the application does it)", () => {
  it("still cancels the charge and discards the pending move", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    sim.command({ type: "chargeStart" });
    run(sim, CLUB.chargeTime / 2);
    sim.match.pause();
    sim.command({ type: "pause" });
    expect(sim.snapshot().charge.charging).toBe(false);
    const zAtPause = sim.snapshot().player.z;
    sim.command({ type: "resume" });
    run(sim, 1);
    expect(sim.snapshot().player.z).toBeCloseTo(zAtPause);
    sim.command({ type: "chargeRelease" });
    expect(run(sim, 0.1).filter((e) => e.type === "strike")).toHaveLength(0);
  });
});
