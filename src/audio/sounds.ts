/**
 * Procedural sounds synthesized with WebAudio. No files, no licensing questions, deterministic.
 * Ticket 10 may replace individual cues with recorded assets; the interface stays the same.
 */
export class Sounds {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: { stop(): void } | null = null;

  /** Must be called from a user gesture (the "Jogar" click) so the browser allows audio. */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  startAmbient(): void {
    if (!this.ctx || !this.master || this.ambient) return;
    const ctx = this.ctx;
    const out = this.master;
    // low tomb rumble + slow breathing filter, plus a faint torch crackle from filtered noise
    const rumble = ctx.createOscillator();
    rumble.type = "sine";
    rumble.frequency.value = 46;
    const rumble2 = ctx.createOscillator();
    rumble2.type = "triangle";
    rumble2.frequency.value = 69;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.08;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(rumbleGain.gain);
    rumble.connect(rumbleGain);
    rumble2.connect(rumbleGain);
    rumbleGain.connect(out);

    const noise = this.noiseSource(ctx, 4);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 0.7;
    const crackle = ctx.createGain();
    crackle.gain.value = 0.012;
    noise.connect(bp).connect(crackle).connect(out);

    rumble.start();
    rumble2.start();
    lfo.start();
    noise.start();
    this.ambient = {
      stop: () => {
        rumble.stop();
        rumble2.stop();
        lfo.stop();
        noise.stop();
      },
    };
  }

  stopAll(): void {
    this.ambient?.stop();
    this.ambient = null;
  }

  strike(heavy: boolean, hit: boolean): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    // whoosh
    const noise = this.noiseSource(ctx, 0.4);
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(600, t);
    f.frequency.exponentialRampToValueAtTime(heavy ? 180 : 320, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(heavy ? 0.35 : 0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    noise.connect(f).connect(g).connect(this.master);
    noise.start(t);
    noise.stop(t + 0.35);
    if (hit) {
      // thud
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(heavy ? 110 : 160, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, t + 0.08);
      og.gain.exponentialRampToValueAtTime(heavy ? 0.9 : 0.5, t + 0.1);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(og).connect(this.master);
      osc.start(t + 0.08);
      osc.stop(t + 0.5);
    }
  }

  crumble(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const noise = this.noiseSource(ctx, 1.6);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 1.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.8, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    noise.connect(lp).connect(g).connect(this.master);
    noise.start(t);
    noise.stop(t + 1.6);
    for (let i = 0; i < 7; i++) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      const at = t + 0.05 + i * 0.09 + Math.random() * 0.05;
      osc.frequency.setValueAtTime(220 + Math.random() * 260, at);
      osc.frequency.exponentialRampToValueAtTime(60, at + 0.2);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, at);
      og.gain.exponentialRampToValueAtTime(0.25, at + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
      osc.connect(og).connect(this.master);
      osc.start(at);
      osc.stop(at + 0.3);
    }
  }

  /** Uni's bleat: two short pitched notes with vibrato. */
  bleat(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (const [start, len, base] of [[0, 0.22, 640], [0.3, 0.32, 720]] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(base, t + start);
      osc.frequency.linearRampToValueAtTime(base * 1.25, t + start + len * 0.5);
      osc.frequency.linearRampToValueAtTime(base * 0.9, t + start + len);
      const vib = ctx.createOscillator();
      vib.frequency.value = 22;
      const vibGain = ctx.createGain();
      vibGain.gain.value = 30;
      vib.connect(vibGain).connect(osc.frequency);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + start);
      g.gain.exponentialRampToValueAtTime(0.22, t + start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + len);
      osc.connect(lp).connect(g).connect(this.master);
      osc.start(t + start);
      vib.start(t + start);
      osc.stop(t + start + len + 0.05);
      vib.stop(t + start + len + 0.05);
    }
  }

  /** Warm confirmation chime. */
  chime(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const at = t + i * 0.12;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.2);
      osc.connect(g).connect(this.master!);
      osc.start(at);
      osc.stop(at + 1.3);
    });
  }

  private noiseSource(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = seconds >= 2;
    return src;
  }
}
