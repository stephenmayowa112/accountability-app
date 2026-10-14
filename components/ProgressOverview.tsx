'use client';

import React from 'react';
import { Flame, CheckCircle2, TrendingUp, ShieldAlert } from 'lucide-react';
import { UserStats } from '@/types/habit';

interface ProgressOverviewProps {
  completedCount: number;
  totalDue: number;
  stats: UserStats;
  onOpenCheckIn: () => void;
  selectedDateIsToday: boolean;
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  completedCount,
  totalDue,
  stats,
  onOpenCheckIn,
  selectedDateIsToday,
}) => {
  const percentage = totalDue > 0 ? Math.round((completedCount / totalDue) * 100) : 0;

  // SVG circular math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* Card 1: Today's Completion Radial Ring */}
      <div className="rounded-2xl bg-[#0D121F]/90 border border-slate-800/60 p-4 sm:p-5 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
            {selectedDateIsToday ? "Today's Progress" : 'Selected Day'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white tabular-nums">
              {percentage}%
            </span>
            <span className="text-xs text-slate-400">
              {completedCount} of {totalDue} done
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {percentage === 100
              ? 'All habits completed for today'
              : `${totalDue - completedCount} habit${totalDue - completedCount === 1 ? '' : 's'} remaining`}
          </p>
        </div>

        {/* Circular SVG Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#1e293b"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <CheckCircle2 className={`h-5 w-5 ${percentage === 100 ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
        </div>
      </div>

      {/* Card 2: Streak Fire & Momentum */}
      <div className="rounded-2xl bg-[#0D121F]/90 border border-slate-800/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
              Current Streak
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-amber-400 tabular-nums flex items-baseline gap-1">
                {stats.currentStreak}
                <span className="text-xs font-medium text-slate-400">days</span>
              </span>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Flame className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
          <span>Best: <strong className="text-slate-200 tabular-nums font-mono font-medium">{stats.longestStreak} days</strong></span>
          <span>Total: <strong className="text-slate-200 tabular-nums font-mono font-medium">{stats.totalCompletions} logged</strong></span>
        </div>
      </div>

      {/* Card 3: 7-Day Consistency & Accountability Trigger */}
      <div className="rounded-2xl bg-[#0D121F]/90 border border-slate-800/60 p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
              Weekly Adherence
            </span>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="tabular-nums">{stats.completionRate7d}%</span>
            </div>
          </div>

          <div className="w-full bg-slate-800/70 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate7d}%` }}
            />
          </div>
        </div>

        <div className="mt-3 pt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {stats.perfectDaysCount} perfect days
          </span>
          <button
            onClick={onOpenCheckIn}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-white transition-colors py-1 px-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
            Check-In
          </button>
        </div>
      </div>
    </div>
  );
};
