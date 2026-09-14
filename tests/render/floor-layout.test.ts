import { describe, expect, it } from "vitest";
import { chapelFloorRegions, containsFloorPoint, floorEdgeDebris, overlapArea } from "../../src/render/floor-layout";

describe("chapel floor layout", () => {
  const regions = chapelFloorRegions();

  it("covers every playable stage of the route", () => {
    const route = [
      [0, 0],
      [0, 10],
      [5, 15.5],
      [15, 17],
      [24, 17],
    ] as const;

    for (const [x, z] of route) expect(containsFloorPoint(regions, x, z)).toBe(true);
  });

  it("does not stack finishes that would flicker or repeat seams", () => {
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        expect(overlapArea(regions[i]!, regions[j]!)).toBe(0);
      }
    }
  });

  it("stops at the architecture instead of drawing an 80 metre plane", () => {
    expect(containsFloorPoint(regions, -20, -20)).toBe(false);
    expect(containsFloorPoint(regions, 30, 30)).toBe(false);
  });

  it("keeps loose masonry on the edges and off the route centreline", () => {
    for (const stone of floorEdgeDebris()) {
      expect(containsFloorPoint(regions, stone.x, stone.z)).toBe(true);
      const onCorridorRoute = stone.z <= 14 && Math.abs(stone.x) < 0.8;
      const onTurnRoute = stone.z >= 14 && stone.z <= 17 && stone.x < 10 && Math.abs(stone.z - 15.5) < 0.65;
      const onRoomRoute = stone.x >= 10 && stone.x <= 20 && Math.abs(stone.z - 17) < 1.1;
      expect(onCorridorRoute || onTurnRoute || onRoomRoute).toBe(false);
    }
  });
});
