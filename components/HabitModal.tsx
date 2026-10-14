'use client';

import React, { useState, useEffect } from 'react';
import { Habit, HabitCategory } from '@/types/habit';
import { X, Clock, Bell, Sparkles } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  initialHabit?: Habit | null;
}

const PRESET_IDEAS: Array<{
  title: string;
  category: HabitCategory;
  timeOfDay: string;
  prompt: string;
}> = [
  { title: 'Morning 500ml Water & Sunlight', category: 'health', timeOfDay: '07:00', prompt: 'Did you hydrate and step into natural sunlight?' },
  { title: 'Deep Work Sprint (60m)', category: 'focus', timeOfDay: '09:30', prompt: 'Did you finish 60 minutes of uninterrupted work?' },
  { title: '10,000 Steps / Daily Walk', category: 'fitness', timeOfDay: '17:00', prompt: 'Have you hit your step goal or gone for a walk?' },
  { title: 'Read 20 Pages of a Book', category: 'mindset', timeOfDay: '21:00', prompt: 'Did you read 20 pages tonight before bed?' },
  { title: 'Plan Tomorrow Top 3 Tasks', category: 'routine', timeOfDay: '20:30', prompt: 'Are your 3 critical priorities written down for tomorrow?' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}) => {
  const [title, setTitle] = useState(initialHabit?.title || '');
  const [description, setDescription] = useState(initialHabit?.description || '');
  const [category, setCategory] = useState<HabitCategory>(initialHabit?.category || 'health');
  const [timeOfDay, setTimeOfDay] = useState(initialHabit?.timeOfDay || '08:00');
  const [reminderEnabled, setReminderEnabled] = useState(initialHabit?.reminderEnabled ?? true);
  const [promptMessage, setPromptMessage] = useState(initialHabit?.promptMessage || '');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialHabit?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: initialHabit ? initialHabit.id : undefined,
      title: title.trim(),
      description: description.trim(),
      category,
      timeOfDay,
      reminderEnabled,
      promptMessage: promptMessage.trim() || `Did you complete: "${title.trim()}"?`,
      daysOfWeek,
    });
    onClose();
  };

  const toggleDay = (dayIndex: number) => {
    if (daysOfWeek.includes(dayIndex)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== dayIndex));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, dayIndex].sort());
    }
  };

  const applyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setTimeOfDay(preset.timeOfDay);
    setPromptMessage(preset.prompt);
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0F1626] border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0C1220]">
          <h3 className="text-base font-bold text-white">
            {initialHabit ? 'Edit Daily Habit' : 'Create New Habit'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Quick Presets if creating new */}
          {!initialHabit && (
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Quick Habit Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IDEAS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-[11px] font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 rounded-lg px-2.5 py-1.5 transition-colors text-left"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Morning 20m Focused Reading"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category Pillar
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'health', label: 'Health' },
                { id: 'focus', label: 'Focus' },
                { id: 'fitness', label: 'Fitness' },
                { id: 'mindset', label: 'Mindset' },
                { id: 'routine', label: 'Routine' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as HabitCategory)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                    category === cat.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Time & Reminder Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Scheduled Reminder Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Push Notification
              </label>
              <button
                type="button"
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors ${
                  reminderEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <Bell className="h-4 w-4" />
                  {reminderEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="text-[11px] font-mono">
                  {reminderEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Accountability Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Accountability Check-In Question
            </label>
            <input
              type="text"
              placeholder="e.g. Did you complete your 20m reading session?"
              value={promptMessage}
              onChange={(e) => setPromptMessage(e.target.value)}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              This prompt will be delivered in push notifications and check-in popups.
            </span>
          </div>

          {/* Active Days */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Weekly Frequency
            </label>
            <div className="flex gap-1.5">
              {dayNames.map((name, idx) => {
                const isSelected = daysOfWeek.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Notes / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rationale / Implementation Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Why this habit matters, rules, cue, or environment prep..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
            >
              {initialHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
