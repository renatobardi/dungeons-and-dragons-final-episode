import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Simulation, type Command } from "./sim/simulation";
import { CENOTAPH_ENTRANCE } from "./sim/level";
import { SceneView, type QualitySettings } from "./render/scene-view";
import { createEngine } from "./render/engine";
import { Controls } from "./input/controls";
import { Overlay } from "./ui/overlay";
import { Sounds } from "./audio/sounds";
import { DebugPanel } from "./debug/panel";

const FIXED_STEP = 1 / 60;
const MAX_FRAME = 0.25; // s; longer gaps (tab hidden) are dropped instead of simulated

interface Settings {
  sensitivity: number;
  cameraShake: boolean;
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("cdd.settings");
    if (raw) return { sensitivity: 1, cameraShake: true, ...JSON.parse(raw) };
  } catch {
    /* private mode or blocked storage */
  }
  return { sensitivity: 1, cameraShake: true };
}

/** Orchestrates simulation, rendering, input, UI and audio. Restart = new simulation + new scene. */
export class Game {
  private sim = new Simulation(CENOTAPH_ENTRANCE);
  private view: SceneView | null = null;
  private engine: AbstractEngine | null = null;
  private controls: Controls | null = null;
  private debug: DebugPanel | null = null;
  private readonly overlay: Overlay;
  private readonly sounds = new Sounds();
  private settings = loadSettings();
  private quality: QualitySettings = { taa: true, highShadows: true, cameraShake: this.settings.cameraShake };
  private accumulator = 0;
  private lastTime = 0;
  private dpr = Math.min(2, window.devicePixelRatio || 1);
  backend = "none";

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.overlay = new Overlay({
      onPlay: () => this.play(),
      onResume: () => this.resume(),
      onRestart: () => this.restart(),
      onSensitivity: (v) => this.setSettings({ sensitivity: v }),
      onCameraShake: (v) => this.setSettings({ cameraShake: v }),
    });
    this.overlay.setSettings(this.settings.sensitivity, this.settings.cameraShake);
    this.overlay.showState("loading");
  }

  async init(): Promise<void> {
    try {
      this.overlay.setLoading(0.1, "Preparando o motor gráfico…");
      const { engine, backend } = await createEngine(this.canvas);
      this.engine = engine;
      this.backend = backend;
      this.applyDpr();
      this.overlay.setLoading(0.5, "Erguendo o Cenotáfio…");
      this.view = new SceneView(engine, CENOTAPH_ENTRANCE, this.quality);
      await this.view.scene.whenReadyAsync();
      this.controls = new Controls(this.canvas, {
        send: (cmd) => this.send(cmd),
        interrupted: () => this.pause(),
        escape: () => this.pause(),
        lockRefused: () => this.overlay.showLockHint(true),
        lockAcquired: () => this.overlay.showLockHint(false),
      });
      this.controls.sensitivity = this.settings.sensitivity;
      this.debug = new DebugPanel(backend, {
        onDpr: (v) => {
          this.dpr = v;
          this.applyDpr();
        },
        onTaa: (v) => this.view?.setQuality({ taa: v }),
        onShadows: (v) => this.view?.setQuality({ highShadows: v }),
      });
      this.debug.setDpr(this.dpr);
      window.addEventListener("resize", () => engine.resize());
      this.overlay.setLoading(1, "Pronto");
      this.sim.match.loaded();
      this.overlay.showState("ready");
      this.lastTime = performance.now();
      engine.runRenderLoop(() => this.frame());
    } catch (err) {
      console.error(err);
      this.sim.match.failed();
      this.overlay.showError(err instanceof Error ? err.message : String(err));
    }
  }

  // --- flow -----------------------------------------------------------------

  private play(): void {
    if (!this.sim.match.start()) return;
    this.sounds.unlock();
    this.sounds.startAmbient();
    this.overlay.showState("playing");
    void this.controls?.activate();
  }

  private pause(): void {
    if (this.sim.match.state !== "playing") return;
    this.send({ type: "pause" }); // the simulation pauses its state machine and drops move/charge intent
    this.controls?.deactivate();
    this.sounds.suspend();
    this.overlay.showState("paused");
  }

  private resume(): void {
    if (this.sim.match.state !== "paused") return;
    this.send({ type: "resume" });
    this.sounds.resume();
    this.overlay.showState("playing");
    void this.controls?.activate();
  }

  restart(): void {
    if (!this.engine) return;
    this.controls?.deactivate();
    this.sounds.stopAll();
    this.overlay.reset();
    this.view?.dispose();
    this.sim = new Simulation(CENOTAPH_ENTRANCE);
    this.view = new SceneView(this.engine, CENOTAPH_ENTRANCE, this.quality);
    this.accumulator = 0;
    this.sim.match.loaded();
    this.overlay.showState("ready");
  }

  private send(cmd: Command): void {
    this.sim.command(cmd);
  }

  private setSettings(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch };
    if (this.controls) this.controls.sensitivity = this.settings.sensitivity;
    this.quality.cameraShake = this.settings.cameraShake;
    this.view?.setQuality({ cameraShake: this.settings.cameraShake });
    try {
      localStorage.setItem("cdd.settings", JSON.stringify(this.settings));
    } catch {
      /* ignore */
    }
  }

  private applyDpr(): void {
    if (!this.engine) return;
    this.engine.setHardwareScalingLevel(1 / this.dpr);
    this.engine.resize();
  }

  // --- loop -----------------------------------------------------------------

  private frame(): void {
    if (!this.view || !this.engine) return;
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;

    this.controls?.pump();
    this.accumulator += dt;
    while (this.accumulator >= FIXED_STEP) {
      this.sim.step(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }
    for (const ev of this.sim.drainEvents()) this.handleEvent(ev);

    const s = this.sim.snapshot();
    // animations (hands, torches) only advance while playing; paused/ready/completed show a still frame
    this.view.update(s, s.match === "playing" ? dt : 0);
    this.overlay.update(s);
    this.view.scene.render();
    this.debug?.frame(dt * 1000, this.engine.getRenderWidth(), this.engine.getRenderHeight());
  }

  private handleEvent(ev: ReturnType<Simulation["drainEvents"]>[number]): void {
    this.view?.applyEvent(ev);
    switch (ev.type) {
      case "strike":
        this.sounds.strike(ev.heavy, ev.hit !== "none");
        break;
      case "obstacleBroken":
        this.sounds.crumble();
        break;
      case "uniAlert":
        this.sounds.bleat();
        this.overlay.flashAlert();
        break;
      case "completed":
        this.sounds.chime();
        this.controls?.deactivate();
        this.overlay.showState("completed");
        break;
    }
  }

  // --- debug / test hooks ---------------------------------------------------

  /** Exposed on window for measurements and browser tests. Not used by gameplay. */
  get hooks() {
    return {
      state: () => this.sim.match.state,
      snapshot: () => this.sim.snapshot(),
      command: (cmd: Command) => this.send(cmd),
      /** Advance the simulation synchronously (browser tests drive the walk without waiting real time). */
      fastForward: (seconds: number) => {
        const steps = Math.round(seconds / FIXED_STEP);
        for (let i = 0; i < steps; i++) this.sim.step(FIXED_STEP);
        for (const ev of this.sim.drainEvents()) this.handleEvent(ev);
      },
      backend: () => this.backend,
      report: () => this.debug?.report(),
      resetCounters: () => this.debug?.resetCounters(),
      renderSize: () => (this.engine ? [this.engine.getRenderWidth(), this.engine.getRenderHeight()] : [0, 0]),
      setDpr: (v: number) => {
        this.dpr = v;
        this.applyDpr();
        this.debug?.setDpr(v);
      },
      setQuality: (q: Partial<QualitySettings>) => this.view?.setQuality(q),
      restart: () => this.restart(),
      /** Counts Uni nodes across every live scene, so a leaked scene from a previous run is detected. */
      uniCount: () => this.engine?.scenes.reduce((n, sc) => n + sc.getTransformNodesById("uni").length, 0) ?? 0,
      sceneCount: () => this.engine?.scenes.length ?? 0,
    };
  }
}
