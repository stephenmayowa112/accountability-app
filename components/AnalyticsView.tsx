'use client';

import React from 'react';
import { Habit, HabitLogsMap, UserStats } from '@/types/habit';
import {
  Flame,
  Award,
  CalendarCheck,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AnalyticsViewProps {
  habits: Habit[];
  logs: HabitLogsMap;
  stats: UserStats;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  habits,
  logs,
  stats,
}) => {
  // Category breakdown
  const categoryStats = React.useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {
      health: { total: 0, completed: 0 },
      focus: { total: 0, completed: 0 },
      mindset: { total: 0, completed: 0 },
      fitness: { total: 0, completed: 0 },
      routine: { total: 0, completed: 0 },
    };

    const habitMap = new Map<string, Habit>();
    habits.forEach((h) => {
      habitMap.set(h.id, h);
      if (counts[h.category]) {
        counts[h.category].total++;
      }
    });

    Object.values(logs).forEach((log) => {
      log.completedHabitIds?.forEach((id) => {
        const h = habitMap.get(id);
        if (h && counts[h.category]) {
          counts[h.category].completed++;
        }
      });
    });

    return counts;
  }, [habits, logs]);

  // Weekday performance
  const weekdayStats = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const totalDays = [0, 0, 0, 0, 0, 0, 0];

    Object.entries(logs).forEach(([dateStr, log]) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const day = date.getDay();
      totalDays[day]++;
      if (log.completedHabitIds) {
        counts[day] += log.completedHabitIds.length;
      }
    });

    const max = Math.max(...counts, 1);
    return days.map((name, index) => ({
      name,
      completed: counts[index],
      percentage: Math.round((counts[index] / max) * 100),
    }));
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* 4-KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0C1220] border border-slate-800/80 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Flame className="h-4 w-4 text-amber-400" />
            Active Streak
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums font-mono">
              {stats.currentStreak}
            </span>
            <span className="text-xs text-amber-400 font-medium">days running</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Personal best: {stats.longestStreak} days
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C1220] border border-slate-800/80 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            30-Day Rate
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums font-mono">
              {stats.completionRate30d}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">adherence</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            7-day pace: {stats.completionRate7d}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C1220] border border-slate-800/80 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Award className="h-4 w-4 text-indigo-400" />
            Perfect Days
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums font-mono">
              {stats.perfectDaysCount}
            </span>
            <span className="text-xs text-indigo-400 font-medium">100% days</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Zero missed habits
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C1220] border border-slate-800/80 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="h-4 w-4 text-cyan-400" />
            Completions
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums font-mono">
              {stats.totalCompletions}
            </span>
            <span className="text-xs text-cyan-400 font-medium">total logged</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Across {habits.length} habits
          </span>
        </div>
      </div>

      {/* Two Column Visual Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekday Adherence Histogram */}
        <div className="p-5 rounded-2xl bg-[#0C1220] border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">Adherence by Day of Week</h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">Normalized frequency</span>
          </div>

          <div className="flex items-end justify-between h-44 pt-6 pb-2 px-2 gap-2">
            {weekdayStats.map((d) => (
              <div key={d.name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {d.completed}
                </span>
                <div className="w-full bg-slate-800/60 rounded-t-lg overflow-hidden flex flex-col justify-end h-full max-h-32">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-lg transition-all duration-700 hover:brightness-125"
                    style={{ height: `${Math.max(d.percentage, 10)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {d.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="p-5 rounded-2xl bg-[#0C1220] border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Habit Pillars & Focus</h4>
            </div>
            <span className="text-xs text-slate-400">Total logs by domain</span>
          </div>

          <div className="space-y-3.5">
            {[
              { key: 'health', label: 'Health & Vitality', color: 'bg-cyan-400', count: categoryStats.health.completed },
              { key: 'focus', label: 'Deep Focus & Work', color: 'bg-indigo-400', count: categoryStats.focus.completed },
              { key: 'fitness', label: 'Physical Fitness', color: 'bg-emerald-400', count: categoryStats.fitness.completed },
              { key: 'mindset', label: 'Mindset & Recovery', color: 'bg-amber-400', count: categoryStats.mindset.completed },
              { key: 'routine', label: 'Daily Life Routines', color: 'bg-purple-400', count: categoryStats.routine.completed },
            ].map((cat) => {
              const maxCount = Math.max(
                ...Object.values(categoryStats).map((c) => c.completed),
                1
              );
              const percentage = Math.round((cat.count / maxCount) * 100);

              return (
                <div key={cat.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">{cat.label}</span>
                    <span className="text-slate-400 font-mono tabular-nums">
                      {cat.count} check-ins
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Motivation & Accountability Discipline Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/20 shadow-xl flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">The Rule of Consecutive Momentum</h4>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            &ldquo;You do not rise to the level of your goals. You fall to the level of your systems.&rdquo;
            Small daily habits compounding over 365 days yield a 37x personal transformation. Never miss twice.
          </p>
        </div>
      </div>
    </div>
  );
};
