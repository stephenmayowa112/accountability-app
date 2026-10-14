'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Habit,
  HabitCategory,
  HabitLogsMap,
} from '@/types/habit';
import {
  loadHabitsFromStorage,
  saveHabitsToStorage,
  loadLogsFromStorage,
  saveLogsToStorage,
  getTodayKey,
  calculateStreakStats,
  getHabitStreak,
  DEFAULT_HABITS,
  generateStarterLogs,
} from '@/lib/storage';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendWebNotification,
  registerServiceWorker,
  NotificationPermissionState,
} from '@/lib/notifications';
import {
  getSoundMuted,
  setSoundMuted as updateSoundMuted,
  playSuccessChime,
  playCelebrationChime,
  playReminderTone,
} from '@/lib/sound';
import { triggerConfetti } from '@/lib/confetti';
import { Navbar } from '@/components/Navbar';
import { DateStrip } from '@/components/DateStrip';
import { ProgressOverview } from '@/components/ProgressOverview';
import { HabitCard } from '@/components/HabitCard';
import { HeatmapView } from '@/components/HeatmapView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { MilestonesView } from '@/components/MilestonesView';
import { HabitModal } from '@/components/HabitModal';
import { AccountabilityModal } from '@/components/AccountabilityModal';
import { ReminderSettingsModal } from '@/components/ReminderSettingsModal';
import {
  Plus,
  Flame,
  CheckCircle2,
  Calendar,
  BarChart3,
  Trophy,
  Bell,
  Sparkles,
  Filter,
} from 'lucide-react';

