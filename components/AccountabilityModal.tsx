'use client';

import React, { useState } from 'react';
import { Habit } from '@/types/habit';
import { playSuccessChime, playReminderTone } from '@/lib/sound';
import { triggerConfetti } from '@/lib/confetti';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';

interface AccountabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingHabits: Habit[];
  onCompleteHabit: (habitId: string) => void;
  onSaveReflection?: (mood: 'great' | 'steady' | 'struggled', note: string) => void;
}

export const AccountabilityModal: React.FC<AccountabilityModalProps> = ({
  isOpen,
  onClose,
  pendingHabits,
  onCompleteHabit,
  onSaveReflection,
}) => {
  const [selectedMood, setSelectedMood] = useState<'great' | 'steady' | 'struggled'>('great');
  const [reflectionNote, setReflectionNote] = useState('');
  const [snoozedIds, setSnoozedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const visibleHabits = pendingHabits.filter((h) => !snoozedIds.includes(h.id));

  const handleComplete = (habitId: string) => {
    onCompleteHabit(habitId);
    playSuccessChime();
    if (visibleHabits.length <= 1) {
      triggerConfetti();
    }
  };

  const handleSnooze = (habitId: string) => {
    setSnoozedIds([...snoozedIds, habitId]);
  };

  const handleSaveReflection = () => {
    if (onSaveReflection && reflectionNote.trim()) {
      onSaveReflection(selectedMood, reflectionNote.trim());
      setReflectionNote('');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0D1424] border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glowing Top Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Accountability Check-In
                <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Hold yourself to the standard you promised.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close check-in"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {visibleHabits.length > 0 ? (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Pending Habits Requiring Attention ({visibleHabits.length})
              </span>

              {visibleHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="rounded-2xl bg-[#111A2E] border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{habit.title}</h4>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        Target: {habit.timeOfDay}
                      </span>
                    </div>
                  </div>

                  {/* Accountability Prompt */}
                  <div className="rounded-xl bg-slate-900/90 border border-indigo-500/20 px-3.5 py-2 text-xs text-indigo-200 italic">
                    &ldquo;{habit.promptMessage}&rdquo;
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleComplete(habit.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition-all shadow-md shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Done Now
                    </button>

                    <button
                      onClick={() => handleSnooze(habit.id)}
                      className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium transition-colors"
                    >
                      Snooze 15m
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/20 p-6 text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">All Clear for Now!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You&apos;ve addressed every scheduled habit for this session. Maintain momentum!
              </p>
            </div>
          )}

          {/* Quick Accountability Reflection */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Daily Discipline Reflection
            </span>

            <div className="flex items-center gap-2">
              {[
                { id: 'great', label: 'Locked In', icon: Smile, color: 'text-emerald-400' },
                { id: 'steady', label: 'Steady', icon: Meh, color: 'text-amber-400' },
                { id: 'struggled', label: 'Tough Day', icon: Frown, color: 'text-rose-400' },
              ].map((m) => {
                const Icon = m.icon;
                const isSel = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-medium transition-all ${
                      isSel
                        ? 'bg-slate-800 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="Quick one-line reflection note (e.g. felt sharp after morning sunlight)..."
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0A0F1C] border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Accountability check completed
          </span>
          <button
            onClick={handleSaveReflection}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            Done Checking In
          </button>
        </div>
      </div>
    </div>
  );
};
