'use client';

import React, { useState } from 'react';
import { HabitLogsMap } from '@/types/habit';
import { formatDateKey } from '@/lib/storage';
import { Calendar, Info } from 'lucide-react';

interface HeatmapViewProps {
  logs: HabitLogsMap;
  onSelectDate: (dateKey: string) => void;
  selectedDate: string;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  logs,
  onSelectDate,
  selectedDate,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    dateKey: string;
    count: number;
    formatted: string;
    x: number;
    y: number;
  } | null>(null);

  // Generate 52 weeks of dates leading up to today
  const { weeks, monthLabels } = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End on the Saturday of the current week to have a full block
    const end = new Date(today);
    const dayOfWeek = end.getDay(); // 0 is Sunday, 6 is Saturday
    end.setDate(end.getDate() + (6 - dayOfWeek));

    // 52 weeks = 364 days total
    const start = new Date(end);
    start.setDate(end.getDate() - 52 * 7 + 1);

    const resultWeeks: Array<Array<{ dateKey: string; date: Date; count: number; inFuture: boolean }>> = [];
    const months: Array<{ label: string; weekIndex: number }> = [];

    let currentWeek: Array<{ dateKey: string; date: Date; count: number; inFuture: boolean }> = [];
    let lastMonth = -1;

    const curr = new Date(start);
    let weekIndex = 0;

    while (curr <= end) {
      const key = formatDateKey(curr);
      const inFuture = curr > today;
      const dayLog = logs[key];
      const count = dayLog ? dayLog.completedHabitIds?.length || 0 : 0;

      // Track month change for labels
      if (curr.getDate() <= 7 && curr.getMonth() !== lastMonth) {
        lastMonth = curr.getMonth();
        months.push({
          label: curr.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex,
        });
      }

      currentWeek.push({
        dateKey: key,
        date: new Date(curr),
        count,
        inFuture,
      });

      if (currentWeek.length === 7) {
        resultWeeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      resultWeeks.push(currentWeek);
    }

    return { weeks: resultWeeks, monthLabels: months };
  }, [logs]);

  const getColorClass = (count: number, isFuture: boolean, isSelected: boolean) => {
    if (isSelected) {
      return 'ring-2 ring-indigo-400 bg-indigo-500 scale-125 z-10';
    }
    if (isFuture) {
      return 'bg-slate-900/40 border border-slate-800/40 opacity-40';
    }
    if (count === 0) return 'bg-[#121829] border border-slate-800/60 hover:border-slate-600';
    if (count === 1) return 'bg-emerald-950/80 border border-emerald-800/60 hover:border-emerald-600';
    if (count === 2) return 'bg-emerald-800/90 border border-emerald-700/80 hover:border-emerald-500';
    if (count === 3) return 'bg-emerald-600 border border-emerald-500 hover:border-emerald-400';
    return 'bg-emerald-400 border border-emerald-300 hover:scale-110 shadow-sm shadow-emerald-400/30';
  };

  return (
    <div className="rounded-2xl bg-[#0C1220] border border-slate-800/80 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Annual Habit Activity Matrix
            </h3>
            <span className="text-xs text-slate-400 block">
              365-day consistency visualization · Click any cell to inspect that day
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 self-end sm:self-auto">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#121829] border border-slate-800" />
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-950 border border-emerald-800" />
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-800 border border-emerald-700" />
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 border border-emerald-500" />
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 border border-emerald-300" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Matrix Container with Horizontal Scroll */}
      <div className="overflow-x-auto pb-3">
        <div className="min-w-[760px]">
          {/* Month labels row */}
          <div className="flex text-[10px] text-slate-400 mb-2 pl-7 font-mono">
            {monthLabels.map((m, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  left: `${m.weekIndex * 14}px`,
                  width: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between text-[9px] text-slate-500 font-mono py-0.5 select-none w-5">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const isSelected = day.dateKey === selectedDate;
                    return (
                      <button
                        key={day.dateKey}
                        onClick={() => onSelectDate(day.dateKey)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            dateKey: day.dateKey,
                            count: day.count,
                            formatted: day.date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }),
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-3 w-3 rounded-[3px] transition-all cursor-pointer ${getColorClass(
                          day.count,
                          day.inFuture,
                          isSelected
                        )}`}
                        aria-label={`${day.count} habits on ${day.dateKey}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white text-xs shadow-2xl backdrop-blur-md"
          style={{ left: `${hoveredDay.x}px`, top: `${hoveredDay.y}px` }}
        >
          <div className="font-semibold text-emerald-400">
            {hoveredDay.count} habit{hoveredDay.count === 1 ? '' : 's'} completed
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{hoveredDay.formatted}</div>
        </div>
      )}
    </div>
  );
};
