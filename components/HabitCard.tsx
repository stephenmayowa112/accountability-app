'use client';

import React from 'react';
import { Habit, HabitCategory } from '@/types/habit';
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
} from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: (habitId: string) => void;
  streak: number;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

const CATEGORY_CONFIG: Record<
  HabitCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string }
> = {
  health: { label: 'Health', icon: Heart, colorClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10 border-cyan-500/20' },
  focus: { label: 'Deep Focus', icon: Target, colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/20' },
  mindset: { label: 'Mindset', icon: Brain, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/20' },
  fitness: { label: 'Fitness', icon: Dumbbell, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/20' },
  routine: { label: 'Daily Routine', icon: CalendarCheck, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10 border-purple-500/20' },
};

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  onToggle,
  streak,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const categoryMeta = CATEGORY_CONFIG[habit.category] || CATEGORY_CONFIG.routine;
  const CategoryIcon = categoryMeta.icon;

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

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 ${
        isCompleted
          ? 'bg-[#0B101E]/80 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
          : 'bg-[#0E1526] border-slate-800/80 hover:border-slate-700/90 shadow-md'
      }`}
    >
      <div className="p-4 sm:p-5 flex items-start gap-4">
        {/* Tactile Checkbox Button (min 44px x 44px hitbox) */}
        <button
          onClick={() => onToggle(habit.id)}
          aria-label={`Mark ${habit.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
          className={`flex-shrink-0 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all active:scale-90 ${
            isCompleted
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'border-2 border-slate-700 bg-slate-900/80 hover:border-indigo-400 hover:bg-slate-800/60 text-transparent'
          }`}
        >
          <Check className={`h-6 w-6 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-75'}`} />
        </button>

        {/* Habit Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1">
            <span className={`inline-flex items-center gap-1 font-medium ${categoryMeta.colorClass}`}>
              <CategoryIcon className="h-3 w-3" />
              {categoryMeta.label}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 text-slate-400 tabular-nums">
              <Clock className="h-3 w-3 text-slate-500" />
              {habit.timeOfDay}
            </span>
            {habit.reminderEnabled && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-indigo-400">
                  <Bell className="h-3 w-3" />
                  Reminder
                </span>
              </>
            )}
            {streak > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-mono font-medium tabular-nums">
                  <Flame className="h-3 w-3" />
                  {streak}d streak
                </span>
              </>
            )}
          </div>

          <h3
            className={`text-base font-semibold transition-colors ${
              isCompleted ? 'text-slate-300 line-through decoration-slate-600 decoration-2' : 'text-white'
            }`}
          >
            {habit.title}
          </h3>

          {habit.description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {habit.description}
            </p>
          )}

          {/* Accountability Prompt Bubble */}
          {habit.promptMessage && (
            <div className="mt-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 tracking-wider shrink-0">
                Prompt
              </span>
              <span className="italic truncate">{habit.promptMessage}</span>
            </div>
          )}
        </div>

        {/* Options Menu Button (min 44px x 44px touch area) */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Habit options"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-slate-800 bg-[#12192c] p-1.5 shadow-2xl z-20">
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
