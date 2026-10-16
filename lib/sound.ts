// Web Audio API Synthesizer for Clean Micro-Interactions and Notification Chimes

let audioCtx: AudioContext | null = null;
let soundMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  soundMuted = muted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('focuspulse_sound_muted', muted ? 'true' : 'false');
    } catch {}
  }
}

export function getSoundMuted(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('focuspulse_sound_muted');
      if (stored !== null) return stored === 'true';
    } catch {}
  }
  return soundMuted;
}

/**
 * Play a crisp, pleasant two-tone completion chime when checking off a habit
 */
export function playSuccessChime() {
  if (getSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Tone 1: 587.33 Hz (D5)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(587.33, now);
  gain1.gain.setValueAtTime(0.12, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.3);

  // Tone 2: 880 Hz (A5)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880, now + 0.08);
  gain2.gain.setValueAtTime(0.15, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.5);
}

/**
 * Play an uplifting celebratory harmonic arpeggio when completing all daily habits or streak
 */
export function playCelebrationChime() {
  if (getSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major triad)

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteStart = now + idx * 0.07;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteStart);
    gain.gain.setValueAtTime(0.16, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteStart + 0.52);
  });
}

/**
 * Play a resonant prompt alert tone for accountability check-in reminders
 */
export function playReminderTone() {
  if (getSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(659.25, now); // E5
  osc.frequency.setValueAtTime(880.0, now + 0.15); // A5

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.7);
}

/**
 * Play a gentle subtle focus tick
 */
export function playTimerTick() {
  if (getSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1200, now);
  gain.gain.setValueAtTime(0.015, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.04);
}

/**
 * Play an accomplishment gong/bell when Pomodoro finishes
 */
export function playTimerFinish() {
  if (getSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [523.25, 783.99, 1046.5]; // C5, G5, C6 rich chime

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.12;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.0005, start + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 1.25);
  });
}

/**
 * Play a high-urgency, aggressive alert tone designed to capture attention immediately.
 * Dual-harmonic rapid rising alert pulses (880Hz -> 1480Hz) with sharp attack.
 */
export function playAggressiveAlertTone() {
  if (getSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bursts = [0, 0.2];

  bursts.forEach((burstStart) => {
    const start = now + burstStart;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, start);
    osc.frequency.exponentialRampToValueAtTime(1480, start + 0.14);

    gain.gain.setValueAtTime(0.28, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.17);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.18);
  });
}

/**
 * Trigger haptic vibration on mobile devices if supported by browser/hardware
 */
export function triggerDeviceVibration(pattern: number[] = [250, 100, 250, 100, 400]) {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}
