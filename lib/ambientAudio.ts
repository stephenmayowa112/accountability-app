// Web Audio API Ambient Sound Synthesizer for Focus & Pomodoro Sessions
// Completely client-side, zero external network dependencies, infinite smooth loop

export type AmbientSoundType = 'none' | 'rain' | 'pink_noise' | 'forest' | 'waves' | 'binaural';

export interface AmbientSoundMeta {
  id: AmbientSoundType;
  label: string;
  iconName: string;
  description: string;
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundMeta[] = [
  {
    id: 'none',
    label: 'Silent',
    iconName: 'VolumeX',
    description: 'No ambient background sound',
  },
  {
    id: 'rain',
    label: 'Gentle Rain',
    iconName: 'CloudRain',
    description: 'Calming steady rainfall on foliage',
  },
  {
    id: 'pink_noise',
    label: 'Deep Pink Noise',
    iconName: 'Radio',
    description: 'Warm low-frequency sound masking',
  },
  {
    id: 'forest',
    label: 'Tranquil Forest',
    iconName: 'Trees',
    description: 'Breezy treetops with soft distant chirps',
  },
  {
    id: 'waves',
    label: 'Ocean Surf',
    iconName: 'Waves',
    description: 'Rhythmic coastal tide and surf swell',
  },
  {
    id: 'binaural',
    label: 'Alpha Focus Beat',
    iconName: 'Headphones',
    description: '10Hz alpha waves for deep state flow',
  },
];

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentType: AmbientSoundType = 'none';
let isPlaying = false;
let currentVolume = 0.45;

// Active audio nodes tracking for cleanup
let activeNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];
let birdIntervalId: NodeJS.Timeout | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Clean up currently playing audio nodes
 */
function cleanupActiveNodes() {
  if (birdIntervalId) {
    clearInterval(birdIntervalId);
    birdIntervalId = null;
  }
  activeNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      node.disconnect();
    } catch {}
  });
  activeNodes = [];
}

/**
 * Generate 5 seconds of looped pink noise buffer
 */
function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

/**
 * Build Rain Generator
 */
function startRainSound(ctx: AudioContext, destination: GainNode) {
  const noiseBuffer = createPinkNoiseBuffer(ctx);

  // Background steady rain rumble
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(750, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.7, ctx.currentTime);

  source.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(destination);
  source.start();

  activeNodes.push(source, lowpass, gain);

  // Higher frequency droplet sizzle
  const sizzleSource = ctx.createBufferSource();
  sizzleSource.buffer = noiseBuffer;
  sizzleSource.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(2200, ctx.currentTime);
  bandpass.Q.setValueAtTime(1.5, ctx.currentTime);

  const sizzleGain = ctx.createGain();
  sizzleGain.gain.setValueAtTime(0.25, ctx.currentTime);

  sizzleSource.connect(bandpass);
  bandpass.connect(sizzleGain);
  sizzleGain.connect(destination);
  sizzleSource.start();

  activeNodes.push(sizzleSource, bandpass, sizzleGain);
}

/**
 * Build Deep Pink Noise Generator
 */
function startPinkNoiseSound(ctx: AudioContext, destination: GainNode) {
  const noiseBuffer = createPinkNoiseBuffer(ctx);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.85, ctx.currentTime);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start();

  activeNodes.push(source, filter, gain);
}

/**
 * Build Ocean Waves with LFO Modulated Swell
 */
function startWavesSound(ctx: AudioContext, destination: GainNode) {
  const noiseBuffer = createPinkNoiseBuffer(ctx);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(350, ctx.currentTime);

  // LFO modulates the filter frequency to create rising and crashing waves
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 second wave cycle

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(300, ctx.currentTime); // sweep range

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, ctx.currentTime);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start();

  activeNodes.push(source, filter, lfo, lfoGain, gain);
}

/**
 * Build Forest with Wind and Procedural Bird Chirps
 */
