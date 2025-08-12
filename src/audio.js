export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.enabled) return;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        this.enabled = false;
        return;
      }
      this.audioContext = new AudioCtx();
    }
  }

  resume() {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playBeep({ frequency = 600, duration = 0.08, type = 'sine', gain = 0.06 } = {}) {
    if (!this.enabled) return;
    this.ensureContext();
    const ctx = this.audioContext;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    amp.gain.value = gain;

    oscillator.connect(amp).connect(ctx.destination);
    oscillator.start();

    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  }

  playJump() {
    this.playBeep({ frequency: 760, duration: 0.09, type: 'square', gain: 0.05 });
  }

  playHit() {
    this.playBeep({ frequency: 120, duration: 0.18, type: 'sawtooth', gain: 0.08 });
  }

  playScore() {
    this.playBeep({ frequency: 880, duration: 0.05, type: 'triangle', gain: 0.04 });
  }
}