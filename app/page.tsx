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
import { PomodoroView } from '@/components/PomodoroView';
import { MobileInstallModal } from '@/components/MobileInstallModal';
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
  Timer,
  Smartphone,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';

export default function FocusPulseApp() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [logs, setLogs] = useState<HabitLogsMap>({});
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [activeTab, setActiveTab] = useState<'habits' | 'pomodoro' | 'analytics' | 'milestones' | 'reminders'>('habits');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [soundMuted, setSoundMutedState] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>('default');
  const [viewDensity, setViewDensity] = useState<'compact' | 'standard'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('focuspulse_view_density');
      if (saved === 'compact' || saved === 'standard') return saved;
    }
    return 'compact';
  });

  // Modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileInstallOpen, setIsMobileInstallOpen] = useState(false);

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

  const handleToggleViewDensity = (newDensity: 'compact' | 'standard') => {
    setViewDensity(newDensity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('focuspulse_view_density', newDensity);
    }
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
        onOpenMobileInstall={() => setIsMobileInstallOpen(true)}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        notificationPermission={notificationPermission}
        onRequestNotifications={() => setIsSettingsModalOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Clean Focus Header */}
        <section className="rounded-2xl bg-[#0D121F]/90 border border-slate-800/60 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-mono font-medium">
                  <Flame className="h-3.5 w-3.5" />
                  {stats.currentStreak}-day streak
                </span>
                <span className="text-slate-700">·</span>
                <span>{stats.completionRate7d}% 7-day consistency</span>
                <span className="text-slate-700">·</span>
                <span className="text-slate-300">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Daily Focus & Consistency
              </h1>
              <p className="text-xs text-slate-400 max-w-xl">
                Stay on track with time-targeted push notifications, Pomodoro deep focus sessions, and visual progress dashboards.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('pomodoro')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-medium transition-colors whitespace-nowrap"
              >
                <Timer className="h-3.5 w-3.5" />
                <span>Pomodoro Focus</span>
              </button>
              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Check-In</span>
              </button>
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Habit</span>
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Content Views */}
        {activeTab === 'habits' && (
          <div className="space-y-5">
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

            {/* Category Filter & View Density Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-slate-800 text-white shadow-sm border border-slate-700/70'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle: Clean Minimal vs Detailed */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs text-slate-500 font-mono">
                  {filteredDueHabits.length} scheduled
                </span>

                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800/60">
                  <button
                    onClick={() => handleToggleViewDensity('compact')}
                    title="Clean Minimalist View"
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      viewDensity === 'compact'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <LayoutList className="h-3 w-3" />
                    <span>Minimal</span>
                  </button>
                  <button
                    onClick={() => handleToggleViewDensity('standard')}
                    title="Detailed View with 7-Day Stats"
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      viewDensity === 'standard'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <LayoutGrid className="h-3 w-3" />
                    <span>Detailed</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Habit Cards Grid */}
            <div className={viewDensity === 'compact' ? 'space-y-2' : 'space-y-3'}>
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
                      logs={logs}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteHabit}
                      compactView={viewDensity === 'compact'}
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

        {activeTab === 'pomodoro' && (
          <PomodoroView
            habits={habits}
            onCompleteHabit={handleToggleHabit}
            completedTodayIds={completedTodayIds}
          />
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

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Open Full Reminder & Sound Console
                </button>
                <button
                  onClick={() => setIsMobileInstallOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold transition-all"
                >
                  Mobile Install Guide
                </button>
              </div>
            </div>

            <AnalyticsView habits={habits} logs={logs} stats={stats} />
          </div>
        )}
      </main>

      {/* Mobile Ergonomic Bottom Tab Bar (Fixed thumb zone) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2">
        <div className="grid grid-cols-5 items-center">
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
            onClick={() => setActiveTab('pomodoro')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'pomodoro' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Focus</span>
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
            onClick={() => setIsMobileInstallOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Smartphone className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-1">Install</span>
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
        onOpenMobileInstall={() => setIsMobileInstallOpen(true)}
      />

      <MobileInstallModal
        isOpen={isMobileInstallOpen}
        onClose={() => setIsMobileInstallOpen(false)}
      />
    </div>
  );
}
