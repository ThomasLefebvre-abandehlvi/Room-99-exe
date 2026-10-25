class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('room99-sound-enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('room99-sound-enabled', String(this.enabled));
    if (this.enabled) {
      this.initCtx();
      this.playClick();
    }
    return this.enabled;
  }

  public playSwing() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playVaultHit(power: number = 1) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = Math.max(90, 240 - Math.min(power, 72) * 2);

    // 1. Metal clang
    const clang = this.ctx.createOscillator();
    const clangGain = this.ctx.createGain();
    clang.type = 'triangle';
    clang.frequency.setValueAtTime(baseFreq * 3.2, now);
    clang.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.22);

    clangGain.gain.setValueAtTime(0.28, now);
    clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    clang.connect(clangGain);
    clangGain.connect(this.ctx.destination);
    clang.start(now);
    clang.stop(now + 0.22);

    // 2. Heavy impact thud
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(baseFreq * 1.6, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    thudGain.gain.setValueAtTime(0.35, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    thud.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thud.start(now);
    thud.stop(now + 0.28);

    // 3. Subtle noise rattle for metallic resonance
    const bufferSize = this.ctx.sampleRate * 0.1;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1400;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  public playVaultBreach() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Sub rumble
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(110, now);
    rumble.frequency.exponentialRampToValueAtTime(25, now + 0.9);

    rumbleGain.gain.setValueAtTime(0.32, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.linearRampToValueAtTime(80, now + 0.9);

    rumble.connect(filter);
    filter.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);
    rumble.start(now);
    rumble.stop(now + 0.9);

    // Harmonic victory bell chords
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.1 + idx * 0.08);

      gain.gain.setValueAtTime(0, now + 0.1 + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.14 + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + 0.1 + idx * 0.08);
      osc.stop(now + 1.2);
    });
  }

  public playCoin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playChest() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major
    chords.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.18, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.5 + i * 0.06);
    });
  }

  public playJump() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playLand() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playFootstep(sprinting: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(sprinting ? 120 : 90, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

    gain.gain.setValueAtTime(sprinting ? 0.08 : 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playCrateRoll() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500 + Math.random() * 300, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playCrateJackpot() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.08);

      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + 0.5 + i * 0.08);
    });
  }

  public playLaptopBoot() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + 0.6);
    });
  }

  public playShutdown() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 554.37, 440, 329.63]; // Descending Windows chords
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.13, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.55);
    });
  }

  public playWindowAction() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playAlarm() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [0, 0.15, 0.3, 0.45].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1046.5, now + offset); // High C
      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  public playKeypadBeep(freq: number = 750) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playUnlockSuccess() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  public playAccessDenied() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playBossRoar() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Sub bass sweep + distortion feel
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(75, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 1.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(120, now);
    osc2.frequency.exponentialRampToValueAtTime(45, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 1.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  }

  public playBossHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playBossAttack() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}

export const sound = new SoundEngine();