function startForestSound(ctx: AudioContext, destination: GainNode) {
  // Gentle wind layer
  const noiseBuffer = createPinkNoiseBuffer(ctx);
  const windSource = ctx.createBufferSource();
  windSource.buffer = noiseBuffer;
  windSource.loop = true;

  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.setValueAtTime(450, ctx.currentTime);

  const windGain = ctx.createGain();
  windGain.gain.setValueAtTime(0.4, ctx.currentTime);

  windSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(destination);
  windSource.start();

  activeNodes.push(windSource, windFilter, windGain);

  // Periodic soft bird chirp generator
  const playBirdChirp = () => {
    if (!isPlaying || currentType !== 'forest') return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const chirpGain = ctx.createGain();

      const baseFreq = 2200 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.16);

      chirpGain.gain.setValueAtTime(0.001, now);
      chirpGain.gain.linearRampToValueAtTime(0.04, now + 0.05);
      chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(chirpGain);
      chirpGain.connect(destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  };

  birdIntervalId = setInterval(() => {
    if (Math.random() > 0.35) {
      playBirdChirp();
      if (Math.random() > 0.5) {
        setTimeout(playBirdChirp, 180);
      }
    }
  }, 4500);
}

/**
 * Build Binaural Alpha Waves (10Hz difference)
 */
function startBinauralSound(ctx: AudioContext, destination: GainNode) {
  const baseFreq = 216; // 216 Hz Left
  const beatFreq = 10; // 226 Hz Right -> 10Hz Alpha State

  const oscLeft = ctx.createOscillator();
  oscLeft.type = 'sine';
  oscLeft.frequency.setValueAtTime(baseFreq, ctx.currentTime);

  const oscRight = ctx.createOscillator();
  oscRight.type = 'sine';
  oscRight.frequency.setValueAtTime(baseFreq + beatFreq, ctx.currentTime);

  const gainLeft = ctx.createGain();
  gainLeft.gain.setValueAtTime(0.2, ctx.currentTime);

  const gainRight = ctx.createGain();
  gainRight.gain.setValueAtTime(0.2, ctx.currentTime);

  // Use StereoPanner if available for spatial separation
  if ('createStereoPanner' in ctx) {
    const pannerLeft = ctx.createStereoPanner();
    pannerLeft.pan.setValueAtTime(-0.9, ctx.currentTime);
    const pannerRight = ctx.createStereoPanner();
    pannerRight.pan.setValueAtTime(0.9, ctx.currentTime);

    oscLeft.connect(gainLeft);
    gainLeft.connect(pannerLeft);
    pannerLeft.connect(destination);

    oscRight.connect(gainRight);
    gainRight.connect(pannerRight);
    pannerRight.connect(destination);

    activeNodes.push(oscLeft, oscRight, gainLeft, gainRight, pannerLeft, pannerRight);
  } else {
    oscLeft.connect(gainLeft);
    gainLeft.connect(destination);
    oscRight.connect(gainRight);
    gainRight.connect(destination);
    activeNodes.push(oscLeft, oscRight, gainLeft, gainRight);
  }

  oscLeft.start();
  oscRight.start();
}

/**
 * Public API: Play selected ambient soundscape
 */
export function setAmbientSound(type: AmbientSoundType, volume = currentVolume) {
  currentType = type;
  currentVolume = volume;

  if (type === 'none') {
    cleanupActiveNodes();
    isPlaying = false;
    return;
  }

  const ctx = getContext();
  if (!ctx) return;

  cleanupActiveNodes();

  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
  }

  masterGain.gain.setValueAtTime(volume, ctx.currentTime);

  switch (type) {
    case 'rain':
      startRainSound(ctx, masterGain);
      break;
    case 'pink_noise':
      startPinkNoiseSound(ctx, masterGain);
      break;
    case 'forest':
      startForestSound(ctx, masterGain);
      break;
    case 'waves':
      startWavesSound(ctx, masterGain);
      break;
    case 'binaural':
      startBinauralSound(ctx, masterGain);
      break;
  }

  isPlaying = true;
}

export function setAmbientVolume(volume: number) {
  currentVolume = Math.max(0, Math.min(1, volume));
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
  }
}

export function stopAmbientSound() {
  cleanupActiveNodes();
  isPlaying = false;
}

export function getAmbientSoundType(): AmbientSoundType {
  return currentType;
}

export function isAmbientAudioPlaying(): boolean {
  return isPlaying;
}
