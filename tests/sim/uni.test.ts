import { describe, expect, it } from "vitest";
import { CENOTAPH_ENTRANCE } from "../../src/sim/level";
import { circleOverlapsXZ, dist2D } from "../../src/sim/geometry";
import { CLUB, UNI } from "../../src/sim/simulation";
import { playing, run, walkToObstacle } from "./helpers";

function uniDistance(sim: ReturnType<typeof playing>): number {
  const s = sim.snapshot();
  return dist2D(s.player.x, s.player.z, s.uni.x, s.uni.z);
}

function uniInsideWall(sim: ReturnType<typeof playing>): boolean {
  const u = sim.snapshot().uni;
  return CENOTAPH_ENTRANCE.walls.some((w) => circleOverlapsXZ(w, u.x, u.z, UNI.radius));
}

describe("uni follows and alerts", () => {
  it("starts close to bobby, idle", () => {
    const sim = playing();
    expect(uniDistance(sim)).toBeLessThanOrEqual(UNI.followMax);
    expect(sim.snapshot().uni.mode).toBe("idle");
  });

  it("follows bobby through the corridor and the turn without crossing walls", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    for (let i = 0; i < 44; i++) {
      run(sim, 0.1);
      expect(uniInsideWall(sim)).toBe(false);
    }
    sim.command({ type: "look", yaw: Math.PI / 2, pitch: 0 });
    for (let i = 0; i < 40; i++) {
      run(sim, 0.1);
      expect(uniInsideWall(sim)).toBe(false);
    }
    sim.command({ type: "move", forward: 0, strafe: 0 });
    run(sim, 3);
    expect(uniDistance(sim)).toBeLessThanOrEqual(2.5);
    expect(sim.snapshot().uni.mode).toBe("idle");
  });

  it("walks while catching up and idles when close", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 2);
    expect(sim.snapshot().uni.mode).toBe("walk");
    sim.command({ type: "move", forward: 0, strafe: 0 });
    run(sim, 3);
    expect(sim.snapshot().uni.mode).toBe("idle");
  });

  it("comes back when bobby returns to the portico", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 4);
    sim.command({ type: "look", yaw: Math.PI, pitch: 0 });
    run(sim, 4);
    sim.command({ type: "move", forward: 0, strafe: 0 });
    run(sim, 3);
    expect(uniDistance(sim)).toBeLessThanOrEqual(2.5);
    expect(sim.snapshot().player.z).toBeLessThan(2);
  });

  it("never stands in the blocked doorway while the obstacle is intact", () => {
    const sim = playing();
    walkToObstacle(sim);
    run(sim, 5);
    const u = sim.snapshot().uni;
    const o = CENOTAPH_ENTRANCE.obstacle.collider;
    // holds well clear of the doorway (hold distance is measured along her route, so allow a small straight-line slack)
    expect(u.x).toBeLessThan(o.minX - 1);
    expect(dist2D(u.x, u.z, o.minX, (o.minZ + o.maxZ) / 2)).toBeGreaterThan(
      CENOTAPH_ENTRANCE.uniHoldDistanceWhileBlocked - 0.3,
    );
  });

  it("alerts exactly once when bobby discovers the blocked passage, then returns to following", () => {
    const sim = playing();
    const events = walkToObstacle(sim);
    const alerts = events.filter((e) => e.type === "uniAlert");
    expect(alerts).toHaveLength(1);
    expect(sim.snapshot().alertFired).toBe(true);

    // leaving and re-entering the discovery zone does not alert again
    sim.command({ type: "look", yaw: Math.PI, pitch: 0 });
    sim.command({ type: "move", forward: 1, strafe: 0 });
    const back = run(sim, 3);
    sim.command({ type: "look", yaw: Math.PI, pitch: 0 });
    const again = run(sim, 3);
    expect([...back, ...again].filter((e) => e.type === "uniAlert")).toHaveLength(0);
  });

  it("shows the alert pose for a while after alerting", () => {
    const sim = playing();
    walkToObstacle(sim);
    // the alert fired somewhere during the approach; force a fresh observation with a rerun near the zone edge
    const fresh = playing();
    fresh.command({ type: "move", forward: 1, strafe: 0 });
    run(fresh, 4.4);
    fresh.command({ type: "look", yaw: Math.PI / 2, pitch: 0 });
    let alerted = false;
    for (let i = 0; i < 60 && !alerted; i++) {
      alerted = run(fresh, 0.1).some((e) => e.type === "uniAlert");
    }
    expect(alerted).toBe(true);
    expect(fresh.snapshot().uni.mode).toBe("alert");
    run(fresh, UNI.alertDuration + 0.2);
    expect(fresh.snapshot().uni.mode).not.toBe("alert");
  });

  it("passes through the doorway once the obstacle is broken", () => {
    const sim = playing();
    walkToObstacle(sim);
    sim.command({ type: "look", yaw: Math.PI / 2 - sim.snapshot().player.yaw, pitch: 0 });
    sim.command({ type: "chargeStart" });
    run(sim, CLUB.chargeTime + 0.05);
    sim.command({ type: "chargeRelease" });
    run(sim, 0.1);
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 1.6);
    sim.command({ type: "move", forward: 0, strafe: 0 });
    run(sim, 4);
    expect(sim.snapshot().uni.x).toBeGreaterThan(CENOTAPH_ENTRANCE.obstacle.collider.minX);
    expect(uniDistance(sim)).toBeLessThanOrEqual(2.5);
  });
});

describe("uni keeps her distance off the centre line", () => {
  it("comes within 2.5 m when bobby stands in a room corner away from her route", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 4.4);
    sim.command({ type: "look", yaw: Math.PI / 2, pitch: 0 });
    run(sim, 4.1); // x ≈ 14.35, inside the room, between the columns
    sim.command({ type: "look", yaw: -Math.PI / 2, pitch: 0 }); // face +Z
    run(sim, 2); // toward the north wall, z ≈ 21.65, 6 m off Uni's route
    sim.command({ type: "move", forward: 0, strafe: 0 });
    run(sim, 4);
    expect(uniDistance(sim)).toBeLessThanOrEqual(2.5);
    expect(uniInsideWall(sim)).toBe(false);
  });

  it("walks around the corridor wall instead of through it when bobby is on the other side", () => {
    const sim = playing();
    sim.command({ type: "move", forward: 1, strafe: 0 });
    run(sim, 4.4);
    sim.command({ type: "look", yaw: Math.PI / 2, pitch: 0 });
    run(sim, 1);
    sim.command({ type: "move", forward: 0, strafe: 0 });
    // Uni is still in the corridor; the corner wall sits between her and Bobby
    for (let i = 0; i < 40; i++) {
      run(sim, 0.1);
      expect(uniInsideWall(sim)).toBe(false);
    }
    expect(uniDistance(sim)).toBeLessThanOrEqual(2.5);
  });
});
