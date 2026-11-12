// Jigsaw Horror Voice Audio Engine
// Provides zero-latency, cross-browser, mobile-unlocked playback of remastered Tobin Bell audio files
// Eliminates autoplay blocks, silent buffer traps, and Web Audio routing bugs

export class JigsawVoiceEngine {
  private ctx: AudioContext | null = null;
  private buffers: Map<number, AudioBuffer> = new Map();
  private loadPromises: Map<number, Promise<AudioBuffer | null>> = new Map();
  private activeSource: AudioBufferSourceNode | null = null;
  private activeGain: GainNode | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private isUnlocked: boolean = false;
  private currentVolume: number = 0.95;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initContext();
      // Pre-warm audio buffers
      this.preloadAllLines();
    }
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch (err) {
          console.warn('AudioContext initialization note:', err);
        }
      }
    }
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.initContext();
  }

  // Pre-load all 7 remastered Jigsaw voice lines
  public preloadAllLines() {
    for (let i = 0; i < 7; i++) {
      this.loadLineBuffer(i).catch(() => {});
    }
  }

  private async loadLineBuffer(lineIdx: number): Promise<AudioBuffer | null> {
    if (this.buffers.has(lineIdx)) {
      return this.buffers.get(lineIdx)!;
    }
    if (this.loadPromises.has(lineIdx)) {
      return this.loadPromises.get(lineIdx)!;
    }

    const promise = (async () => {
      const ctx = this.initContext();
      if (!ctx) return null;

      // Prefer WAV for instant uncompressed PCM decode, fallback to MP3
      const wavUrl = `/audio/jigsaw/line_${lineIdx}.wav`;
      const mp3Url = `/audio/jigsaw/line_${lineIdx}.mp3`;

      try {
        let resp = await fetch(wavUrl);
        if (!resp.ok) {
          resp = await fetch(mp3Url);
        }
        if (!resp.ok) {
          this.loadPromises.delete(lineIdx);
          return null;
        }

        const arrayBuf = await resp.arrayBuffer();

        // Cross-browser decode supporting both promise and legacy callback
        const audioBuf = await new Promise<AudioBuffer>((resolve, reject) => {
          try {
            const decodePromise = ctx.decodeAudioData(
              arrayBuf.slice(0),
              (buf) => resolve(buf),
              (err) => reject(err)
            );
            if (decodePromise && typeof decodePromise.then === 'function') {
              decodePromise.then(resolve).catch(reject);
            }
          } catch (e) {
            reject(e);
          }
        });

        this.buffers.set(lineIdx, audioBuf);
        return audioBuf;
      } catch (err) {
        console.warn(`Web Audio preload note for line_${lineIdx}:`, err);
        this.loadPromises.delete(lineIdx);
        return null;
      }
    })();

    this.loadPromises.set(lineIdx, promise);
    return promise;
  }

  // Guaranteed mobile & desktop unlock via user gesture (click / touch / key)
  public async unlock(): Promise<boolean> {
    const ctx = this.initContext();
    if (!ctx) return false;

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Play a 1-sample silent sound to permanently unrestrict iOS Safari audio
      const silentBuf = ctx.createBuffer(1, 1, 22050);
      const silentSrc = ctx.createBufferSource();
      silentSrc.buffer = silentBuf;
      silentSrc.connect(ctx.destination);
      silentSrc.start(0);
      this.isUnlocked = true;
      return true;
    } catch (err) {
      console.warn('Web Audio unlock note:', err);
      return false;
    }
  }

  public isReady(): boolean {
    return this.isUnlocked && this.ctx?.state === 'running';
  }

  public stop() {
    if (this.activeSource) {
      try {
        this.activeSource.onended = null;
        this.activeSource.stop(0);
        this.activeSource.disconnect();
      } catch {}
      this.activeSource = null;
    }
    if (this.activeGain) {
      try {
        this.activeGain.disconnect();
      } catch {}
      this.activeGain = null;
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.currentTime = 0;
      } catch {}
      this.activeHtmlAudio = null;
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1.0, volume));
    if (this.activeGain && this.ctx) {
      try {
        this.activeGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      } catch {}
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.volume = this.currentVolume;
      } catch {}
    }
  }

  public setSpeed(speed: number) {
    const rate = Math.max(0.5, Math.min(2.0, speed));
    if (this.activeSource && this.ctx) {
      try {
        this.activeSource.playbackRate.setValueAtTime(rate, this.ctx.currentTime);
      } catch {}
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.playbackRate = rate;
      } catch {}
    }
  }

  // Play line with zero latency, explicit buffer attachment, and multi-tier fallback
  public async playLine(
    lineIdx: number,
    volume: number = 0.95,
    speed: number = 1.0,
    onStart?: () => void,
    onEnded?: () => void,
    onError?: () => void
  ): Promise<boolean> {
    this.stop();
    this.currentVolume = Math.max(0, Math.min(1.0, volume));

    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {}
    }

    // Try Web Audio API first if context is running or available
    if (ctx && ctx.state === 'running') {
      let buffer = this.buffers.get(lineIdx);
      if (!buffer) {
        buffer = (await this.loadLineBuffer(lineIdx)) || undefined;
      }

      if (buffer) {
        try {
          const source = ctx.createBufferSource();
          // CRITICAL FIX: Explicitly assign the decoded audio buffer
          source.buffer = buffer;
          source.playbackRate.setValueAtTime(Math.max(0.5, Math.min(2.0, speed)), ctx.currentTime);

          // Sub-bass resonance filter for deep horror movie chest presence
          const bassBoost = ctx.createBiquadFilter();
          bassBoost.type = 'peaking';
          bassBoost.frequency.setValueAtTime(90, ctx.currentTime);
          bassBoost.Q.setValueAtTime(1.2, ctx.currentTime);
          bassBoost.gain.setValueAtTime(4.0, ctx.currentTime);

          // Master volume gain node
          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(this.currentVolume, ctx.currentTime);

          // Connect: source -> bassBoost -> gainNode -> destination
          source.connect(bassBoost);
          bassBoost.connect(gainNode);
          gainNode.connect(ctx.destination);

          this.activeSource = source;
          this.activeGain = gainNode;

          source.onended = () => {
            this.activeSource = null;
            this.activeGain = null;
            if (onEnded) onEnded();
          };

          source.start(0);
          if (onStart) onStart();
          return true;
        } catch (e) {
          console.warn('Web Audio playback error, falling back to HTMLAudio:', e);
        }
      }
    }

    // Secondary fallback: HTMLAudioElement with authentic rendered audio
    try {
      const audioUrl = `/audio/jigsaw/line_${lineIdx}.mp3`;
      const audio = new Audio(audioUrl);
      audio.volume = this.currentVolume;
      audio.playbackRate = Math.max(0.5, Math.min(2.0, speed));

      audio.onended = () => {
        this.activeHtmlAudio = null;
        if (onEnded) onEnded();
      };

      audio.onerror = () => {
        this.activeHtmlAudio = null;
        if (onError) onError();
      };

      this.activeHtmlAudio = audio;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (onStart) onStart();
          })
          .catch((err) => {
            console.warn('HTMLAudio play blocked/failed:', err);
            this.activeHtmlAudio = null;
            if (onError) onError();
          });
      }
      return true;
    } catch (err) {
      console.warn('HTMLAudio constructor exception:', err);
      if (onError) onError();
      return false;
    }
  }
}

export const jigsawVoiceEngine = new JigsawVoiceEngine();
