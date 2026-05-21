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
    window.dispatchEvent(new CustomEvent('sound-mute-toggle', { detail: { isMuted: this.isMuted } }));
  }

  getMuteState() {
    return this.isMuted;
  }

  playSwordWhoosh() {
    if (this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;
    const duration = 0.38;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(3.5, ctx.currentTime);
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.28);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.08); // Clearly audible swoosh
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    // 2. The Metallic Ring (High Sine Wave sweep - simulates steel friction in the air)
    const ringDuration = 0.15;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + ringDuration);

    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.015, ctx.currentTime); // Subtle steel ring
    ringGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ringDuration);

    // Connections
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.connect(ringGain);
    ringGain.connect(ctx.destination);

    // Playback
    noise.start();
    osc.start();

    noise.stop(ctx.currentTime + duration);
    osc.stop(ctx.currentTime + ringDuration);
  }

  playStampThud() {
    if (this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;

    // 1. Deep Bass Body Thud (Sine)
    const duration = 0.18;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    // 2. Mid Wood Impact (Triangle - adds harmonic body audible on laptops)
    const midDuration = 0.08;
    const midOsc = ctx.createOscillator();
    midOsc.type = "triangle";
    midOsc.frequency.setValueAtTime(320, ctx.currentTime);
    midOsc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + midDuration);

    const midGain = ctx.createGain();
    midGain.gain.setValueAtTime(0.18, ctx.currentTime);
    midGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + midDuration);

    // 3. Wood Contact Click (Highpass White Noise - transient snap)
    const clickDuration = 0.02; // 20ms click
    const bufferSize = ctx.sampleRate * clickDuration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(1200, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + clickDuration);

    // Connections
    osc.connect(gain);
    gain.connect(ctx.destination);

    midOsc.connect(midGain);
    midGain.connect(ctx.destination);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Playback
    osc.start();
    midOsc.start();
    noise.start();

    osc.stop(ctx.currentTime + duration);
    midOsc.stop(ctx.currentTime + midDuration);
    noise.stop(ctx.currentTime + clickDuration);
  }

  playWaterSplash() {
    if (this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.07);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

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

  playFootstep() {
    if (this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;

    const duration = 0.16;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    const squishDuration = 0.08;
    const bufferSize = ctx.sampleRate * squishDuration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(5.5, ctx.currentTime);
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + squishDuration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.038, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + squishDuration);

    // Connections
    osc.connect(gain);
    gain.connect(ctx.destination);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Playback
    osc.start();
    noise.start();

    osc.stop(ctx.currentTime + duration);
    noise.stop(ctx.currentTime + squishDuration);
  }

  playBookOpen() {
    if (this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const ctx = this.ctx;
    
    // 1. Tactile Woody Click (Tiếng cạch khớp gỗ đầu tiên - tạo phản hồi lực bấm rõ ràng)
    const clickDuration = 0.06;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + clickDuration);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.18, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + clickDuration);

    // 2. Heavy Scroll / Bamboo Slide (Tiếng trượt cuộn tre / giấy da dày)
    const slideDuration = 0.35;
    const bufferSize = ctx.sampleRate * slideDuration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(2.5, ctx.currentTime);
    filter.frequency.setValueAtTime(380, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + slideDuration);

    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0, ctx.currentTime);
    slideGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.06); // Clearly audible sliding friction
    slideGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + slideDuration);

    // 3. High-frequency Parchment Rustle (Tiếng sột soạt giấy da phụ)
    const rustleDuration = 0.22;
    const rustleBufferSize = ctx.sampleRate * rustleDuration;
    const rustleBuffer = ctx.createBuffer(1, rustleBufferSize, ctx.sampleRate);
    const rustleData = rustleBuffer.getChannelData(0);
    for (let i = 0; i < rustleBufferSize; i++) {
      rustleData[i] = Math.random() * 2 - 1;
    }
    const rustleNoise = ctx.createBufferSource();
    rustleNoise.buffer = rustleBuffer;

    const rustleFilter = ctx.createBiquadFilter();
    rustleFilter.type = "bandpass";
    rustleFilter.Q.setValueAtTime(4.0, ctx.currentTime);
    rustleFilter.frequency.setValueAtTime(1600, ctx.currentTime);
    rustleFilter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + rustleDuration);

    const rustleGain = ctx.createGain();
    rustleGain.gain.setValueAtTime(0, ctx.currentTime + 0.04);
    rustleGain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.04 + 0.04);
    rustleGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04 + rustleDuration);

    // Connections
    osc.connect(clickGain);
    clickGain.connect(ctx.destination);

    noise.connect(filter);
    filter.connect(slideGain);
    slideGain.connect(ctx.destination);

    rustleNoise.connect(rustleFilter);
    rustleFilter.connect(rustleGain);
    rustleGain.connect(ctx.destination);

    // Playback
    osc.start();
    noise.start();
    rustleNoise.start(ctx.currentTime + 0.04);

    osc.stop(ctx.currentTime + clickDuration);
    noise.stop(ctx.currentTime + slideDuration);
    rustleNoise.stop(ctx.currentTime + 0.04 + rustleDuration);
  }
}

export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null;
