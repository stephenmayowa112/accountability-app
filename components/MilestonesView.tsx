'use client';

import React from 'react';
import { MILESTONES } from '@/lib/storage';
import { UserStats } from '@/types/habit';
import { triggerConfetti } from '@/lib/confetti';
import { playCelebrationChime } from '@/lib/sound';
import {
  Trophy,
  Flame,
  ShieldCheck,
  Zap,
  Crown,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface MilestonesViewProps {
  stats: UserStats;
}

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Flame,
  ShieldCheck,
  Zap,
  Trophy,
  Crown,
};

export const MilestonesView: React.FC<MilestonesViewProps> = ({ stats }) => {
  const currentStreak = stats.currentStreak;

  const handleCelebrate = () => {
    triggerConfetti();
    playCelebrationChime();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#0C1220] border border-slate-800/80 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Milestone Trophies & Streaks</h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Consecutive active days unlock permanent milestone tiers. Current streak:{' '}
            <strong className="text-amber-400 font-mono font-bold tabular-nums">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </strong>{' '}
            · Personal best:{' '}
            <strong className="text-slate-200 font-mono font-semibold tabular-nums">
              {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
            </strong>
          </p>
        </div>

        <button
          onClick={handleCelebrate}
          className="flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold active:scale-95 transition-all whitespace-nowrap self-stretch sm:self-auto"
        >
          <Sparkles className="h-4 w-4" />
          Celebrate Momentum
        </button>
      </div>

      {/* Milestone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MILESTONES.map((badge) => {
          const isUnlocked = currentStreak >= badge.requiredStreak;
          const IconComp = ICON_COMPONENTS[badge.icon] || Trophy;
          const progress = Math.min(100, Math.round((currentStreak / badge.requiredStreak) * 100));

          return (
            <div
              key={badge.id}
              className={`relative rounded-2xl border p-5 transition-colors ${
                isUnlocked
                  ? 'bg-[#0E1628] border-amber-500/40'
                  : 'bg-[#0A0E1A]/80 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  <IconComp className="h-5 w-5" />
                </div>

                {/* Unboxed status text */}
                {isUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                    <Lock className="h-3.5 w-3.5" />
                    {badge.requiredStreak}d required
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                  <span className="capitalize">{badge.tier} tier</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{badge.requiredStreak}-day target</span>
                </div>
                <h4 className="text-base font-bold text-white">{badge.title}</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress bar towards unlock */}
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono tabular-nums">
                  <span>
                    {isUnlocked ? 'Completed' : `${currentStreak} / ${badge.requiredStreak} days`}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-amber-400' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
