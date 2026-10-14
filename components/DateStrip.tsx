'use client';

import React from 'react';
import { formatDateKey, getTodayKey } from '@/lib/storage';
import { HabitLogsMap, Habit } from '@/types/habit';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateStripProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  logs: HabitLogsMap;
  habits: Habit[];
}

export const DateStrip: React.FC<DateStripProps> = ({
  selectedDate,
  onSelectDate,
  logs,
  habits,
}) => {
  const todayKey = getTodayKey();

  // Generate 7 days centered on today (3 days before, today, 3 days after)
  const days = React.useMemo(() => {
    const list: Array<{ dateKey: string; date: Date; isToday: boolean; isFuture: boolean }> = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (let offset = -5; offset <= 1; offset++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);
      const key = formatDateKey(d);
      list.push({
        dateKey: key,
        date: d,
        isToday: key === todayKey,
        isFuture: offset > 0,
      });
    }
    return list;
  }, [todayKey]);

  const activeHabits = habits.filter((h) => !h.archived);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-300">
            {selectedDate === todayKey ? "Today's Schedule" : selectedDate}
          </span>
          <span className="text-[11px] text-slate-500 block">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        {days.map((item) => {
          const isSelected = item.dateKey === selectedDate;
          const dayLog = logs[item.dateKey];
          const completedCount = dayLog ? dayLog.completedHabitIds?.length || 0 : 0;
          const dayOfWeek = item.date.getDay();
          const scheduledHabits = activeHabits.filter((h) => h.daysOfWeek.includes(dayOfWeek));
          const isAllCompleted =
            scheduledHabits.length > 0 && completedCount >= scheduledHabits.length;

          const weekdayShort = item.date.toLocaleDateString('en-US', { weekday: 'narrow' });
          const dayNum = item.date.getDate();

          return (
            <button
              key={item.dateKey}
              onClick={() => onSelectDate(item.dateKey)}
              className={`flex flex-col items-center justify-center min-w-[48px] py-2 px-2.5 rounded-xl transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                  : item.isToday
                  ? 'bg-slate-800 text-slate-200 border border-indigo-500/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/50'
              }`}
            >
              <span className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
                {weekdayShort}
              </span>
              <span className="text-sm font-bold mt-0.5 tabular-nums">
                {dayNum}
              </span>

              {/* Completion status dot */}
              <div className="mt-1 flex items-center justify-center h-1.5 w-full">
                {isAllCompleted ? (
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />
                ) : completedCount > 0 ? (
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-cyan-200' : 'bg-cyan-400'}`} />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-slate-700 opacity-40" />
                )}
              </div>
            </button>
          );
        })}

        {selectedDate !== todayKey && (
          <button
            onClick={() => onSelectDate(todayKey)}
            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 ml-2 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 whitespace-nowrap"
          >
            Jump to Today
          </button>
        )}
      </div>
    </div>
  );
};
