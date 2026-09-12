import { Simulation, type SimEvent } from "../../src/sim/simulation";
import { CENOTAPH_ENTRANCE, type LevelDefinition } from "../../src/sim/level";
import { box } from "../../src/sim/geometry";

export const STEP = 1 / 60;

export function playing(level: LevelDefinition = CENOTAPH_ENTRANCE): Simulation {
  const sim = new Simulation(level);
  sim.match.loaded();
  sim.match.start();
  return sim;
}

export function run(sim: Simulation, seconds: number, dt = STEP): SimEvent[] {
  const events: SimEvent[] = [];
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) {
    sim.step(dt);
    events.push(...sim.drainEvents());
  }
  return events;
}

/** Drives Bobby from the spawn through the corridor and the turn into the room, ending in front of the blocked doorway. */
export function walkToObstacle(sim: Simulation): SimEvent[] {
  const events: SimEvent[] = [];
  sim.command({ type: "move", forward: 1, strafe: 0 });
  events.push(...run(sim, 4.4));
  sim.command({ type: "look", yaw: Math.PI / 2, pitch: 0 });
  events.push(...run(sim, 1.5)); // x ≈ 5
  sim.command({ type: "look", yaw: -0.15, pitch: 0 }); // drift toward the doorway line (z ≈ 17)
  events.push(...run(sim, 3));
  sim.command({ type: "look", yaw: 0.15, pitch: 0 });
  events.push(...run(sim, 3)); // pushed against the obstacle
  sim.command({ type: "move", forward: 0, strafe: 0 });
  return events;
}

/** Tiny level: spawn facing +Z, a thin wall at z 0.8..1.0, the obstacle right behind it, exit zone beside the spawn. */
export const WALL_BETWEEN_LEVEL: LevelDefinition = {
  spawn: { x: 0, z: 0, yaw: 0 },
  porticoHalfWidth: 3,
  room: box(-3, -3, 3, 5),
  columns: [],
  walls: [box(-3, 0.8, 3, 1.0, 0, 4)],
  obstacle: { collider: box(-1, 1.5, 1, 2.5, 0, 3), discoveryZone: box(-3, 3, 3, 5) },
  exitZone: box(-3, -3, -1, -1),
  uniPath: [
    { x: 1, z: 0 },
    { x: 1, z: 4 },
  ],
  uniHoldDistanceWhileBlocked: 1,
};
