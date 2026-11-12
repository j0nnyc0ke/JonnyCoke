// Web Audio API Synthesizer for Design Invaders
// Eliminates external audio dependencies and provides low-latency feedback

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    try {
      const storedMute = localStorage.getItem('designInvaders_muted');
      if (storedMute !== null) {
        this.isMuted = storedMute === 'true';
      }
    } catch {
      this.isMuted = false;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public resumeContext() {
    this.initContext();
  }

  public unmute() {
    this.isMuted = false;
    try {
      localStorage.setItem('designInvaders_muted', 'false');
    } catch {}
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('designInvaders_muted', String(this.isMuted));
    } catch {}
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playShoot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  public playHit(isStreak: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = isStreak ? 784 : 523.25;
      [baseFreq, baseFreq * 1.5].forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.7, now + 0.14);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
      });
    } catch {}
  }

  public playUnlock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Ascending major arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.3, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    } catch {}
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 261.63];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      });
    } catch {}
  }

  public playWaveStart() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  public playPrecisionSurge() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.35);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  public playHarmonicFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const frequencies = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      frequencies.forEach((f, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {}
  }

  public playPowerup() {
    this.playPrecisionSurge();
  }

  public playExplosion() {
    this.playHit(false);
  }

  public playLevelUp() {
    this.playHarmonicFanfare();
  }

  // Eerie Saw-inspired sound generators for recruiter trials
  public playSawTapeHiss() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Low sinister horror tape drone & sub-bass rumble
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const subGain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.9);
      osc.connect(gain);
      gain.connect(this.masterGain);

      sub.type = 'sine';
      sub.frequency.setValueAtTime(42, now);
      sub.frequency.exponentialRampToValueAtTime(32, now + 1.0);
      subGain.gain.setValueAtTime(0.08, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      sub.connect(subGain);
      subGain.connect(this.masterGain);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.9);
      sub.stop(now + 1.0);
    } catch {}
  }

  public playSawVoiceBlip() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3.0, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  public playSawClank() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy metallic guillotine clank
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(900, now);
      osc2.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    } catch {}
  }

  public playSawBuzz() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.18);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playSawTensionHum() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(82.4, now); // E2 low note
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch {}
  }

  public playSawVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Chilling yet triumphant minor to major chord
      const freqs = [196, 246.94, 293.66, 392, 493.88];
      freqs.forEach((f, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.7);
      });
    } catch {}
  }

  public playPongBeep(high: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(high ? 680 : 440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playThrust() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.linearRampToValueAtTime(75, now + 0.06);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  // --- Augmented Reality (AR) Audio Synthesizer Suite ---

  public playHoloActivate() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Shimmering ascending crystalline hologram chime
      [440, 659.25, 880, 1318.5, 1760].forEach((f, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.045;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.05, t + 0.2);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch {}
  }

  public playArScan() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(960, now + 0.18);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(4, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playMarkerLocked() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // High-precision double ping for AR target acquisition
      [1046.5, 1567.98].forEach((f, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.12);
      });
    } catch {}
  }

  public playLayerExplode(isExploding: boolean = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      if (isExploding) {
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.22);
      } else {
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
      }
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
