'use client';

import React, { useState } from 'react';
import { Habit, HabitCategory, ItemPriority, Subtask } from '@/types/habit';
import { getTodayKey } from '@/lib/storage';
import { X, Bell, Plus, Trash2 } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  initialHabit?: Habit | null;
  defaultDate?: string;
}

const PRESET_IDEAS: Array<{
  title: string;
  category: HabitCategory;
  timeOfDay: string;
  prompt: string;
  estimatedMinutes: number;
}> = [
  {
    title: 'Morning 500ml Water & Sunlight',
    category: 'health',
    timeOfDay: '07:30',
    prompt: 'Did you hydrate and step into natural sunlight?',
    estimatedMinutes: 15,
  },
  {
    title: 'Deep Work Sprint (45m)',
    category: 'focus',
    timeOfDay: '09:30',
    prompt: 'Did you finish 45 minutes of uninterrupted deep focus?',
    estimatedMinutes: 45,
  },
  {
    title: 'Daily Movement / Workout',
    category: 'fitness',
    timeOfDay: '17:30',
    prompt: 'Have you completed your workout or daily movement goal?',
    estimatedMinutes: 30,
  },
  {
    title: 'Evening Reading (20 Pages)',
    category: 'mindset',
    timeOfDay: '21:00',
    prompt: 'Did you read 20 pages tonight before sleep?',
    estimatedMinutes: 25,
  },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
  defaultDate,
}) => {
  const [itemType, setItemType] = useState<'habit' | 'task'>(
    initialHabit?.itemType || 'habit'
  );
  const [title, setTitle] = useState(initialHabit?.title || '');
  const [description, setDescription] = useState(initialHabit?.description || '');
  const [category, setCategory] = useState<HabitCategory>(initialHabit?.category || 'focus');
  const [priority, setPriority] = useState<ItemPriority>(initialHabit?.priority || 'normal');
  const [timeOfDay, setTimeOfDay] = useState(initialHabit?.timeOfDay || '09:00');
  const [targetDate, setTargetDate] = useState(
    initialHabit?.targetDate || defaultDate || getTodayKey()
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(
    initialHabit?.estimatedMinutes || 25
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    initialHabit?.reminderEnabled ?? true
  );
  const [promptMessage, setPromptMessage] = useState(initialHabit?.promptMessage || '');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialHabit?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialHabit?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: initialHabit?.id || undefined,
      itemType,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      timeOfDay,
      targetDate: itemType === 'task' ? targetDate : undefined,
      estimatedMinutes,
      reminderEnabled,
      promptMessage: promptMessage.trim() || `Did you complete "${title.trim()}"?`,
      daysOfWeek,
      subtasks,
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

  const handleAddSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub-${Date.now()}-${prev.length}`, title: trimmed, completed: false },
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const applyPreset = (preset: (typeof PRESET_IDEAS)[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setTimeOfDay(preset.timeOfDay);
    setPromptMessage(preset.prompt);
    setEstimatedMinutes(preset.estimatedMinutes);
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0F1626] border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0C1220]">
          <h3 className="text-base font-bold text-white">
            {initialHabit?.id
              ? `Edit ${itemType === 'task' ? 'Daily Task' : 'Habit'}`
              : `Create ${itemType === 'task' ? 'Daily Task' : 'Recurring Habit'}`}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Type Switcher: Recurring Habit vs One-Off Daily Task */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setItemType('habit')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                itemType === 'habit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recurring Habit
            </button>
            <button
              type="button"
              onClick={() => setItemType('task')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                itemType === 'task'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              One-Off Daily Task
            </button>
          </div>

          {/* Starter templates when creating a new recurring habit */}
          {!initialHabit?.id && itemType === 'habit' && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IDEAS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 rounded-lg px-2.5 py-1.5 transition-colors text-left"
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
              {itemType === 'task' ? 'Task Title *' : 'Habit Title *'}
            </label>
            <input
              type="text"
              required
              placeholder={
                itemType === 'task'
                  ? 'e.g. Finalize Q4 Strategy Deck by 14:00'
                  : 'e.g. Morning 30m Focused Reading'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="focus">Deep Focus</option>
                <option value="health">Health</option>
                <option value="fitness">Fitness</option>
                <option value="mindset">Mindset</option>
                <option value="routine">Routine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'normal' as const, label: 'Standard' },
                  { id: 'medium' as const, label: 'Medium' },
                  { id: 'high' as const, label: 'High' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-colors whitespace-nowrap ${
                      priority === p.id
                        ? p.id === 'high'
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduled Time, Focus Duration, and Push Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Scheduled Time
              </label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2 text-sm text-white font-mono tabular-nums focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Focus Block
              </label>
              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2.5 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value={15}>15 min sprint</option>
                <option value={25}>25 min Pomodoro</option>
                <option value={45}>45 min deep work</option>
                <option value={60}>60 min block</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Push Alert
              </label>
              <button
                type="button"
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${
                  reminderEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  {reminderEnabled ? 'Active' : 'Muted'}
                </span>
              </button>
            </div>
          </div>

          {/* Schedule: Target Date (for Task) or Weekly Days (for Habit) */}
          {itemType === 'task' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Scheduled Days of Week
              </label>
              <div className="flex gap-1.5">
                {dayNames.map((name, idx) => {
                  const isSelected = daysOfWeek.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 min-h-[40px] py-2 text-xs font-semibold rounded-xl border transition-colors ${
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
          )}

          {/* Subtasks / Action Checkpoints */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Action Checkpoints / Subtasks (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a step and press Enter..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Step
              </button>
            </div>
            {subtasks.length > 0 && (
              <div className="mt-2 space-y-1">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300"
                  >
                    <span className="truncate">{sub.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      aria-label="Remove step"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accountability Check-In Question */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reminder Prompt Message
            </label>
            <input
              type="text"
              placeholder="e.g. Did you finish your 45-minute deep work sprint?"
              value={promptMessage}
              onChange={(e) => setPromptMessage(e.target.value)}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Implementation Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Context, links, or preparation cues..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-xl transition-all shadow-sm shadow-indigo-600/20"
            >
              {initialHabit?.id
                ? 'Save Changes'
                : itemType === 'task'
                ? 'Add Daily Task'
                : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
