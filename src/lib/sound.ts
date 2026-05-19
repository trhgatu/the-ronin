'use client';

import gsap from "@/lib/gsap";

class SoundManager {
  private ctx: AudioContext | null = null;
  private bgMusic: HTMLAudioElement | null = null;
  private isMuted = true;
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Background music setup - Initialize to 0 raw volume to avoid browser bypass blasts!
    this.bgMusic = new Audio();
    this.bgMusic.src = "/audio/01 81 Summer.mp3";
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0;

    this.isInitialized = true;
  }

  toggle() {
    this.init();
    if (!this.bgMusic) return;

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isMuted) {
      this.bgMusic.play().catch(e => console.log("Audio play blocked by browser:", e));

      gsap.killTweensOf(this.bgMusic);
      gsap.to(this.bgMusic, {
        volume: 0.16,
        duration: 1.8,
        ease: "power2.out"
      });
      this.isMuted = false;
    } else {
      // Mute: Fade out music smoothly to 0 before pausing
      gsap.killTweensOf(this.bgMusic);
      gsap.to(this.bgMusic, {
        volume: 0,
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: () => {
          if (this.isMuted && this.bgMusic) {
            this.bgMusic.pause();
          }
        }
      });
      this.isMuted = true;
    }

    // Dispatch global custom event for button sync
    window.dispatchEvent(new CustomEvent('sound-mute-toggle', { detail: { isMuted: this.isMuted } }));
  }

  getMuteState() {
    return this.isMuted;
  }

  // Web Audio Synthesizer: SWORD WHOOSH (Artifact Card hover)
  playSwordWhoosh() {
    if (this.isMuted || !this.ctx) return;

    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;
    const duration = 0.35; // 350ms swift swipe
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter sweeping upwards quickly to mimic wind swipe of a blade
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(4.0, ctx.currentTime);
    filter.frequency.setValueAtTime(280, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1900, ctx.currentTime + 0.3);

    // Gain envelope (soft sweep in, sharp decay out)
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.06); // quiet, subtle swoosh
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  // Web Audio Synthesizer: HANKO STAMP THUD (Hanko seal hover/click)
  playStampThud() {
    if (this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;
    const duration = 0.15;

    // Low frequency sine sweep mimicking a heavy wooden seal striking soft paper
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    // White noise low-pass burst for dry paper impact texture
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.05;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(140, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.09, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start();
    noise.start();
    osc.stop(ctx.currentTime + duration);
    noise.stop(ctx.currentTime + duration);
  }

  // Web Audio Synthesizer: WATER SPLASH (Theme change water droplet)
  playWaterSplash() {
    if (this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;

    // High frequency upward swept sine drop
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.07);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

    // High frequency bandpass filtered noise burst for the ripple sprinkle
    const bufferSize = ctx.sampleRate * 0.16;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(10.0, ctx.currentTime);
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.12);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.025);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start();
    noise.start();
    osc.stop(ctx.currentTime + 0.22);
    noise.stop(ctx.currentTime + 0.22);
  }
}

export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null;
