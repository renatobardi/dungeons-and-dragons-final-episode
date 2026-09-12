import { describe, expect, it } from "vitest";
import { MatchStateMachine } from "../../src/sim/match-state";

describe("match state machine", () => {
  it("starts loading and becomes ready when loaded", () => {
    const m = new MatchStateMachine();
    expect(m.state).toBe("loading");
    expect(m.loaded()).toBe(true);
    expect(m.state).toBe("ready");
  });

  it("goes to load-error when loading fails and stays there", () => {
    const m = new MatchStateMachine();
    expect(m.failed()).toBe(true);
    expect(m.state).toBe("load-error");
    expect(m.loaded()).toBe(false);
    expect(m.start()).toBe(false);
    expect(m.state).toBe("load-error");
  });

  it("ready -> playing -> paused -> playing -> completed", () => {
    const m = new MatchStateMachine();
    m.loaded();
    expect(m.start()).toBe(true);
    expect(m.state).toBe("playing");
    expect(m.pause()).toBe(true);
    expect(m.state).toBe("paused");
    expect(m.resume()).toBe(true);
    expect(m.state).toBe("playing");
    expect(m.complete()).toBe(true);
    expect(m.state).toBe("completed");
  });

  it("ignores invalid transitions", () => {
    const m = new MatchStateMachine();
    expect(m.start()).toBe(false);
    expect(m.pause()).toBe(false);
    expect(m.resume()).toBe(false);
    expect(m.complete()).toBe(false);
    expect(m.state).toBe("loading");
    m.loaded();
    expect(m.pause()).toBe(false);
    expect(m.resume()).toBe(false);
    expect(m.complete()).toBe(false);
    expect(m.state).toBe("ready");
    m.start();
    m.complete();
    expect(m.pause()).toBe(false);
    expect(m.start()).toBe(false);
    expect(m.state).toBe("completed");
  });
});
