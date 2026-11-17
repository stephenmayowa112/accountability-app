'use client';

import React, { useState } from 'react';
import { formatDateKey, getTodayKey, isHabitDueOnDate } from '@/lib/storage';
import { HabitLogsMap, Habit } from '@/types/habit';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [weekOffset, setWeekOffset] = useState(0);

  const days = React.useMemo(() => {
    const list: Array<{ dateKey: string; date: Date; isToday: boolean; isFuture: boolean }> = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    for (let offset = -4; offset <= 2; offset++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);
      const key = formatDateKey(d);
      list.push({
        dateKey: key,
        date: d,
        isToday: key === todayKey,
        isFuture: key > todayKey,
      });
    }
    return list;
  }, [todayKey, weekOffset]);

  const activeHabits = habits.filter((h) => !h.archived);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0D121F]/90 border border-slate-800/70">
      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-100 block">
              {selectedDate === todayKey ? "Today's Schedule" : 'Selected Date'}
            </span>
            <span className="text-xs text-slate-400 block tabular-nums">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {(selectedDate !== todayKey || weekOffset !== 0) && (
          <button
            onClick={() => {
              setWeekOffset(0);
              onSelectDate(todayKey);
            }}
            className="sm:hidden text-xs font-medium text-indigo-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 whitespace-nowrap"
          >
            Jump to Today
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
        <button
          onClick={() => setWeekOffset((prev) => prev - 1)}
          aria-label="Previous week"
          className="flex min-h-[40px] min-w-[36px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 touch-pan-x overscroll-x-contain">
          {days.map((item) => {
            const isSelected = item.dateKey === selectedDate;
            const dayLog = logs[item.dateKey];
            const completedIds = dayLog?.completedHabitIds || [];
            const skippedIds = dayLog?.skippedHabitIds || [];
            const scheduledHabits = activeHabits.filter(
              (h) => isHabitDueOnDate(h, item.dateKey, logs) && !skippedIds.includes(h.id)
            );
            const completedScheduledCount = completedIds.filter((id) =>
              scheduledHabits.some((h) => h.id === id)
            ).length;
            const isAllCompleted =
              scheduledHabits.length > 0 && completedScheduledCount >= scheduledHabits.length;

            const weekdayShort = item.date.toLocaleDateString('en-US', { weekday: 'narrow' });
            const dayNum = item.date.getDate();

            return (
              <button
                key={item.dateKey}
                onClick={() => onSelectDate(item.dateKey)}
                className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] py-1.5 px-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : item.isToday
                    ? 'bg-slate-800/90 text-slate-100 border border-indigo-500/40'
                    : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-slate-800/40'
                }`}
              >
                <span className="text-[10px] font-semibold opacity-80">
                  {weekdayShort}
                </span>
                <span className="text-sm font-semibold mt-0.5 tabular-nums">
                  {dayNum}
                </span>

                <div className="mt-1 flex items-center justify-center h-1.5 w-full">
                  {isAllCompleted ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-400'
                      }`}
                    />
                  ) : completedIds.length > 0 ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-cyan-200' : 'bg-cyan-400'
                      }`}
                    />
                  ) : scheduledHabits.length > 0 ? (
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-transparent" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setWeekOffset((prev) => prev + 1)}
          aria-label="Next week"
          className="flex min-h-[40px] min-w-[36px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {(selectedDate !== todayKey || weekOffset !== 0) && (
          <button
            onClick={() => {
              setWeekOffset(0);
              onSelectDate(todayKey);
            }}
            className="hidden sm:inline-flex text-xs font-medium text-indigo-400 hover:text-indigo-300 ml-1 px-2.5 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 whitespace-nowrap"
          >
            Today
          </button>
        )}
      </div>
    </div>
  );
};
