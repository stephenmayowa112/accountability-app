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
  clearAllStorage,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  saveNotificationSettings,
} from '@/lib/storage';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendWebNotification,
  sendAggressiveNotification,
  sendDailyPlanningReminder,
  sendOverdueTaskAlert,
  sendMiddayNudgeAlert,
  sendStreakSaverAlert,
  registerServiceWorker,
  NotificationPermissionState,
} from '@/lib/notifications';
import {
  getSoundMuted,
  setSoundMuted as updateSoundMuted,
  playSuccessChime,
  playCelebrationChime,
  playReminderTone,
  playAggressiveAlertTone,
  triggerDeviceVibration,
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
  Settings,
  ShieldAlert,
  AlertTriangle,
  Zap,
  SunMedium,
  Clock,
  ArrowRight,
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

  // Notification & Aggressive Reminder Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [snoozeUntilMap, setSnoozeUntilMap] = useState<Record<string, number>>({});
  const [lastPlanningNotifiedDate, setLastPlanningNotifiedDate] = useState<string>('');
  const [lastMiddayNotifiedDate, setLastMiddayNotifiedDate] = useState<string>('');
  const [lastEveningNotifiedDate, setLastEveningNotifiedDate] = useState<string>('');

  // Track already fired notifications for current session
  const [lastNotifiedMap, setLastNotifiedMap] = useState<Record<string, number>>({});

  // Initialize from storage on mount
  useEffect(() => {
    const loadedHabits = loadHabitsFromStorage();
    const loadedLogs = loadLogsFromStorage();
    const loadedSettings = loadNotificationSettings();
    const muted = getSoundMuted();
    const perm = getNotificationPermission();

    const handle = requestAnimationFrame(() => {
      setMounted(true);
      setHabits(loadedHabits);
      setLogs(loadedLogs);
      setNotificationSettings(loadedSettings);
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

  // Overdue habits for today that are not completed and past scheduled time
  const overdueHabits = useMemo(() => {
    if (!isToday) return [];
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayDone = logs[todayKey]?.completedHabitIds || [];

    return dueHabits.filter((h) => {
      if (todayDone.includes(h.id)) return false;
      const [hh, mm] = h.timeOfDay.split(':').map(Number);
      const habitMins = hh * 60 + mm;
      return currentMins > habitMins;
    });
  }, [dueHabits, isToday, logs, todayKey]);

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
    setHabits([]);
    setLogs({});
    clearAllStorage();
  };

  const handleToggleViewDensity = (newDensity: 'compact' | 'standard') => {
    setViewDensity(newDensity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('focuspulse_view_density', newDensity);
    }
  };

  // Handle snooze for overdue habit
  const handleSnoozeHabit = useCallback((habitId: string, minutes: number = 15) => {
    setSnoozeUntilMap((prev) => ({
      ...prev,
      [habitId]: Date.now() + minutes * 60 * 1000,
    }));
  }, []);

  // Update notification settings
  const handleUpdateNotificationSettings = useCallback((newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  }, []);

  // Background interval check for scheduled habit reminders & aggressive alerts (every 15 seconds)
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
      const nowMs = Date.now();

      // 1. Morning Kickoff Alert: Remind user to set/plan daily tasks
      if (
        notificationSettings.morningPlanningReminder &&
        lastPlanningNotifiedDate !== currentKey
      ) {
        if (currentTimeStr === notificationSettings.morningPlanningTime) {
          setLastPlanningNotifiedDate(currentKey);
          sendDailyPlanningReminder();
        }
      }

      // 2. Midday Accountability Check
      if (
        notificationSettings.middayCheckinReminder &&
        lastMiddayNotifiedDate !== currentKey
      ) {
        if (currentTimeStr === notificationSettings.middayCheckinTime) {
          const pendingCount = habits.filter(
            (h) => !h.archived && h.daysOfWeek.includes(currentDay) && !todayDone.includes(h.id)
          ).length;
          if (pendingCount > 0) {
            setLastMiddayNotifiedDate(currentKey);
            sendMiddayNudgeAlert(pendingCount);
          }
        }
      }

      // 3. Evening Streak-Saver Emergency Alert
      if (
        notificationSettings.eveningStreakSaver &&
        lastEveningNotifiedDate !== currentKey
      ) {
        if (currentTimeStr === notificationSettings.eveningStreakSaverTime) {
          const pendingCount = habits.filter(
            (h) => !h.archived && h.daysOfWeek.includes(currentDay) && !todayDone.includes(h.id)
          ).length;
          if (pendingCount > 0) {
            setLastEveningNotifiedDate(currentKey);
            sendStreakSaverAlert(pendingCount, stats.currentStreak);
          }
        }
      }

      // 4. Scheduled Habits & Aggressive Overdue Relentless Nagging
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();

      habits.forEach((habit) => {
        if (!habit.archived && habit.reminderEnabled && habit.daysOfWeek.includes(currentDay)) {
          const isCompleted = todayDone.includes(habit.id);
          if (isCompleted) return;

          const [hH, hM] = habit.timeOfDay.split(':').map(Number);
          const habitTotalMins = hH * 60 + hM;
          const isOverdue = currentTotalMins > habitTotalMins;
          const isDueExactMinute = habit.timeOfDay === currentTimeStr;
          const lastNotified = lastNotifiedMap[habit.id] || 0;
          const isSnoozed = (snoozeUntilMap[habit.id] || 0) > nowMs;

          if (isSnoozed) return;

          // A) Scheduled time arrival
          if (isDueExactMinute && nowMs - lastNotified > 3 * 60 * 1000) {
            setLastNotifiedMap((prev) => ({ ...prev, [habit.id]: nowMs }));
            if (notificationSettings.aggressiveMode) {
              sendAggressiveNotification(`FocusPulse Due: ${habit.title}`, {
                body: habit.promptMessage || `Scheduled for ${habit.timeOfDay}. Complete it now!`,
                tag: `habit-${habit.id}`,
              });
            } else {
              playReminderTone();
              sendWebNotification(`FocusPulse Reminder: ${habit.title}`, {
                body: habit.promptMessage || `Time to complete: ${habit.title}`,
                tag: `habit-${habit.id}`,
              });
            }
            return;
          }

          // B) Aggressive Overdue Relentless Nagging
          if (
            notificationSettings.aggressiveMode &&
            notificationSettings.overdueNagging &&
            isOverdue
          ) {
            const nagIntervalMs = (notificationSettings.overdueNagIntervalMinutes || 15) * 60 * 1000;
            if (nowMs - lastNotified >= nagIntervalMs) {
              setLastNotifiedMap((prev) => ({ ...prev, [habit.id]: nowMs }));
              sendOverdueTaskAlert(habit.title, habit.timeOfDay, habit.promptMessage);
            }
          }
        }
      });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [
    mounted,
    habits,
    logs,
    lastNotifiedMap,
    snoozeUntilMap,
    notificationSettings,
    lastPlanningNotifiedDate,
    lastMiddayNotifiedDate,
    lastEveningNotifiedDate,
    stats.currentStreak,
  ]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-slate-500 font-mono text-sm">
        Initializing FocusPulse...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070A10] pb-28 sm:pb-24 lg:pb-12">
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
        habitCount={habits.filter((h) => !h.archived).length}
        streak={stats.currentStreak}
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
            {/* 1. Aggressive Overdue Alert Banner */}
            {isToday && overdueHabits.length > 0 && notificationSettings.inAppBannerAlerts && (
              <div className="rounded-2xl border border-rose-500/50 bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/50 p-4 sm:p-4.5 shadow-xl shadow-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse-subtle">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                    <AlertTriangle className="h-5 w-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                        {overdueHabits.length} Overdue Task{overdueHabits.length > 1 ? 's' : ''} Today
                      </span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30 font-mono">
                        Urgent Action
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-0.5">
                      <strong className="text-white">&ldquo;{overdueHabits[0].title}&rdquo;</strong> was scheduled for {overdueHabits[0].timeOfDay}. Don&apos;t lose momentum!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleToggleHabit(overdueHabits[0].id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark Done</span>
                  </button>
                  <button
                    onClick={() => setIsCheckInModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/50 text-indigo-200 text-xs font-medium transition-all"
                  >
                    <span>Check-In</span>
                  </button>
                  <button
                    onClick={() => handleSnoozeHabit(overdueHabits[0].id, 15)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
                    title="Snooze alert for 15 minutes"
                  >
                    Snooze 15m
                  </button>
                </div>
              </div>
            )}

            {/* 2. Daily Kickoff: Prompt to Set Today's Tasks */}
            {isToday && habits.length > 0 && dueHabits.length === 0 && (
              <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <SunMedium className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">
                      Daily Kickoff: No Habits Scheduled For Today
                    </span>
                    <span className="text-xs text-slate-300">
                      Set up today&apos;s tasks or assign active days to keep your momentum going!
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleOpenNew}
                  className="self-end sm:self-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Plan Tasks Now</span>
                </button>
              </div>
            )}

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
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 touch-pan-x overscroll-x-contain">
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
              ) : habits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800/80 bg-[#0D121F]/70 p-8 sm:p-10 text-center max-w-2xl mx-auto space-y-5">
                  <div className="h-13 w-13 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white">Your Fresh Clean Slate</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Zero dummy data or pre-filled logs. FocusPulse is 100% yours from scratch.
                      Add what you want to track today to start building genuine, personal consistency.
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={handleOpenNew}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Your First Habit</span>
                    </button>
                  </div>

                  {/* Optional Starter Inspiration Chips */}
                  <div className="pt-4 border-t border-slate-800/60">
                    <span className="text-[11px] font-medium text-slate-400 block mb-2.5">
                      Need ideas? Tap one to customize and save it as your own:
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { title: 'Morning Hydration & Sunlight', category: 'health', color: '#06B6D4', timeOfDay: '07:30', promptMessage: 'Did you drink 500ml water and get morning light?' },
                        { title: 'Deep Work Sprint (45m)', category: 'focus', color: '#6366F1', timeOfDay: '09:30', promptMessage: 'Ready for an uninterrupted 45-minute focus session?' },
                        { title: 'Daily Movement / Workout', category: 'fitness', color: '#10B981', timeOfDay: '17:30', promptMessage: 'Did you move your body or hit your workout today?' },
                        { title: 'Evening Reading (15 mins)', category: 'mindset', color: '#F59E0B', timeOfDay: '21:30', promptMessage: 'Screens down — did you read tonight?' },
                      ].map((idea) => (
                        <button
                          key={idea.title}
                          onClick={() => {
                            setEditingHabit({
                              id: '',
                              title: idea.title,
                              description: '',
                              category: idea.category as HabitCategory,
                              color: idea.color,
                              timeOfDay: idea.timeOfDay,
                              reminderEnabled: true,
                              promptMessage: idea.promptMessage,
                              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                              createdAt: new Date().toISOString(),
                            });
                            setIsHabitModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 text-slate-300 hover:text-white text-xs transition-colors"
                        >
                          + {idea.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0C1220]/50 p-8 text-center space-y-3">
                  <div className="h-11 w-11 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">No habits scheduled for this day or filter</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add a habit for this category or adjust active days of the week.
                  </p>
                  <button
                    onClick={handleOpenNew}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Habit
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
            {/* Aggressive Mode Featured Control Card */}
            <div className={`rounded-3xl border p-6 sm:p-7 space-y-5 transition-all ${
              notificationSettings.aggressiveMode
                ? 'bg-gradient-to-br from-rose-950/40 via-[#0C1220] to-indigo-950/40 border-rose-500/40 shadow-2xl shadow-rose-950/20'
                : 'bg-[#0C1220] border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                    notificationSettings.aggressiveMode
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    {notificationSettings.aggressiveMode ? <Zap className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        Aggressive Reminders & Alert Engine
                      </h3>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                        notificationSettings.aggressiveMode
                          ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {notificationSettings.aggressiveMode ? 'Relentless Active' : 'Standard'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                      Insistently reminds you each morning to set and plan daily tasks, and nags you persistently until overdue habits are checked off.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleUpdateNotificationSettings({
                      ...notificationSettings,
                      aggressiveMode: !notificationSettings.aggressiveMode,
                    })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      notificationSettings.aggressiveMode
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {notificationSettings.aggressiveMode ? 'Relentless On' : 'Turn On Relentless'}
                  </button>
                </div>
              </div>

              {/* Active Triggers Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-3.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <SunMedium className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Morning Task Setup</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {notificationSettings.morningPlanningReminder
                      ? `Alerts at ${notificationSettings.morningPlanningTime} to plan today's tasks`
                      : 'Disabled'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-3.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rose-400" />
                    <span className="text-xs font-bold text-white">Overdue Nagging</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {notificationSettings.overdueNagging
                      ? `Repeats every ${notificationSettings.overdueNagIntervalMinutes}m until done`
                      : 'Disabled'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-3.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Evening Streak Saver</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {notificationSettings.eveningStreakSaver
                      ? `Alerts at ${notificationSettings.eveningStreakSaverTime} before midnight`
                      : 'Disabled'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Configure Schedule & Audio</span>
                </button>

                <button
                  onClick={async () => {
                    const { sendAggressiveTestNotification } = await import('@/lib/notifications');
                    await sendAggressiveTestNotification();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/40 text-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Zap className="h-3.5 w-3.5 text-rose-400" />
                  <span>Test Aggressive Alert Now</span>
                </button>

                <button
                  onClick={() => setIsMobileInstallOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Mobile Install Guide</span>
                </button>
              </div>
            </div>

            <AnalyticsView habits={habits} logs={logs} stats={stats} />
          </div>
        )}
      </main>

      {/* Mobile Ergonomic Bottom Tab Bar (Fixed thumb zone) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 items-center">
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              activeTab === 'habits' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-[10px] mt-1">Checklist</span>
            {activeTab === 'habits' && (
              <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              activeTab === 'pomodoro' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer className="h-5 w-5" />
            <span className="text-[10px] mt-1">Focus</span>
            {activeTab === 'pomodoro' && (
              <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              activeTab === 'analytics' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] mt-1">Heatmap</span>
            {activeTab === 'analytics' && (
              <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              activeTab === 'milestones' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="text-[10px] mt-1">Streaks</span>
            {activeTab === 'milestones' && (
              <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              activeTab === 'reminders' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] mt-1">Settings</span>
            {activeTab === 'reminders' && (
              <span className="absolute -top-1 h-0.5 w-6 rounded-full bg-indigo-500" />
            )}
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
        notificationSettings={notificationSettings}
        onUpdateNotificationSettings={handleUpdateNotificationSettings}
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
