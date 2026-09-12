import { box, type Box } from "./geometry";

/**
 * Cenotaph entrance. Units: meters, Y up, Bobby starts facing +Z.
 *
 *   portico (start)  -> corridor along +Z -> turn right (+X) -> room -> blocked doorway (+X) -> exit
 */
export interface LevelDefinition {
  spawn: { x: number; z: number; yaw: number };
  porticoHalfWidth: number;
  walls: Box[];
  /** Decorative columns; each also gets a square collider so Bobby and Uni cannot walk through them. */
  columns: { x: number; z: number }[];
  room: Box;
  obstacle: { collider: Box; discoveryZone: Box };
  exitZone: Box;
  /** Centerline Uni follows. Uni holds before `holdIndexWhileBlocked` until the obstacle breaks. */
  uniPath: { x: number; z: number }[];
  uniHoldDistanceWhileBlocked: number;
}

const WALL_T = 1; // wall thickness
const H = 4; // wall height

const corridorHalf = 1.5;
const COLUMN_HALF = 0.4;

const COLUMNS: { x: number; z: number }[] = [
  { x: 10.45, z: 12.5 }, { x: 10.45, z: 21.5 }, { x: 19.55, z: 12.5 }, { x: 19.55, z: 21.5 },
  { x: 12.5, z: 12.45 }, { x: 17.5, z: 12.45 }, { x: 12.5, z: 21.55 }, { x: 17.5, z: 21.55 },
  { x: -1.05, z: 6 }, { x: 1.05, z: 6 }, { x: -1.05, z: 10 }, { x: 1.05, z: 10 },
];

export const CENOTAPH_ENTRANCE: LevelDefinition = {
  spawn: { x: 0, z: 0, yaw: 0 },
  porticoHalfWidth: 3,
  room: box(10, 12, 20, 22),
  columns: COLUMNS,
  walls: [
    ...COLUMNS.map((c) => box(c.x - COLUMN_HALF, c.z - COLUMN_HALF, c.x + COLUMN_HALF, c.z + COLUMN_HALF, 0, H)),
    // portico: x -3..3, z -2..4
    box(-3 - WALL_T, -2 - WALL_T, 3 + WALL_T, -2, 0, H), // back wall
    box(-3 - WALL_T, -2, -3, 4 + WALL_T, 0, H), // left wall
    box(3, -2, 3 + WALL_T, 4, 0, H), // right wall
    // corridor along +Z: x -1.5..1.5, z 4..17 ; portico front wall pieces beside the opening
    box(-3, 4, -corridorHalf, 4 + WALL_T, 0, H),
    box(corridorHalf, 4, 3, 4 + WALL_T, 0, H),
    box(-corridorHalf - WALL_T, 4, -corridorHalf, 17 + WALL_T, 0, H), // corridor left wall (runs to the end of the turn)
    box(corridorHalf, 4 + WALL_T, corridorHalf + WALL_T, 14, 0, H), // corridor right wall until the turn opens
    // turn: corridor continues along +X: z 14..17, x -1.5..10
    box(-corridorHalf, 17, 10, 17 + WALL_T, 0, H), // turn far wall (north)
    box(corridorHalf, 14 - WALL_T, 10, 14, 0, H), // turn near wall (south)
    // room: x 10..20, z 12..22 ; opening from the turn at x=10, z 14..17
    box(10 - WALL_T, 22, 20 + WALL_T, 22 + WALL_T, 0, H), // room north wall
    box(10 - WALL_T, 12 - WALL_T, 20 + WALL_T, 12, 0, H), // room south wall
    box(10 - WALL_T, 17, 10, 22, 0, H), // room west wall, north of the opening
    box(10 - WALL_T, 12, 10, 14, 0, H), // room west wall, south of the opening
    box(20, 12, 20 + WALL_T, 15.5, 0, H), // room east wall, south of the doorway
    box(20, 18.5, 20 + WALL_T, 22, 0, H), // room east wall, north of the doorway
    // exit antechamber: x 21..25, z 15.5..18.5
    box(20 + WALL_T, 18.5, 25 + WALL_T, 18.5 + WALL_T, 0, H),
    box(20 + WALL_T, 15.5 - WALL_T, 25 + WALL_T, 15.5, 0, H),
    box(25, 15.5, 25 + WALL_T, 18.5, 0, H),
  ],
  obstacle: {
    collider: box(19.6, 15.5, 21.2, 18.5, 0, 3.2),
    discoveryZone: box(13, 12, 20, 22),
  },
  exitZone: box(23, 15.5, 25, 18.5),
  uniPath: [
    { x: 0.3, z: 0 },
    { x: 0.3, z: 15.5 },
    { x: 15, z: 15.5 },
    { x: 18, z: 17 },
    { x: 24, z: 17 },
  ],
  uniHoldDistanceWhileBlocked: 2.5,
};
