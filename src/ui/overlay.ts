import type { MatchState } from "../sim/match-state";
import type { Snapshot } from "../sim/simulation";

function el<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`missing element #${id}`);
  return e as T;
}

export interface OverlayHandlers {
  onPlay(): void;
  onResume(): void;
  onRestart(): void;
  onSensitivity(v: number): void;
  onCameraShake(v: boolean): void;
}

/** DOM overlays: loading, start, HUD, pause, completion, error. */
export class Overlay {
  private readonly screens = {
    loading: el<HTMLDivElement>("loading"),
    start: el<HTMLDivElement>("start"),
    pause: el<HTMLDivElement>("pause"),
    complete: el<HTMLDivElement>("complete"),
    error: el<HTMLDivElement>("error"),
  };
  private readonly hud = el<HTMLDivElement>("hud");
  private readonly charge = el<HTMLDivElement>("charge");
  private readonly chargeFill = el<HTMLDivElement>("charge-fill");
  private readonly interactHint = el<HTMLDivElement>("interact-hint");
  private readonly alertBanner = el<HTMLDivElement>("alert-banner");
  private readonly lockHint = el<HTMLDivElement>("lock-hint");
  private readonly chargeLabel = el<HTMLSpanElement>("charge-label");
  private readonly objective = el<HTMLDivElement>("objective");
  private readonly loadingBar = el<HTMLDivElement>("loading-bar");
  private readonly loadingText = el<HTMLParagraphElement>("loading-text");
  private alertTimer: number | null = null;

  constructor(handlers: OverlayHandlers) {
    el<HTMLButtonElement>("play").addEventListener("click", () => handlers.onPlay());
    el<HTMLButtonElement>("resume").addEventListener("click", () => handlers.onResume());
    el<HTMLButtonElement>("restart").addEventListener("click", () => handlers.onRestart());
    el<HTMLButtonElement>("restart-from-pause").addEventListener("click", () => handlers.onRestart());
    const sens = el<HTMLInputElement>("sensitivity");
    sens.addEventListener("input", () => handlers.onSensitivity(Number(sens.value)));
    const shake = el<HTMLInputElement>("camera-shake");
    shake.addEventListener("change", () => handlers.onCameraShake(shake.checked));
  }

  setSettings(sensitivity: number, cameraShake: boolean): void {
    el<HTMLInputElement>("sensitivity").value = String(sensitivity);
    el<HTMLInputElement>("camera-shake").checked = cameraShake;
  }

  setLoading(fraction: number, text?: string): void {
    this.loadingBar.style.width = `${Math.round(fraction * 100)}%`;
    if (text) this.loadingText.textContent = text;
  }

  showError(message: string): void {
    el<HTMLParagraphElement>("error-text").textContent = message;
    this.showState("load-error");
  }

  showState(state: MatchState): void {
    document.body.dataset["state"] = state;
    this.screens.loading.hidden = state !== "loading";
    this.screens.start.hidden = state !== "ready";
    this.screens.pause.hidden = state !== "paused";
    this.screens.complete.hidden = state !== "completed";
    this.screens.error.hidden = state !== "load-error";
    this.hud.hidden = state !== "playing";
  }

  update(s: Snapshot): void {
    this.charge.classList.toggle("visible", s.charge.charging);
    this.charge.classList.toggle("ready", s.charge.ready);
    this.chargeFill.style.width = `${Math.round(s.charge.progress * 100)}%`;
    this.chargeLabel.textContent = s.charge.ready ? "Golpe pesado PRONTO — solte" : s.charge.charging ? "Carregando…" : "Segure para carregar";
    this.interactHint.hidden = !s.interactAvailable;
    this.objective.textContent = s.obstacle === "broken" ? "A passagem está livre. Saia da tumba." : s.alertFired ? "Abra a passagem bloqueada com o golpe pesado" : "Encontre a saída da tumba";
  }

  showLockHint(visible: boolean): void {
    this.lockHint.hidden = !visible;
  }

  /** Forget transient UI from a previous run (a pending alert banner timer, the lock hint). */
  reset(): void {
    if (this.alertTimer) window.clearTimeout(this.alertTimer);
    this.alertTimer = null;
    this.alertBanner.hidden = true;
    this.lockHint.hidden = true;
  }

  flashAlert(): void {
    this.alertBanner.hidden = false;
    if (this.alertTimer) window.clearTimeout(this.alertTimer);
    this.alertTimer = window.setTimeout(() => (this.alertBanner.hidden = true), 3500);
  }
}
