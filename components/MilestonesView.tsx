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
  CheckCircle,
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

  const handleCelebrate = (title: string) => {
    triggerConfetti();
    playCelebrationChime();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-indigo-950/30 border border-amber-500/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Milestone Trophies & Streaks</h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Unbroken consecutive days unlock permanent tier badges. Your current streak is{' '}
            <strong className="text-amber-400 font-mono font-bold">{currentStreak} days</strong>.
          </p>
        </div>

        <button
          onClick={() => handleCelebrate('Streak')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap self-stretch sm:self-auto justify-center"
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
              className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                isUnlocked
                  ? 'bg-[#0E1628] border-amber-500/40 shadow-xl shadow-amber-500/5'
                  : 'bg-[#0A0E1A]/80 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  <IconComp className="h-6 w-6" />
                </div>

                {isUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                    <Lock className="h-3 w-3" />
                    {badge.requiredStreak} days required
                  </span>
                )}
              </div>

              <div className="mt-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  {badge.title}
                  <span className="text-[10px] font-mono uppercase text-slate-500">
                    {badge.tier}
                  </span>
                </h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Progress bar towards unlock */}
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                  <span>{isUnlocked ? 'Completed' : `${currentStreak} / ${badge.requiredStreak} days`}</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-indigo-500'
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
