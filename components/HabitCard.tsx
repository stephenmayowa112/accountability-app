'use client';

import React, { useMemo } from 'react';
import { Habit, HabitCategory, HabitLogsMap } from '@/types/habit';
import { getHabit7DayStats } from '@/lib/storage';
import {
  Check,
  Bell,
  Clock,
  Flame,
  MoreVertical,
  Edit2,
  Trash2,
  Target,
  Brain,
  Dumbbell,
  Heart,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: (habitId: string) => void;
  streak: number;
  logs: HabitLogsMap;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  compactView?: boolean;
}

const CATEGORY_CONFIG: Record<
  HabitCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string; dotClass: string }
> = {
  health: { label: 'Health', icon: Heart, colorClass: 'text-cyan-400', dotClass: 'bg-cyan-400' },
  focus: { label: 'Deep Focus', icon: Target, colorClass: 'text-indigo-400', dotClass: 'bg-indigo-400' },
  mindset: { label: 'Mindset', icon: Brain, colorClass: 'text-amber-400', dotClass: 'bg-amber-400' },
  fitness: { label: 'Fitness', icon: Dumbbell, colorClass: 'text-emerald-400', dotClass: 'bg-emerald-400' },
  routine: { label: 'Routine', icon: CalendarCheck, colorClass: 'text-purple-400', dotClass: 'bg-purple-400' },
};

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  onToggle,
  streak,
  logs,
  onEdit,
  onDelete,
  compactView = false,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const categoryMeta = CATEGORY_CONFIG[habit.category] || CATEGORY_CONFIG.routine;
  const CategoryIcon = categoryMeta.icon;

  const stats7d = useMemo(() => getHabit7DayStats(habit, logs), [habit, logs]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Minimal / Compact Row View
  if (compactView) {
    return (
      <div
        className={`group relative rounded-xl border transition-all duration-200 ${
          isCompleted
            ? 'bg-[#0A0E17]/70 border-emerald-500/20 shadow-sm'
            : 'bg-[#0D121F]/90 border-slate-800/60 hover:border-slate-700/80 shadow-sm'
        }`}
      >
        <div className="px-3.5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Minimal Checkbox */}
            <button
              onClick={() => onToggle(habit.id)}
              aria-label={`Mark ${habit.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
              className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                isCompleted
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                  : 'border border-slate-700 bg-slate-900/60 hover:border-indigo-400 hover:bg-slate-800/50 text-transparent'
              }`}
            >
              <Check className={`h-4 w-4 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-75'}`} />
            </button>

            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${categoryMeta.dotClass} opacity-80`}
                title={categoryMeta.label}
              />
              <span
                className={`text-sm font-medium truncate transition-colors ${
                  isCompleted ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-100'
                }`}
              >
                {habit.title}
              </span>
            </div>
          </div>

          {/* Right items: Streak, 7d Mini Progress, Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mini 7-day spark bar */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats7d.percentage >= 80
                      ? 'bg-emerald-400'
                      : stats7d.percentage >= 50
                      ? 'bg-indigo-400'
                      : stats7d.percentage > 0
                      ? 'bg-amber-400'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${stats7d.percentage}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {stats7d.percentage}%
              </span>
            </div>

            {streak > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400">
                <Flame className="h-3 w-3" />
                {streak}d
              </span>
            )}

            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Habit options"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-slate-800 bg-[#101625] p-1.5 shadow-xl z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(habit);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="h-3 w-3 text-indigo-400" />
                    Edit Habit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(habit.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete Habit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Refined Clean Standard View
  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-[#090D16]/80 border-emerald-500/20 shadow-sm'
          : 'bg-[#0D121F]/90 border-slate-800/60 hover:border-slate-700/80 shadow-md shadow-black/20'
      }`}
    >
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        {/* Tactile Checkbox Button */}
        <button
          onClick={() => onToggle(habit.id)}
          aria-label={`Mark ${habit.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
          className={`flex-shrink-0 min-h-[42px] min-w-[42px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            isCompleted
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'border border-slate-700/80 bg-slate-900/60 hover:border-indigo-400 hover:bg-slate-800/60 text-transparent'
          }`}
        >
          <Check className={`h-5 w-5 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-75'}`} />
        </button>

        {/* Habit Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1">
            <span className={`inline-flex items-center gap-1.5 font-medium ${categoryMeta.colorClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${categoryMeta.dotClass}`} />
              {categoryMeta.label}
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="inline-flex items-center gap-1 text-slate-400 tabular-nums">
              <Clock className="h-3 w-3 text-slate-500" />
              {habit.timeOfDay}
            </span>
            {habit.reminderEnabled && (
              <>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="inline-flex items-center gap-1 text-indigo-400">
                  <Bell className="h-3 w-3" />
                  Reminder
                </span>
              </>
            )}
            {streak > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-mono font-medium tabular-nums">
                  <Flame className="h-3 w-3" />
                  {streak}d streak
                </span>
              </>
            )}
          </div>

          <h3
            className={`text-base font-semibold transition-colors ${
              isCompleted ? 'text-slate-400 line-through decoration-slate-600 decoration-2' : 'text-slate-100'
            }`}
          >
            {habit.title}
          </h3>

          {habit.description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {habit.description}
            </p>
          )}

          {/* Minimalist Accountability Prompt Callout */}
          {habit.promptMessage && (
            <div className="mt-2.5 rounded-lg bg-slate-900/60 border-l-2 border-indigo-500/80 px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 tracking-wider shrink-0">
                Prompt
              </span>
              <span className="italic truncate text-slate-300">{habit.promptMessage}</span>
            </div>
          )}

          {/* Refined 7-Day Visual Progress Bar */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-800/40">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-400">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400/80" />
                <span className="font-medium text-slate-300 text-xs">7-Day Consistency</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {stats7d.completedCount} of {stats7d.totalScheduled} days
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    stats7d.percentage >= 80
                      ? 'text-emerald-400'
                      : stats7d.percentage >= 50
                      ? 'text-indigo-400'
                      : stats7d.percentage > 0
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                >
                  {stats7d.percentage}%
                </span>
              </div>
            </div>

            {/* Slim, Minimalist Progress Track & Bar */}
            <div className="relative h-1.5 w-full rounded-full bg-slate-800/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  stats7d.percentage >= 80
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : stats7d.percentage >= 50
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                    : stats7d.percentage > 0
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-slate-700'
                }`}
                style={{ width: `${Math.max(stats7d.percentage, 0)}%` }}
              />
            </div>

            {/* Day-by-Day Mini Pips */}
            <div className="flex items-center justify-between mt-2 pt-0.5 px-0.5">
              {stats7d.days.map((d) => (
                <div key={d.dateKey} className="flex flex-col items-center gap-1">
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      d.isCompleted
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/40'
                        : d.isToday
                        ? 'bg-indigo-400 ring-2 ring-indigo-500/20'
                        : 'bg-slate-700/50'
                    }`}
                    title={`${d.dateKey}: ${d.isCompleted ? 'Completed' : 'Not completed'}`}
                  />
                  <span
                    className={`text-[9px] font-mono uppercase ${
                      d.isToday ? 'font-bold text-indigo-300' : 'text-slate-500'
                    }`}
                  >
                    {d.dayLetter}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Options Menu Button */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Habit options"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-slate-800 bg-[#101625] p-1.5 shadow-2xl z-20">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(habit);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
                Edit Habit
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(habit.id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Habit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
