/** Debug panel: DPR / TAA / shadows switches and a frame-time overlay with p95. Toggled with F3 or backquote. */
export interface DebugHandlers {
  onDpr(v: number): void;
  onTaa(v: boolean): void;
  onShadows(v: boolean): void;
}

/** Rolling window for avg/p95: ~30 s at 60 fps, so a measurement run is described by its whole duration. */
const FRAME_WINDOW = 1800;

export class DebugPanel {
  private readonly root = document.getElementById("debug") as HTMLDivElement;
  private readonly stats = document.getElementById("debug-stats") as HTMLPreElement;
  private readonly frames: number[] = [];
  private worst = 0;
  private over33 = 0;
  private sinceReport = 0;

  constructor(backend: string, handlers: DebugHandlers) {
    (document.getElementById("debug-backend") as HTMLSpanElement).textContent = backend;
    const dpr = document.getElementById("debug-dpr") as HTMLSelectElement;
    dpr.addEventListener("change", () => handlers.onDpr(Number(dpr.value)));
    const taa = document.getElementById("debug-taa") as HTMLInputElement;
    taa.addEventListener("change", () => handlers.onTaa(taa.checked));
    const sh = document.getElementById("debug-shadows") as HTMLInputElement;
    sh.addEventListener("change", () => handlers.onShadows(sh.checked));
    window.addEventListener("keydown", (e) => {
      if (e.code === "F3" || e.code === "Backquote") {
        e.preventDefault();
        this.root.hidden = !this.root.hidden;
      }
    });
  }

  /** Selects the closest listed DPR (fractional screens such as 1.25 have no exact option). */
  setDpr(v: number): void {
    const select = document.getElementById("debug-dpr") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => Number(o.value));
    const closest = options.reduce((best, o) => (Math.abs(o - v) < Math.abs(best - v) ? o : best), options[0] ?? v);
    select.value = String(closest);
  }

  /** Feed every rendered frame's duration in ms. */
  frame(ms: number, renderWidth: number, renderHeight: number): void {
    this.frames.push(ms);
    if (this.frames.length > FRAME_WINDOW) this.frames.shift();
    if (ms > 33) this.over33++;
    this.worst = Math.max(this.worst, ms);
    this.sinceReport += ms;
    if (this.sinceReport < 250) return;
    this.sinceReport = 0;
    if (this.root.hidden) return;
    const sorted = [...this.frames].sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    this.stats.textContent =
      `render ${renderWidth}×${renderHeight}\n` +
      `frame avg ${avg.toFixed(1)} ms  (${(1000 / avg).toFixed(0)} fps)\n` +
      `p95 ${p95.toFixed(1)} ms   worst ${this.worst.toFixed(1)} ms\n` +
      `frames >33 ms: ${this.over33}`;
  }

  /** Snapshot of the rolling statistics, for automated measurement. */
  report(): { avgMs: number; p95Ms: number; worstMs: number; over33: number; samples: number } {
    const sorted = [...this.frames].sort((a, b) => a - b);
    const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    return { avgMs: avg, p95Ms: p95, worstMs: this.worst, over33: this.over33, samples: sorted.length };
  }

  resetCounters(): void {
    this.frames.length = 0;
    this.worst = 0;
    this.over33 = 0;
  }
}
