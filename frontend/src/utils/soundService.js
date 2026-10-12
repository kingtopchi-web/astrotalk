// Sound utility using Web Audio API for reliable cross-browser ringtones and notification alerts
// No external MP3 downloads required, guaranteed to work offline and immediately.

class SoundService {
  constructor() {
    this.ctx = null;
    this.ringInterval = null;
    this.isPlayingRing = false;
  }

  getAudioContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play a pleasant double-tone notification chime (D5 -> A5)
  playNotificationSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Notification sound error:', e);
    }
  }

  // Play incoming phone ringtone (Standard dual-tone cadence)
  playIncomingRing() {
    if (this.isPlayingRing) return;
    this.isPlayingRing = true;

    const playBurst = () => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // A4
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now); // B4

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain.gain.setValueAtTime(0.25, now + 1.6);
        gain.gain.linearRampToValueAtTime(0, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.85);
        osc2.stop(now + 1.85);
      } catch (err) {
        console.warn('Incoming ring burst error:', err);
      }
    };

    playBurst();
    this.ringInterval = setInterval(() => {
      if (!this.isPlayingRing) {
        clearInterval(this.ringInterval);
        return;
      }
      playBurst();
    }, 3000);
  }

  // Play outgoing dial/ringback tone (Gentle repeating cadence)
  playOutgoingRing() {
    if (this.isPlayingRing) return;
    this.isPlayingRing = true;

    const playBeep = () => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(400, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.setValueAtTime(0.15, now + 1.2);
        gain.gain.linearRampToValueAtTime(0, now + 1.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.35);
        osc2.stop(now + 1.35);
      } catch (e) {
        console.warn('Outgoing ring error:', e);
      }
    };

    playBeep();
    this.ringInterval = setInterval(() => {
      if (!this.isPlayingRing) {
        clearInterval(this.ringInterval);
        return;
      }
      playBeep();
    }, 3500);
  }

  stopRing() {
    this.isPlayingRing = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

export const soundService = new SoundService();
