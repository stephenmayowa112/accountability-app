'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Habit, HabitCategory, HabitLogsMap } from '@/types/habit';
import { getHabit7DayStats } from '@/lib/storage';
import {
  Check,
  Clock,
  Flame,
  MoreVertical,
  Edit2,
  Trash2,
  Timer,
  PauseCircle,
  RotateCcw,
} from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  isSkipped?: boolean;
  isOverdue?: boolean;
  onToggle: (habitId: string) => void;
  onToggleSkip?: (habitId: string) => void;
  onToggleSubtask?: (habitId: string, subtaskId: string) => void;
  onStartFocus?: (habit: Habit) => void;
  streak: number;
  logs: HabitLogsMap;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  compactView?: boolean;
}

const CATEGORY_LABELS: Record<HabitCategory, { label: string; colorClass: string }> = {
  health: { label: 'Health', colorClass: 'text-cyan-400' },
  focus: { label: 'Deep Focus', colorClass: 'text-indigo-400' },
  mindset: { label: 'Mindset', colorClass: 'text-amber-400' },
  fitness: { label: 'Fitness', colorClass: 'text-emerald-400' },
  routine: { label: 'Routine', colorClass: 'text-purple-400' },
};

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  isSkipped = false,
  isOverdue = false,
  onToggle,
  onToggleSkip,
  onToggleSubtask,
  onStartFocus,
  streak,
  logs,
  onEdit,
  onDelete,
  compactView = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const categoryMeta = CATEGORY_LABELS[habit.category] || CATEGORY_LABELS.routine;
  const stats7d = useMemo(() => getHabit7DayStats(habit, logs), [habit, logs]);
  const isOneOffTask = habit.itemType === 'task';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setConfirmDelete(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Compact Row View
  if (compactView) {
    return (
      <div
        className={`group relative rounded-xl border transition-colors duration-150 ${
          isCompleted
            ? 'bg-[#0A0E17]/70 border-emerald-500/20'
            : isSkipped
            ? 'bg-[#0A0E17]/50 border-slate-800/40 opacity-60'
            : isOverdue
            ? 'bg-[#0D121F] border-rose-500/40'
            : 'bg-[#0D121F]/90 border-slate-800/70 hover:border-slate-700'
        }`}
      >
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => onToggle(habit.id)}
              aria-label={`Mark ${habit.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
              className={`flex-shrink-0 min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                isCompleted
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border border-slate-700 bg-slate-900/60 hover:border-indigo-400 text-transparent'
              }`}
            >
              <Check className={`h-4 w-4 stroke-[3] ${isCompleted ? 'scale-100' : 'scale-75'}`} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  className={`text-sm font-medium truncate ${
                    isCompleted
                      ? 'text-slate-400 line-through decoration-slate-600'
                      : isSkipped
                      ? 'text-slate-500 italic'
                      : 'text-slate-100'
                  }`}
                >
                  {habit.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 tabular-nums">
                <span className={categoryMeta.colorClass}>{categoryMeta.label}</span>
                <span aria-hidden="true">·</span>
                <span>{habit.timeOfDay}</span>
                {isOneOffTask && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">Task</span>
                  </>
                )}
                {isOverdue && !isCompleted && !isSkipped && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-400 font-medium">Overdue</span>
                  </>
                )}
                {isSkipped && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">Skipped today</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onStartFocus && !isCompleted && !isSkipped && (
              <button
                onClick={() => onStartFocus(habit)}
                title="Start Focus Timer for this item"
                className="hidden sm:inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                <Timer className="h-3.5 w-3.5 text-indigo-400" />
                <span>Focus</span>
              </button>
            )}

            {streak > 0 && !isOneOffTask && (
              <span className="hidden sm:flex items-center gap-1 text-xs font-mono font-medium text-amber-400 tabular-nums">
                <Flame className="h-3.5 w-3.5" />
                {streak}d
              </span>
            )}

            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => {
                  setShowMenu(!showMenu);
                  setConfirmDelete(false);
                }}
                aria-label="Item options"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-800 bg-[#101625] p-1.5 shadow-xl z-20 space-y-0.5">
                  {onStartFocus && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onStartFocus(habit);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      <Timer className="h-3.5 w-3.5 text-indigo-400" />
                      Start Focus Session
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(habit);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                    Edit Details
                  </button>
                  {onToggleSkip && !isCompleted && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onToggleSkip(habit.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      {isSkipped ? (
                        <>
                          <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                          Restore for Today
                        </>
                      ) : (
                        <>
                          <PauseCircle className="h-3.5 w-3.5 text-amber-400" />
                          Skip Today (Rest)
                        </>
                      )}
                    </button>
                  )}
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setConfirmDelete(false);
                        onDelete(habit.id);
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors whitespace-nowrap"
                    >
                      Confirm Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Detailed View
  return (
    <div
      className={`group relative rounded-2xl border transition-colors duration-150 ${
        isCompleted
          ? 'bg-[#090D16]/80 border-emerald-500/20'
          : isSkipped
          ? 'bg-[#090D16]/50 border-slate-800/40 opacity-65'
          : isOverdue
          ? 'bg-[#0D121F] border-rose-500/40'
          : 'bg-[#0D121F]/90 border-slate-800/70 hover:border-slate-700'
      }`}
    >
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        {/* 44x44px Tactile Checkbox Button */}
        <button
          onClick={() => onToggle(habit.id)}
          aria-label={`Mark ${habit.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
          className={`flex-shrink-0 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            isCompleted
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
              : 'border border-slate-700/80 bg-slate-900/60 hover:border-indigo-400 hover:bg-slate-800/60 text-transparent'
          }`}
        >
          <Check className={`h-5 w-5 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-75'}`} />
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1 tabular-nums">
            <span className={`font-medium ${categoryMeta.colorClass}`}>
              {categoryMeta.label}
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
              <Clock className="h-3 w-3 text-slate-500" />
              {habit.timeOfDay}
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>{isOneOffTask ? 'One-Off Task' : 'Recurring Habit'}</span>

            {habit.priority === 'high' && (
              <>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="text-amber-400 font-medium">High Priority</span>
              </>
            )}

            {isOverdue && !isCompleted && !isSkipped && (
              <>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="text-rose-400 font-semibold">Overdue</span>
              </>
            )}

            {isSkipped && (
              <>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="text-slate-400">Rest Day (Skipped)</span>
              </>
            )}

            {streak > 0 && !isOneOffTask && (
              <>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-mono font-medium">
                  <Flame className="h-3 w-3" />
                  {streak}d streak
                </span>
              </>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={`text-base font-semibold transition-colors ${
                  isCompleted
                    ? 'text-slate-400 line-through decoration-slate-600 decoration-2'
                    : isSkipped
                    ? 'text-slate-500 italic'
                    : 'text-slate-100'
                }`}
              >
                {habit.title}
              </h3>

              {habit.description && (
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {habit.description}
                </p>
              )}

              {habit.promptMessage && !isCompleted && !isSkipped && (
                <p className="mt-1.5 text-xs text-slate-400">
                  <span className="text-slate-500">Check-in prompt:</span>{' '}
                  <span className="text-slate-300">{habit.promptMessage}</span>
                </p>
              )}
            </div>

            {onStartFocus && !isCompleted && !isSkipped && (
              <button
                onClick={() => onStartFocus(habit)}
                className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 hover:bg-slate-800/80 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <Timer className="h-3.5 w-3.5 text-indigo-400" />
                <span>
                  {habit.estimatedMinutes ? `Focus (${habit.estimatedMinutes}m)` : 'Start Focus'}
                </span>
              </button>
            )}
          </div>

          {/* Subtasks / Action Steps if present */}
          {habit.subtasks && habit.subtasks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/50 space-y-1.5">
              {habit.subtasks.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onToggleSubtask && onToggleSubtask(habit.id, sub.id)}
                  className="flex items-center gap-2.5 w-full text-left py-1 text-xs group/sub"
                >
                  <span
                    className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                      sub.completed
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'border-slate-700 bg-slate-900 group-hover/sub:border-slate-500 text-transparent'
                    }`}
                  >
                    <Check className="h-3 w-3 stroke-[2.5]" />
                  </span>
                  <span
                    className={
                      sub.completed
                        ? 'text-slate-500 line-through'
                        : 'text-slate-300 group-hover/sub:text-white'
                    }
                  >
                    {sub.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 7-Day Consistency Bar for Recurring Habits */}
          {!isOneOffTask && (
            <div className="mt-3.5 pt-2.5 border-t border-slate-800/50">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">7-day consistency</span>
                <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                  <span className="text-slate-400">
                    {stats7d.completedCount}/{stats7d.totalScheduled} days
                  </span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span
                    className={`font-semibold ${
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

              <div className="relative h-1.5 w-full rounded-full bg-slate-800/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats7d.percentage >= 80
                      ? 'bg-emerald-500'
                      : stats7d.percentage >= 50
                      ? 'bg-indigo-500'
                      : stats7d.percentage > 0
                      ? 'bg-amber-500'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${Math.max(stats7d.percentage, 0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 pt-0.5 px-0.5">
                {stats7d.days.map((d) => (
                  <div key={d.dateKey} className="flex flex-col items-center gap-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        d.isCompleted
                          ? 'bg-emerald-400'
                          : d.isSkipped
                          ? 'bg-amber-400/50'
                          : d.isToday
                          ? 'bg-indigo-400'
                          : 'bg-slate-700/50'
                      }`}
                      title={`${d.dateKey}: ${
                        d.isCompleted
                          ? 'Completed'
                          : d.isSkipped
                          ? 'Skipped (Rest Day)'
                          : 'Not completed'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-mono ${
                        d.isToday ? 'font-bold text-indigo-300' : 'text-slate-500'
                      }`}
                    >
                      {d.dayLetter}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Options Menu Button */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => {
              setShowMenu(!showMenu);
              setConfirmDelete(false);
            }}
            aria-label="Item options"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-800 bg-[#101625] p-1.5 shadow-2xl z-20 space-y-0.5">
              {onStartFocus && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onStartFocus(habit);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Timer className="h-3.5 w-3.5 text-indigo-400" />
                  Start Focus Timer
                </button>
              )}
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(habit);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                Edit Details
              </button>
              {onToggleSkip && !isCompleted && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleSkip(habit.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  {isSkipped ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                      Restore for Today
                    </>
                  ) : (
                    <>
                      <PauseCircle className="h-3.5 w-3.5 text-amber-400" />
                      Skip Today (Rest)
                    </>
                  )}
                </button>
              )}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors whitespace-nowrap"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Item
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setConfirmDelete(false);
                    onDelete(habit.id);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors whitespace-nowrap"
                >
                  Confirm Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
