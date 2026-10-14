'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Habit } from '@/types/habit';
import { playTimerTick, playTimerFinish } from '@/lib/sound';
import { triggerConfetti } from '@/lib/confetti';
import { sendWebNotification } from '@/lib/notifications';
import {
  AmbientSoundType,
  AMBIENT_SOUND_OPTIONS,
  setAmbientSound,
  setAmbientVolume,
  stopAmbientSound,
} from '@/lib/ambientAudio';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  Coffee,
  Sparkles,
  Volume1,
  Volume2,
  VolumeX,
  CheckCircle2,
  Target,
  Flame,
  Maximize2,
  Minimize2,
  CloudRain,
  Radio,
  Trees,
  Waves,
  Headphones,
  Music,
} from 'lucide-react';

interface PomodoroViewProps {
  habits: Habit[];
  onCompleteHabit?: (habitId: string) => void;
  completedTodayIds?: string[];
}

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

const PRESET_DURATIONS: Record<PomodoroMode, number[]> = {
  focus: [15, 25, 45, 50, 60],
  shortBreak: [3, 5, 10],
  longBreak: [15, 20, 30],
};

const DEFAULT_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

const AMBIENT_ICONS: Record<AmbientSoundType, React.ComponentType<{ className?: string }>> = {
  none: VolumeX,
  rain: CloudRain,
  pink_noise: Radio,
  forest: Trees,
  waves: Waves,
  binaural: Headphones,
};

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  habits,
  onCompleteHabit,
  completedTodayIds = [],
}) => {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATIONS.focus);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [autoZenOnStart, setAutoZenOnStart] = useState(false);

  const [linkedHabitId, setLinkedHabitId] = useState<string>(() => {
    const focusHabit = habits.find((h) => h.category === 'focus') || habits[0];
    return focusHabit ? focusHabit.id : '';
  });
  const [tickAudio, setTickAudio] = useState(false);

  // Ambient soundscape states
  const [ambientSound, setAmbientSoundState] = useState<AmbientSoundType>(() => {
    if (typeof window === 'undefined') return 'none';
    try {
      const saved = localStorage.getItem('focuspulse_ambient_sound');
      if (saved && ['none', 'rain', 'pink_noise', 'forest', 'waves', 'binaural'].includes(saved)) {
        return saved as AmbientSoundType;
      }
    } catch {}
    return 'none';
  });

  const [ambientVolume, setAmbientVolumeState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.5;
    try {
      const saved = localStorage.getItem('focuspulse_ambient_vol');
      if (saved) return parseFloat(saved);
    } catch {}
    return 0.5;
  });

  const [ambientOnlyWhenRunning, setAmbientOnlyWhenRunning] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('focuspulse_ambient_only_running');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [manualAmbientPlay, setManualAmbientPlay] = useState<boolean>(false);
  const [isZenSoundMenuOpen, setIsZenSoundMenuOpen] = useState<boolean>(false);

  // Derive active playing state cleanly
  const isAmbientPlaying =
    ambientSound !== 'none' &&
    (ambientOnlyWhenRunning ? isRunning : manualAmbientPlay);

  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem(`focuspulse_pomo_${today}`);
      if (saved) return JSON.parse(saved).sessions || 0;
    } catch {}
    return 0;
  });
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem(`focuspulse_pomo_${today}`);
      if (saved) return JSON.parse(saved).minutes || 0;
    } catch {}
    return 0;
  });
  const [showCompletionToast, setShowCompletionToast] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with Web Audio synthesizer (external system)
  useEffect(() => {
    if (isAmbientPlaying) {
      setAmbientSound(ambientSound, ambientVolume);
    } else {
      stopAmbientSound();
    }
  }, [isAmbientPlaying, ambientSound, ambientVolume]);

  // Clean up ambient audio on component unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const handleSelectSound = (sound: AmbientSoundType) => {
    setAmbientSoundState(sound);
    try {
      localStorage.setItem('focuspulse_ambient_sound', sound);
    } catch {}

    if (sound === 'none') {
      setManualAmbientPlay(false);
    } else {
      setManualAmbientPlay(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setAmbientVolumeState(clamped);
    setAmbientVolume(clamped);
    try {
      localStorage.setItem('focuspulse_ambient_vol', String(clamped));
    } catch {}
  };

  const toggleAmbientPlayPause = () => {
    if (ambientSound === 'none') {
      handleSelectSound('rain');
      return;
    }
    if (ambientOnlyWhenRunning) {
      // Switching to manual toggle mode
      setAmbientOnlyWhenRunning(false);
      try {
        localStorage.setItem('focuspulse_ambient_only_running', 'false');
      } catch {}
      setManualAmbientPlay(!isAmbientPlaying);
    } else {
      setManualAmbientPlay(!manualAmbientPlay);
    }
  };

  // Save sessions to localStorage
  const saveSessionStats = React.useCallback((sessions: number, minutes: number) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(
        `focuspulse_pomo_${today}`,
        JSON.stringify({ sessions, minutes })
      );
    } catch {}
  }, []);

  const handleTimerComplete = React.useCallback(() => {
    setIsRunning(false);
    playTimerFinish();

    if (mode === 'focus') {
      setCompletedSessions((prevSessions) => {
        const nextSessions = prevSessions + 1;
        setTotalFocusMinutes((prevMinutes) => {
          const nextMinutes = prevMinutes + durationMinutes;
          saveSessionStats(nextSessions, nextMinutes);
          return nextMinutes;
        });
        return nextSessions;
      });
      triggerConfetti();

      // Trigger Web Notification
      const linkedHabit = habits.find((h) => h.id === linkedHabitId);
      sendWebNotification('Pomodoro Focus Complete! 🎯', {
        body: linkedHabit
          ? `Great 25m session! Ready to check off "${linkedHabit.title}"?`
          : 'High focus session completed. Take a 5-minute break!',
        tag: 'pomodoro-complete',
      });

      setShowCompletionToast(
        linkedHabit
          ? `Focus block finished! Click below to complete "${linkedHabit.title}".`
          : 'Focus block finished! Take a restorative short break.'
      );
    } else {
      sendWebNotification('Break Finished ☕', {
        body: 'Break is over! Time to lock into your next focus block.',
        tag: 'pomodoro-break-complete',
      });
      setShowCompletionToast('Break finished! Ready for the next focus sprint?');
    }
  }, [mode, durationMinutes, habits, linkedHabitId, saveSessionStats]);

  // Handle countdown interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          if (tickAudio && prev % 2 === 0) {
            playTimerTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, tickAudio, handleTimerComplete]);

  // Keyboard shortcuts when in Zen / Fullscreen mode
  useEffect(() => {
    if (!isZenMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZenMode(false);
        if (typeof document !== 'undefined' && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsRunning(false);
        setTimeLeft(durationMinutes * 60);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, durationMinutes]);

  const enterZenMode = (withBrowserFullscreen = true) => {
    setIsZenMode(true);
    if (withBrowserFullscreen && typeof document !== 'undefined' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const exitZenMode = () => {
    setIsZenMode(false);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const switchMode = (newMode: PomodoroMode, newDuration?: number) => {
    setIsRunning(false);
    setMode(newMode);
    const dur = newDuration || DEFAULT_DURATIONS[newMode];
    setDurationMinutes(dur);
    setTimeLeft(dur * 60);
    setShowCompletionToast(null);
  };

  const toggleTimer = () => {
    const willRun = !isRunning;
    setIsRunning(willRun);
    if (willRun && autoZenOnStart && !isZenMode) {
      enterZenMode(false);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
  };

  const skipPhase = () => {
    if (mode === 'focus') {
      switchMode('shortBreak');
    } else {
      switchMode('focus');
    }
  };

  const handleMarkLinkedHabitDone = () => {
    if (linkedHabitId && onCompleteHabit) {
      onCompleteHabit(linkedHabitId);
      setShowCompletionToast(null);
      triggerConfetti();
    }
  };

  // Time formatting
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Circular math
  const totalSeconds = durationMinutes * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const zenRadius = 145;
  const zenCircumference = 2 * Math.PI * zenRadius;
  const zenStrokeDashoffset = zenCircumference - progressRatio * zenCircumference;

  const linkedHabit = habits.find((h) => h.id === linkedHabitId);
  const isLinkedHabitDone = linkedHabitId ? completedTodayIds.includes(linkedHabitId) : false;

  return (
    <>
      {/* =========================================================================
          FULLSCREEN NO-DISTRACTION ZEN MODE OVERLAY
         ========================================================================= */}
      {isZenMode && (
        <div className="fixed inset-0 z-50 bg-[#04060D] text-white flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none animate-fade-in">
          {/* Ambient Breathing Background Glow */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
              isRunning
                ? mode === 'focus'
                  ? 'bg-indigo-600/20 scale-110'
                  : 'bg-emerald-600/20 scale-110'
                : 'bg-slate-800/10 scale-95'
            }`}
          />

          {/* Top Bar in Zen Mode */}
          <div className="relative z-10 flex items-center justify-between gap-4 w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  mode === 'focus' ? 'bg-indigo-400' : 'bg-emerald-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  mode === 'focus' ? 'bg-indigo-500' : 'bg-emerald-500'
                }`} />
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                {mode === 'focus' ? 'Deep Focus Immersion' : 'Resting Phase'}
              </span>
              <span className="text-slate-600 font-mono">·</span>
              <span className="text-xs font-mono text-slate-400">
                Session #{completedSessions + 1}
              </span>
            </div>

            {linkedHabit && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-indigo-300">
                <Target className="h-3.5 w-3.5 text-indigo-400" />
                <span className="truncate max-w-xs">{linkedHabit.title}</span>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Zen Ambient Sound Controller */}
              <div className="relative">
                <button
                  onClick={() => setIsZenSoundMenuOpen(!isZenSoundMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    ambientSound !== 'none' && isAmbientPlaying
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
                  }`}
                  title="Ambient background soundscape"
                >
                  {React.createElement(AMBIENT_ICONS[ambientSound] || Music, { className: 'h-3.5 w-3.5' })}
                  <span className="hidden sm:inline">
                    {ambientSound === 'none'
                      ? 'Soundscape'
                      : AMBIENT_SOUND_OPTIONS.find((s) => s.id === ambientSound)?.label}
                  </span>
                  {ambientSound !== 'none' && isAmbientPlaying && (
                    <span className="flex items-end gap-0.5 h-2.5 ml-1">
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2.5" />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1.5" />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2" />
                    </span>
                  )}
                </button>

                {/* Zen Ambient Popover Menu */}
                {isZenSoundMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#090D17] border border-slate-700 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Music className="h-3.5 w-3.5 text-indigo-400" />
                        Ambient Soundscapes
                      </span>
                      <button
                        onClick={() => setIsZenSoundMenuOpen(false)}
                        className="text-[11px] text-slate-400 hover:text-white"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {AMBIENT_SOUND_OPTIONS.map((opt) => {
                        const Icon = AMBIENT_ICONS[opt.id];
                        const isSelected = ambientSound === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              handleSelectSound(opt.id);
                              if (opt.id === 'none') setIsZenSoundMenuOpen(false);
                            }}
                            className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-200'
                                : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Volume slider in Zen */}
                    {ambientSound !== 'none' && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Volume</span>
                          <span className="font-mono text-indigo-300">
                            {Math.round(ambientVolume * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={ambientVolume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subtle Tick Toggle */}
              <button
                onClick={() => setTickAudio(!tickAudio)}
                aria-label="Toggle tick audio"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs text-slate-400 hover:text-white transition-colors"
              >
                {tickAudio ? <Volume2 className="h-3.5 w-3.5 text-indigo-400" /> : <VolumeX className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{tickAudio ? 'Tick On' : 'Tick Muted'}</span>
              </button>

              <button
                onClick={exitZenMode}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit No-Distraction <span className="hidden sm:inline text-slate-500 font-mono">[Esc]</span></span>
              </button>
            </div>
          </div>

          {/* Center Stage: Immense Clock & Circular Ring */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            <div className="relative flex items-center justify-center">
              <svg className="w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r={zenRadius}
                  stroke="#172033"
                  strokeWidth="8"
                  fill="transparent"
                  className="opacity-50"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r={zenRadius}
                  stroke={mode === 'focus' ? 'url(#zenGradFocus)' : 'url(#zenGradBreak)'}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={zenCircumference}
                  strokeDashoffset={zenStrokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="zenGradFocus" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                  <linearGradient id="zenGradBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center px-4">
                <span className="font-mono text-7xl sm:text-8xl md:text-9xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                  {timeFormatted}
                </span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-400 mt-2">
                  {mode === 'focus'
                    ? isRunning
                      ? 'Single-tasking · Deep attention'
                      : 'Session Paused'
                    : 'Step back, breathe, and hydrate'}
                </span>
              </div>
            </div>

            {/* Floating Minimal Controls */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={resetTimer}
                title="Reset [R]"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              <button
                onClick={toggleTimer}
                className={`flex items-center justify-center gap-2.5 h-16 px-10 rounded-2xl text-base font-bold text-white shadow-2xl transition-all active:scale-95 ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : mode === 'focus'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-600/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-6 w-6 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6 fill-current ml-0.5" />
                    <span>Resume Focus</span>
                  </>
                )}
              </button>

              <button
                onClick={skipPhase}
                title="Skip to next phase"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            {/* If finished: quick Habit check-off */}
            {showCompletionToast && linkedHabit && !isLinkedHabitDone && (
              <div className="mt-6 flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 animate-fade-in">
                <span className="text-xs text-emerald-200">Session complete!</span>
                <button
                  onClick={handleMarkLinkedHabitDone}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark &ldquo;{linkedHabit.title}&rdquo; Done
                </button>
              </div>
            )}
          </div>

          {/* Bottom Bar in Zen Mode */}
          <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-900 pt-4 font-mono">
            <span>
              🍅 {completedSessions} sessions · {totalFocusMinutes}m focus logged today
            </span>
            <span className="text-[11px] text-slate-500">
              Shortcuts: [Space] Pause/Start · [R] Reset · [Esc] Exit
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          STANDARD POMODORO DASHBOARD VIEW
         ========================================================================= */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Completion Toast Banner if finished */}
        {showCompletionToast && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Focus Session Complete!</h4>
                <p className="text-xs text-slate-300 mt-0.5">{showCompletionToast}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              {linkedHabit && !isLinkedHabitDone && (
                <button
                  onClick={handleMarkLinkedHabitDone}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Habit Done
                </button>
              )}
              <button
                onClick={() => setShowCompletionToast(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Pomodoro Panel */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0C1220] border border-slate-800/80 p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          {/* Ambient background glows */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ${
              isRunning
                ? mode === 'focus'
                  ? 'bg-indigo-500/15 opacity-100'
                  : 'bg-emerald-500/15 opacity-100'
                : 'opacity-0'
            }`}
          />

          {/* Top Bar inside panel: Mode Selector & Enter Distraction-Free Mode */}
          <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-6">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
              <button
                onClick={() => switchMode('focus')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'focus'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Timer className="h-3.5 w-3.5" />
                Focus
              </button>
              <button
                onClick={() => switchMode('shortBreak')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'shortBreak'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coffee className="h-3.5 w-3.5" />
                Break
              </button>
              <button
                onClick={() => switchMode('longBreak')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'longBreak'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coffee className="h-3.5 w-3.5" />
                Long
              </button>
            </div>

            {/* Direct Enter No-Distraction Fullscreen button */}
            <button
              onClick={() => enterZenMode(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 text-xs font-bold hover:bg-slate-800 transition-all shadow-md shadow-indigo-500/10"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fullscreen No-Distraction</span>
            </button>
          </div>

          {/* Duration Presets for Current Mode */}
          <div className="flex items-center gap-1.5 mb-6">
            <span className="text-[11px] text-slate-500 font-mono mr-1">Presets:</span>
            {PRESET_DURATIONS[mode].map((min) => (
              <button
                key={min}
                onClick={() => {
                  setDurationMinutes(min);
                  setTimeLeft(min * 60);
                  setIsRunning(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                  durationMinutes === min
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>

          {/* Circular Countdown Progress Ring */}
          <div className="relative my-4 flex items-center justify-center">
            <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
              {/* Background Track */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="#1e293b"
                strokeWidth="10"
                fill="transparent"
                className="opacity-40"
              />
              {/* Progress Stroke */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke={mode === 'focus' ? 'url(#pomodoroGradFocus)' : 'url(#pomodoroGradBreak)'}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="pomodoroGradFocus" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="50%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="pomodoroGradBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Digital Timer Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-mono text-5xl sm:text-6xl font-extrabold text-white tracking-tight tabular-nums drop-shadow-md">
                {timeFormatted}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider mt-2 text-slate-400">
                {mode === 'focus' ? (isRunning ? 'In Deep Focus' : 'Focus Session') : 'Resting & Recharging'}
              </span>
              {linkedHabit && (
                <span className="text-[11px] text-indigo-400 mt-1 max-w-[180px] truncate">
                  🎯 {linkedHabit.title}
                </span>
              )}
            </div>
          </div>

          {/* Primary Controls */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={resetTimer}
              aria-label="Reset timer"
              title="Reset timer"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              onClick={toggleTimer}
              className={`flex items-center justify-center gap-2 h-14 px-8 rounded-2xl text-sm font-bold text-white shadow-xl transition-all active:scale-95 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : mode === 'focus'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                  <span>Start Session</span>
                </>
              )}
            </button>

            <button
              onClick={skipPhase}
              aria-label="Skip phase"
              title="Skip to next phase"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Auto Zen Switch & Habit Association Selector */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-indigo-400" />
                Link Session to Habit
              </span>
              <button
                onClick={() => setTickAudio(!tickAudio)}
                className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                  tickAudio ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                {tickAudio ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                {tickAudio ? 'Subtle Tick ON' : 'Tick Muted'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={linkedHabitId}
                onChange={(e) => setLinkedHabitId(e.target.value)}
                className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- No specific habit linked --</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title} {completedTodayIds.includes(h.id) ? '✓ (Done today)' : ''}
                  </option>
                ))}
              </select>

              {linkedHabit && isLinkedHabitDone && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-2 rounded-xl whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Done
                </span>
              )}
            </div>

            {/* Auto enter toggle */}
            <label className="flex items-center gap-2 pt-1 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoZenOnStart}
                onChange={(e) => setAutoZenOnStart(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              <span>Automatically enter no-distraction mode when timer starts</span>
            </label>
          </div>
        </div>

        {/* Ambient Soundscapes Selector Card */}
        <div className="rounded-3xl bg-[#0C1220] border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Music className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Ambient Background Soundscapes
                  {ambientSound !== 'none' && isAmbientPlaying && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="flex items-end gap-0.5 h-2">
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2" />
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1" />
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1.5" />
                      </span>
                      PLAYING
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Synthesized acoustic sound masking to deepen focus and eliminate outside distractions.
                </p>
              </div>
            </div>

            {/* Quick Play/Pause sound toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAmbientPlayPause}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isAmbientPlaying
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isAmbientPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause Soundscape</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>{ambientSound === 'none' ? 'Play Rain' : 'Play Soundscape'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 6 Soundscape Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {AMBIENT_SOUND_OPTIONS.map((sound) => {
              const Icon = AMBIENT_ICONS[sound.id];
              const isSelected = ambientSound === sound.id;
              const isCurrentlyPlaying = isSelected && isAmbientPlaying;

              return (
                <button
                  key={sound.id}
                  onClick={() => handleSelectSound(sound.id)}
                  className={`group relative p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[96px] ${
                    isSelected
                      ? 'bg-gradient-to-b from-indigo-950/70 to-slate-900/90 border-indigo-500/60 shadow-lg shadow-indigo-600/15'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {isCurrentlyPlaying && (
                      <span className="flex items-end gap-0.5 h-2.5">
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2.5" />
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1" />
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <span
                      className={`text-xs font-bold block truncate ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {sound.label}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 block leading-tight mt-0.5">
                      {sound.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sound Controls Bar: Volume & Timer Linking */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-3 flex-1 max-w-sm">
              <button
                onClick={() => handleVolumeChange(ambientVolume > 0 ? 0 : 0.5)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Mute / Unmute"
              >
                {ambientVolume === 0 ? (
                  <VolumeX className="h-4 w-4 text-slate-500" />
                ) : ambientVolume < 0.5 ? (
                  <Volume1 className="h-4 w-4 text-indigo-400" />
                ) : (
                  <Volume2 className="h-4 w-4 text-indigo-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-slate-300 min-w-[32px] text-right">
                {Math.round(ambientVolume * 100)}%
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ambientOnlyWhenRunning}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAmbientOnlyWhenRunning(val);
                  try {
                    localStorage.setItem('focuspulse_ambient_only_running', String(val));
                  } catch {}
                }}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300">Play only while session timer is running</span>
            </label>
          </div>
        </div>

        {/* Focus Daily Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#0C1220] border border-slate-800/80 flex items-center gap-3 shadow-lg">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Completed Today
              </span>
              <span className="text-xl font-bold text-white font-mono tabular-nums">
                {completedSessions} sessions
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0C1220] border border-slate-800/80 flex items-center gap-3 shadow-lg">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Focus Duration
              </span>
              <span className="text-xl font-bold text-white font-mono tabular-nums">
                {totalFocusMinutes} mins
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0C1220] border border-slate-800/80 flex items-center gap-3 shadow-lg">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Discipline State
              </span>
              <span className="text-xl font-bold text-amber-400">
                {completedSessions >= 4 ? 'Elite Flow' : completedSessions > 0 ? 'Active Focus' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
