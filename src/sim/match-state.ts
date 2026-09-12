export type MatchState = "loading" | "ready" | "playing" | "paused" | "completed" | "load-error";

const TRANSITIONS: Record<string, [MatchState, MatchState]> = {
  loaded: ["loading", "ready"],
  failed: ["loading", "load-error"],
  start: ["ready", "playing"],
  pause: ["playing", "paused"],
  resume: ["paused", "playing"],
  complete: ["playing", "completed"],
};

export class MatchStateMachine {
  state: MatchState = "loading";

  private transition(name: keyof typeof TRANSITIONS): boolean {
    const [from, to] = TRANSITIONS[name]!;
    if (this.state !== from) return false;
    this.state = to;
    return true;
  }

  loaded(): boolean {
    return this.transition("loaded");
  }
  failed(): boolean {
    return this.transition("failed");
  }
  start(): boolean {
    return this.transition("start");
  }
  pause(): boolean {
    return this.transition("pause");
  }
  resume(): boolean {
    return this.transition("resume");
  }
  complete(): boolean {
    return this.transition("complete");
  }
}
