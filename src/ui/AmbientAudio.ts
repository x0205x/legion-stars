/**
 * Procedural sci-fi ambient bed using WebAudio.
 * No external audio assets required.
 */
export class AmbientAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private drones: Array<{
    osc: OscillatorNode;
    gain: GainNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
  }> = [];
  private noiseNodes: Array<{ src: AudioBufferSourceNode; gain: GainNode }> = [];
  private running = false;
  private enabled = true;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) this.stop();
  }

  start(): void {
    if (!this.enabled || this.running) return;
    const AC =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = this.ctx ?? new AC();
    this.ctx.resume().catch(() => {});

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.055;
    this.master.connect(this.ctx.destination);

    const notes = [49, 56, 61]; // C#2, G#2, C#3-ish
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      osc.type = i === 0 ? "triangle" : i === 1 ? "sawtooth" : "sine";
      osc.frequency.value = AmbientAudio.midiToFreq(notes[i]);
      gain.gain.value = 0.016 + i * 0.007;

      lfo.type = "sine";
      lfo.frequency.value = 0.06 + i * 0.03;
      lfoGain.gain.value = 0.4 + i * 0.25;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(this.master);

      osc.start();
      lfo.start();
      this.drones.push({ osc, gain, lfo, lfoGain });
    }

    this.createNoiseBed();
    this.running = true;
  }

  stop(): void {
    for (const d of this.drones) {
      d.osc.stop();
      d.lfo.stop();
      d.osc.disconnect();
      d.lfo.disconnect();
      d.gain.disconnect();
      d.lfoGain.disconnect();
    }
    this.drones = [];

    for (const n of this.noiseNodes) {
      n.src.stop();
      n.src.disconnect();
      n.gain.disconnect();
    }
    this.noiseNodes = [];

    this.master?.disconnect();
    this.master = null;
    this.running = false;
  }

  private createNoiseBed(): void {
    if (!this.ctx || !this.master) return;
    const duration = 2;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.012;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();

    this.noiseNodes.push({ src, gain });
  }

  private static midiToFreq(n: number): number {
    return 440 * Math.pow(2, (n - 69) / 12);
  }
}