export default function FocusPulseApp() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [logs, setLogs] = useState<HabitLogsMap>({});
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [activeTab, setActiveTab] = useState<'habits' | 'analytics' | 'milestones' | 'reminders'>('habits');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [soundMuted, setSoundMutedState] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>('default');

  // Modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Track already fired notifications for current session
  const [lastNotifiedMap, setLastNotifiedMap] = useState<Record<string, number>>({});

  // Initialize from storage on mount
  useEffect(() => {
    const loadedHabits = loadHabitsFromStorage();
    const loadedLogs = loadLogsFromStorage();
    const muted = getSoundMuted();
    const perm = getNotificationPermission();

    const handle = requestAnimationFrame(() => {
      setMounted(true);
      setHabits(loadedHabits);
      setLogs(loadedLogs);
      setSoundMutedState(muted);
      setNotificationPermission(perm);
    });

    // Register PWA service worker
    registerServiceWorker();

    return () => cancelAnimationFrame(handle);
  }, []);

  const todayKey = getTodayKey();
  const isToday = selectedDate === todayKey;

  // Recalculate streak metrics
  const stats = useMemo(() => {
    return calculateStreakStats(habits, logs);
  }, [habits, logs]);

  // Current day scheduled habits
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const selectedDayOfWeek = selectedDateObj.getDay();

  const dueHabits = useMemo(() => {
    return habits.filter((h) => !h.archived && h.daysOfWeek.includes(selectedDayOfWeek));
  }, [habits, selectedDayOfWeek]);

  const filteredDueHabits = useMemo(() => {
    if (selectedCategory === 'all') return dueHabits;
    return dueHabits.filter((h) => h.category === selectedCategory);
  }, [dueHabits, selectedCategory]);

  const completedTodayIds = useMemo(() => {
    return logs[selectedDate]?.completedHabitIds || [];
  }, [logs, selectedDate]);

  const pendingHabitsForCheckIn = useMemo(() => {
    const todayLog = logs[todayKey]?.completedHabitIds || [];
    const todayDue = habits.filter(
      (h) => !h.archived && h.daysOfWeek.includes(new Date().getDay())
    );
    return todayDue.filter((h) => !todayLog.includes(h.id));
  }, [habits, logs, todayKey]);

  // Toggle habit completion
  const handleToggleHabit = useCallback(
    (habitId: string) => {
      setLogs((prev) => {
        const currentLog = prev[selectedDate] || { completedHabitIds: [] };
        const exists = currentLog.completedHabitIds.includes(habitId);
        const updatedIds = exists
          ? currentLog.completedHabitIds.filter((id) => id !== habitId)
          : [...currentLog.completedHabitIds, habitId];

        const nextLogs: HabitLogsMap = {
          ...prev,
          [selectedDate]: {
            ...currentLog,
            completedHabitIds: updatedIds,
          },
        };

        saveLogsToStorage(nextLogs);

        // Feedback sound and celebration
        if (!exists) {
          playSuccessChime();
          // Check if this action completed all scheduled habits for this day
          if (dueHabits.length > 0 && updatedIds.length >= dueHabits.length) {
            triggerConfetti();
            playCelebrationChime();
          }
        }

        return nextLogs;
      });
    },
    [selectedDate, dueHabits.length]
  );

  // Save new or edited habit
  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (habitData.id) {
      // Editing existing habit
      setHabits((prev) => {
        const next = prev.map((h) => (h.id === habitData.id ? ({ ...h, ...habitData } as Habit) : h));
        saveHabitsToStorage(next);
        return next;
      });
    } else {
      // Creating new habit
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        title: habitData.title || 'Untitled Habit',
        description: habitData.description || '',
        category: (habitData.category as HabitCategory) || 'health',
        timeOfDay: habitData.timeOfDay || '08:00',
        reminderEnabled: habitData.reminderEnabled ?? true,
        promptMessage: habitData.promptMessage || `Did you finish: "${habitData.title}"?`,
        daysOfWeek: habitData.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        createdAt: new Date().toISOString(),
        color: '#6366F1',
      };
      setHabits((prev) => {
        const next = [...prev, newHabit];
        saveHabitsToStorage(next);
        return next;
      });
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      setHabits((prev) => {
        const next = prev.filter((h) => h.id !== habitId);
        saveHabitsToStorage(next);
        return next;
      });
    }
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  };

  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMutedState(next);
    updateSoundMuted(next);
  };

  const handleRequestNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
  };

  const handleSaveReflection = (mood: 'great' | 'steady' | 'struggled', note: string) => {
    setLogs((prev) => {
      const currentLog = prev[todayKey] || { completedHabitIds: [] };
      const nextLogs: HabitLogsMap = {
        ...prev,
        [todayKey]: {
          ...currentLog,
          reflectionMood: mood,
          note,
        },
      };
      saveLogsToStorage(nextLogs);
      return nextLogs;
    });
  };

  const handleImportData = (newHabits: Habit[], newLogs: HabitLogsMap) => {
    setHabits(newHabits);
    setLogs(newLogs);
    saveHabitsToStorage(newHabits);
    saveLogsToStorage(newLogs);
  };

  const handleResetData = () => {
    const starterHabits = DEFAULT_HABITS;
    const starterLogs = generateStarterLogs();
    setHabits(starterHabits);
    setLogs(starterLogs);
    saveHabitsToStorage(starterHabits);
    saveLogsToStorage(starterLogs);
  };

  // Background interval check for scheduled habit reminders (every 30 seconds)
  useEffect(() => {
    if (!mounted) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const currentDay = now.getDay();
      const currentKey = getTodayKey();
      const todayDone = logs[currentKey]?.completedHabitIds || [];

      habits.forEach((habit) => {
        if (!habit.archived && habit.reminderEnabled && habit.daysOfWeek.includes(currentDay)) {
          // If scheduled for current minute and not yet completed today
          if (habit.timeOfDay === currentTimeStr && !todayDone.includes(habit.id)) {
            const lastNotified = lastNotifiedMap[habit.id] || 0;
            // Cooldown of at least 5 minutes before re-notifying for the same habit
            if (Date.now() - lastNotified > 5 * 60 * 1000) {
              setLastNotifiedMap((prev) => ({ ...prev, [habit.id]: Date.now() }));
              playReminderTone();
              sendWebNotification(`FocusPulse Reminder: ${habit.title}`, {
                body: habit.promptMessage || `Time to complete: ${habit.title}`,
                tag: `habit-${habit.id}`,
              });
            }
          }
        }
      });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [mounted, habits, logs, lastNotifiedMap]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-slate-500 font-mono text-sm">
        Initializing FocusPulse...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070A10] pb-24 lg:pb-12">
      {/* 1. Header / Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewHabit={handleOpenNew}
        onOpenCheckIn={() => setIsCheckInModalOpen(true)}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        notificationPermission={notificationPermission}
        onRequestNotifications={() => setIsSettingsModalOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F162A] via-[#0B101E] to-[#070A10] border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <Flame className="h-3.5 w-3.5" />
                <span>{stats.currentStreak}-Day Active Discipline Streak</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-balance">
                Relentless Consistency, Daily Accountability.
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                Stay on track with time-targeted push notifications, interactive check-ins, and clear progress dashboards built for daily momentum.
              </p>
            </div>

            {/* Quick Hero Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4" />
                Accountability Check-In
              </button>
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold hover:bg-slate-800 transition-all whitespace-nowrap"
              >
                <Plus className="h-4 w-4 text-indigo-400" />
                New Daily Habit
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Content Views */}
        {activeTab === 'habits' && (
          <div className="space-y-6">
            {/* Top Stat Overview */}
            <ProgressOverview
              completedCount={completedTodayIds.length}
              totalDue={dueHabits.length}
              stats={stats}
              onOpenCheckIn={() => setIsCheckInModalOpen(true)}
              selectedDateIsToday={isToday}
            />

            {/* Date Strip Navigation */}
            <DateStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              logs={logs}
              habits={habits}
            />

            {/* Category Filter Bar */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800/80">
                {[
                  { id: 'all', label: 'All Habits' },
                  { id: 'health', label: 'Health' },
                  { id: 'focus', label: 'Deep Focus' },
                  { id: 'fitness', label: 'Fitness' },
                  { id: 'mindset', label: 'Mindset' },
                  { id: 'routine', label: 'Routine' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                {filteredDueHabits.length} scheduled for this day
              </span>
            </div>

            {/* Habit Cards Grid */}
            <div className="space-y-3">
              {filteredDueHabits.length > 0 ? (
                filteredDueHabits.map((habit) => {
                  const isCompleted = completedTodayIds.includes(habit.id);
                  const habitStreak = getHabitStreak(habit.id, logs);
                  return (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      isCompleted={isCompleted}
                      onToggle={handleToggleHabit}
                      streak={habitStreak}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteHabit}
                    />
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0C1220]/50 p-8 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">No habits scheduled for this filter</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add a new habit or adjust the frequency days to ensure continuous daily progress.
                  </p>
                  <button
                    onClick={handleOpenNew}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create First Habit
                  </button>
                </div>
              )}
            </div>

            {/* Heatmap Section integrated on main page */}
            <div className="pt-2">
              <HeatmapView
                logs={logs}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <HeatmapView
              logs={logs}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
            <AnalyticsView habits={habits} logs={logs} stats={stats} />
          </div>
        )}

        {activeTab === 'milestones' && (
          <MilestonesView stats={stats} />
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#0C1220] border border-slate-800 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Reminder & Accountability Settings
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure Web Push notifications, audio synthesis feedback, and data backup.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Open Full Reminder & Sound Console
                </button>
              </div>
            </div>

            <AnalyticsView habits={habits} logs={logs} stats={stats} />
          </div>
        )}
      </main>

      {/* Mobile Ergonomic Bottom Tab Bar (Fixed thumb zone) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2">
        <div className="grid grid-cols-4 items-center">
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'habits' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'milestones' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Streaks</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Alerts</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <HabitModal
        key={editingHabit ? editingHabit.id : 'new-habit'}
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
      />

      <AccountabilityModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        pendingHabits={pendingHabitsForCheckIn}
        onCompleteHabit={handleToggleHabit}
        onSaveReflection={handleSaveReflection}
      />

      <ReminderSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        permission={notificationPermission}
        onRefreshPermission={() => setNotificationPermission(getNotificationPermission())}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        habits={habits}
        logs={logs}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />
    </div>
  );
}
