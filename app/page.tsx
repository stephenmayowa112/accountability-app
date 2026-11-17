'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Habit, HabitLogsMap, HabitCategory } from '@/types/habit';
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
  isHabitDueOnDate,
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
  sendAggressiveTestNotification,
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
  BarChart3,
  Trophy,
  Bell,
  Sparkles,
  Timer,
  Smartphone,
  LayoutList,
  LayoutGrid,
  Settings,
  AlertTriangle,
  Zap,
  SunMedium,
  Clock,
  Search,
  Volume2,
  VolumeX,
  BookOpen,
  RotateCcw,
  X,
} from 'lucide-react';

interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'default' | 'urgent' | 'success';
  actionLabel?: string;
  onAction?: () => void;
}

export default function FocusPulseApp() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [logs, setLogs] = useState<HabitLogsMap>({});
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [activeTab, setActiveTab] = useState<
    'habits' | 'pomodoro' | 'analytics' | 'milestones' | 'reminders'
  >('habits');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<
    'all' | 'morning' | 'afternoon' | 'evening' | 'overdue'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundMuted, setSoundMutedState] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>('default');
  const [viewDensity, setViewDensity] = useState<'compact' | 'standard'>(() => {
    if (typeof window === 'undefined') return 'standard';
    try {
      const saved = localStorage.getItem('focuspulse_view_density');
      if (saved === 'compact' || saved === 'standard') return saved;
    } catch {}
    return 'standard';
  });

  // Inline Quick-Add Composer State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('09:00');
  const [quickType, setQuickType] = useState<'habit' | 'task'>('task');
  const [quickCategory, setQuickCategory] = useState<HabitCategory>('focus');

  // Daily Journal / Reflection Sidebar State
  const [journalMood, setJournalMood] = useState<'great' | 'steady' | 'struggled'>('great');
  const [journalNote, setJournalNote] = useState<string>('');
  const [journalSavedFeedback, setJournalSavedFeedback] = useState<boolean>(false);

  // Linked habit when jumping from Daily Checklist -> Focus Timer
  const [activeFocusHabitId, setActiveFocusHabitId] = useState<string | undefined>(undefined);

  // Toast & Undo state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal states
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileInstallOpen, setIsMobileInstallOpen] = useState(false);

  // Notification & Aggressive Reminder Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [snoozeUntilMap, setSnoozeUntilMap] = useState<Record<string, number>>({});
  const [lastPlanningNotifiedDate, setLastPlanningNotifiedDate] = useState<string>('');
  const [lastMiddayNotifiedDate, setLastMiddayNotifiedDate] = useState<string>('');
  const [lastEveningNotifiedDate, setLastEveningNotifiedDate] = useState<string>('');
  const [lastNotifiedMap, setLastNotifiedMap] = useState<Record<string, number>>({});

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize from storage on mount
  useEffect(() => {
    const loadedHabits = loadHabitsFromStorage();
    const loadedLogs = loadLogsFromStorage();
    const loadedSettings = loadNotificationSettings();
    const muted = getSoundMuted();
    const perm = getNotificationPermission();

    const handle = requestAnimationFrame(() => {
      setHabits(loadedHabits);
      setLogs(loadedLogs);
      setNotificationSettings(loadedSettings);
      setSoundMutedState(muted);
      setNotificationPermission(perm);
      const todayLog = loadedLogs[getTodayKey()];
      if (todayLog?.reflectionMood) setJournalMood(todayLog.reflectionMood);
      if (todayLog?.note) setJournalNote(todayLog.note);
      setMounted(true);
    });

    registerServiceWorker();
    return () => cancelAnimationFrame(handle);
  }, []);

  // Sync journal fields when selectedDate changes
  const handleSelectDate = useCallback(
    (dateKey: string) => {
      setSelectedDate(dateKey);
      const dayLog = logs[dateKey];
      setJournalMood(dayLog?.reflectionMood || 'great');
      setJournalNote(dayLog?.note || '');
    },
    [logs]
  );

  const todayKey = getTodayKey();
  const isToday = selectedDate === todayKey;

  // Derived Statistics
  const stats = useMemo(() => calculateStreakStats(habits, logs), [habits, logs]);

  // Habits & Tasks scheduled for the selected date
  const dueHabits = useMemo(() => {
    return habits
      .filter((h) => isHabitDueOnDate(h, selectedDate, logs))
      .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
  }, [habits, selectedDate, logs]);

  const completedTodayIds = useMemo(() => {
    return logs[selectedDate]?.completedHabitIds || [];
  }, [logs, selectedDate]);

  const skippedTodayIds = useMemo(() => {
    return logs[selectedDate]?.skippedHabitIds || [];
  }, [logs, selectedDate]);

  // Overdue habits/tasks for today that are not completed, not skipped, and past scheduled time
  const overdueHabits = useMemo(() => {
    if (!isToday) return [];
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayDone = logs[todayKey]?.completedHabitIds || [];
    const todaySkipped = logs[todayKey]?.skippedHabitIds || [];

    return dueHabits.filter((h) => {
      if (todayDone.includes(h.id) || todaySkipped.includes(h.id)) return false;
      const [hh, mm] = h.timeOfDay.split(':').map(Number);
      const habitMins = hh * 60 + mm;
      return currentMins > habitMins;
    });
  }, [dueHabits, isToday, logs, todayKey]);

  // Next upcoming habit/task for today
  const nextUpcomingHabit = useMemo(() => {
    if (!isToday) return null;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayDone = logs[todayKey]?.completedHabitIds || [];
    const todaySkipped = logs[todayKey]?.skippedHabitIds || [];

    const upcoming = dueHabits.filter((h) => {
      if (todayDone.includes(h.id) || todaySkipped.includes(h.id)) return false;
      const [hh, mm] = h.timeOfDay.split(':').map(Number);
      return hh * 60 + mm >= currentMins;
    });
    return upcoming[0] || null;
  }, [dueHabits, isToday, logs, todayKey]);

  // Filtered habits by category, time of day, and search query
  const filteredDueHabits = useMemo(() => {
    return dueHabits.filter((h) => {
      if (selectedCategory !== 'all' && h.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = h.title.toLowerCase().includes(q);
        const matchDesc = h.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      if (timeFilter !== 'all') {
        const [hh] = h.timeOfDay.split(':').map(Number);
        if (timeFilter === 'morning' && hh >= 12) return false;
        if (timeFilter === 'afternoon' && (hh < 12 || hh >= 17)) return false;
        if (timeFilter === 'evening' && hh < 17) return false;
        if (timeFilter === 'overdue' && !overdueHabits.some((oh) => oh.id === h.id)) {
          return false;
        }
      }

      return true;
    });
  }, [dueHabits, selectedCategory, searchQuery, timeFilter, overdueHabits]);

  // Pending habits for today's check-in modal
  const pendingHabitsForCheckIn = useMemo(() => {
    const todayLog = logs[todayKey]?.completedHabitIds || [];
    const todaySkipped = logs[todayKey]?.skippedHabitIds || [];
    const todayDue = habits.filter((h) => isHabitDueOnDate(h, todayKey, logs));
    return todayDue.filter(
      (h) => !todayLog.includes(h.id) && !todaySkipped.includes(h.id)
    );
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

        // If completing, also remove from skippedHabitIds if present
        const updatedSkipped = exists
          ? currentLog.skippedHabitIds || []
          : (currentLog.skippedHabitIds || []).filter((id) => id !== habitId);

        const nextLogs: HabitLogsMap = {
          ...prev,
          [selectedDate]: {
            ...currentLog,
            completedHabitIds: updatedIds,
            skippedHabitIds: updatedSkipped,
          },
        };

        saveLogsToStorage(nextLogs);

        if (!exists) {
          playSuccessChime();
          const activeDueCount = dueHabits.filter(
            (h) => !updatedSkipped.includes(h.id)
          ).length;
          if (activeDueCount > 0 && updatedIds.length >= activeDueCount) {
            triggerConfetti();
            playCelebrationChime();
          }
        }

        return nextLogs;
      });
    },
    [selectedDate, dueHabits]
  );

  // Toggle rest-day skip for a habit
  const handleToggleSkipHabit = useCallback(
    (habitId: string) => {
      setLogs((prev) => {
        const currentLog = prev[selectedDate] || { completedHabitIds: [] };
        const currentSkipped = currentLog.skippedHabitIds || [];
        const isSkipped = currentSkipped.includes(habitId);
        const updatedSkipped = isSkipped
          ? currentSkipped.filter((id) => id !== habitId)
          : [...currentSkipped, habitId];

        const nextLogs: HabitLogsMap = {
          ...prev,
          [selectedDate]: {
            ...currentLog,
            skippedHabitIds: updatedSkipped,
          },
        };
        saveLogsToStorage(nextLogs);
        return nextLogs;
      });
      pushToast({
        title: 'Schedule updated',
        subtitle: 'Rest-day status updated for selected date.',
      });
    },
    [selectedDate, pushToast]
  );

  // Toggle individual subtask
  const handleToggleSubtask = useCallback((habitId: string, subtaskId: string) => {
    setHabits((prev) => {
      const next = prev.map((h) => {
        if (h.id !== habitId || !h.subtasks) return h;
        const updatedSubs = h.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...h, subtasks: updatedSubs };
      });
      saveHabitsToStorage(next);
      return next;
    });
  }, []);

  // Launch Focus Timer linked to a specific habit/task
  const handleStartFocusForHabit = useCallback((habit: Habit) => {
    setActiveFocusHabitId(habit.id);
    setActiveTab('pomodoro');
  }, []);

  // Inline Quick-Add handler
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      itemType: quickType,
      title: trimmed,
      description: '',
      category: quickCategory,
      priority: 'normal',
      timeOfDay: quickTime || '09:00',
      targetDate: quickType === 'task' ? selectedDate : undefined,
      estimatedMinutes: 25,
      reminderEnabled: true,
      promptMessage: `Did you finish "${trimmed}"?`,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      color: '#6366F1',
    };

    setHabits((prev) => {
      const next = [...prev, newHabit];
      saveHabitsToStorage(next);
      return next;
    });

    setQuickTitle('');
    playSuccessChime();
    pushToast({
      title: `${quickType === 'task' ? 'Daily task' : 'Recurring habit'} added`,
      subtitle: `"${trimmed}" scheduled for ${quickTime}`,
      type: 'success',
    });
  };

  // Save new or edited habit from modal
  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (habitData.id) {
      setHabits((prev) => {
        const next = prev.map((h) =>
          h.id === habitData.id ? ({ ...h, ...habitData } as Habit) : h
        );
        saveHabitsToStorage(next);
        return next;
      });
      pushToast({
        title: 'Changes saved',
        subtitle: `"${habitData.title}" updated.`,
      });
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        itemType: habitData.itemType || 'habit',
        title: habitData.title || 'Untitled Habit',
        description: habitData.description || '',
        category: (habitData.category as HabitCategory) || 'focus',
        priority: habitData.priority || 'normal',
        timeOfDay: habitData.timeOfDay || '09:00',
        targetDate:
          habitData.itemType === 'task'
            ? habitData.targetDate || selectedDate
            : undefined,
        estimatedMinutes: habitData.estimatedMinutes || 25,
        reminderEnabled: habitData.reminderEnabled ?? true,
        promptMessage:
          habitData.promptMessage || `Did you finish: "${habitData.title}"?`,
        daysOfWeek: habitData.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        subtasks: habitData.subtasks || [],
        createdAt: new Date().toISOString(),
        color: '#6366F1',
      };
      setHabits((prev) => {
        const next = [...prev, newHabit];
        saveHabitsToStorage(next);
        return next;
      });
      pushToast({
        title: `${newHabit.itemType === 'task' ? 'Task' : 'Habit'} created`,
        subtitle: `"${newHabit.title}" scheduled for ${newHabit.timeOfDay}`,
        type: 'success',
      });
    }
  };

  // Delete habit without window.confirm — includes instant Undo Toast!
  const handleDeleteHabit = useCallback(
    (habitId: string) => {
      const target = habits.find((h) => h.id === habitId);
      if (!target) return;

      setHabits((prev) => {
        const next = prev.filter((h) => h.id !== habitId);
        saveHabitsToStorage(next);
        return next;
      });

      pushToast({
        title: `Removed "${target.title}"`,
        subtitle: 'You can restore this item if deleted by mistake.',
        actionLabel: 'Undo',
        onAction: () => {
          setHabits((prev) => {
            if (prev.some((h) => h.id === target.id)) return prev;
            const restored = [...prev, target];
            saveHabitsToStorage(restored);
            return restored;
          });
        },
      });
    },
    [habits, pushToast]
  );

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

  const handleSaveReflection = (
    mood: 'great' | 'steady' | 'struggled',
    note: string,
    targetDateKey: string = selectedDate
  ) => {
    setLogs((prev) => {
      const currentLog = prev[targetDateKey] || { completedHabitIds: [] };
      const nextLogs: HabitLogsMap = {
        ...prev,
        [targetDateKey]: {
          ...currentLog,
          reflectionMood: mood,
          note,
        },
      };
      saveLogsToStorage(nextLogs);
      return nextLogs;
    });
    setJournalSavedFeedback(true);
    setTimeout(() => setJournalSavedFeedback(false), 2500);
  };

  const handleImportData = (newHabits: Habit[], newLogs: HabitLogsMap) => {
    setHabits(newHabits);
    setLogs(newLogs);
    saveHabitsToStorage(newHabits);
    saveLogsToStorage(newLogs);
    pushToast({
      title: 'Backup restored',
      subtitle: `${newHabits.length} items loaded.`,
      type: 'success',
    });
  };

  const handleResetData = () => {
    clearAllStorage();
    setHabits([]);
    setLogs({});
    setJournalNote('');
    pushToast({
      title: 'All local data cleared',
      subtitle: 'Your workspace has been reset.',
    });
  };

  const handleToggleViewDensity = (newDensity: 'compact' | 'standard') => {
    setViewDensity(newDensity);
    try {
      localStorage.setItem('focuspulse_view_density', newDensity);
    } catch {}
  };

  // Handle snooze for overdue habit
  const handleSnoozeHabit = useCallback(
    (habitId: string, minutes: number = 15) => {
      setSnoozeUntilMap((prev) => ({
        ...prev,
        [habitId]: Date.now() + minutes * 60 * 1000,
      }));
      pushToast({
        title: `Snoozed for ${minutes} minutes`,
        subtitle: 'Reminder paused temporarily.',
      });
    },
    [pushToast]
  );

  // Update notification settings & persist
  const handleUpdateNotificationSettings = useCallback(
    (newSettings: NotificationSettings) => {
      setNotificationSettings(newSettings);
      saveNotificationSettings(newSettings);
    },
    []
  );

  // Background interval check for scheduled habit reminders, daily planning kickoffs & relentless overdue nagging
  useEffect(() => {
    if (!mounted) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const currentKey = getTodayKey();
      const nowMs = Date.now();

      const activeHabits = habits.filter((h) => !h.archived);
      const todaySkipped = logs[currentKey]?.skippedHabitIds || [];
      const todayDue = activeHabits.filter(
        (h) => isHabitDueOnDate(h, currentKey, logs) && !todaySkipped.includes(h.id)
      );
      const todayLog = logs[currentKey]?.completedHabitIds || [];

      // 1. Morning Task-Setting / Planning Reminder
      if (
        notificationSettings.morningPlanningReminder &&
        currentTimeStr >= notificationSettings.morningPlanningTime &&
        lastPlanningNotifiedDate !== currentKey
      ) {
        if (activeHabits.length === 0 || todayDue.length === 0) {
          setLastPlanningNotifiedDate(currentKey);
          sendDailyPlanningReminder();
        }
      }

      // 2. Midday Accountability Nudge
      if (
        notificationSettings.middayCheckinReminder &&
        currentTimeStr === notificationSettings.middayCheckinTime &&
        lastMiddayNotifiedDate !== currentKey
      ) {
        const pendingCount = todayDue.filter((h) => !todayLog.includes(h.id)).length;
        if (pendingCount > 0) {
          setLastMiddayNotifiedDate(currentKey);
          sendMiddayNudgeAlert(pendingCount);
        }
      }

      // 3. Evening Streak-Saver Warning
      if (
        notificationSettings.eveningStreakSaver &&
        currentTimeStr === notificationSettings.eveningStreakSaverTime &&
        lastEveningNotifiedDate !== currentKey
      ) {
        const pendingCount = todayDue.filter((h) => !todayLog.includes(h.id)).length;
        if (pendingCount > 0) {
          setLastEveningNotifiedDate(currentKey);
          sendStreakSaverAlert(pendingCount, stats.currentStreak);
        }
      }

      // 4. Individual Scheduled Habit Reminders & Overdue Relentless Nagging
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();

      todayDue.forEach((habit) => {
        if (!habit.reminderEnabled) return;
        const isCompleted = todayLog.includes(habit.id);
        if (isCompleted) return;

        const [hH, hM] = habit.timeOfDay.split(':').map(Number);
        const habitTotalMins = hH * 60 + hM;
        const isOverdue = currentTotalMins > habitTotalMins;
        const isDueExactMinute = habit.timeOfDay === currentTimeStr;

        const lastNotified = lastNotifiedMap[habit.id] || 0;
        const isSnoozed = (snoozeUntilMap[habit.id] || 0) > nowMs;

        if (isSnoozed) return;

        // A) Exact Scheduled Time Trigger
        if (isDueExactMinute && nowMs - lastNotified > 65000) {
          setLastNotifiedMap((prev) => ({ ...prev, [habit.id]: nowMs }));

          if (notificationSettings.aggressiveMode) {
            sendAggressiveNotification(`Time for: ${habit.title}`, {
              body: habit.promptMessage || `Complete "${habit.title}" now to stay on track.`,
              tag: `habit-${habit.id}`,
            });
          } else {
            playReminderTone();
            sendWebNotification(`FocusPulse: ${habit.title}`, {
              body: habit.promptMessage,
              tag: `habit-${habit.id}`,
            });
          }
          pushToast({
            title: `Reminder: ${habit.title}`,
            subtitle: habit.promptMessage,
            type: 'urgent',
            actionLabel: 'Mark Done',
            onAction: () => handleToggleHabit(habit.id),
          });
        }

        // B) Aggressive Overdue Relentless Nagging
        if (
          notificationSettings.aggressiveMode &&
          notificationSettings.overdueNagging &&
          isOverdue
        ) {
          const nagIntervalMs =
            (notificationSettings.overdueNagIntervalMinutes || 15) * 60 * 1000;
          if (nowMs - lastNotified >= nagIntervalMs) {
            setLastNotifiedMap((prev) => ({ ...prev, [habit.id]: nowMs }));
            sendOverdueTaskAlert(habit.title, habit.timeOfDay, habit.promptMessage);
            pushToast({
              title: `Overdue: ${habit.title}`,
              subtitle: `Scheduled for ${habit.timeOfDay}.`,
              type: 'urgent',
              actionLabel: 'Mark Done',
              onAction: () => handleToggleHabit(habit.id),
            });
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
    pushToast,
    handleToggleHabit,
  ]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-slate-500 font-mono text-sm">
        Loading workspace...
      </div>
    );
  }

  const activeDueCount = dueHabits.filter((h) => !skippedTodayIds.includes(h.id)).length;
  const completedDueCount = completedTodayIds.filter((id) =>
    dueHabits.some((h) => h.id === id && !skippedTodayIds.includes(h.id))
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#070A10] pb-24 lg:pb-12">
      {/* Top Bar (Strict 3-Zone Contract) */}
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
        {/* Executive Workspace Header */}
        <section className="rounded-2xl bg-[#0D121F]/90 border border-slate-800/70 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 flex-wrap tabular-nums">
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-mono font-medium">
                  <Flame className="h-3.5 w-3.5" />
                  {stats.currentStreak}d streak
                </span>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span>{stats.completionRate7d}% 7-day adherence</span>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="text-slate-300">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Daily Execution & Habit System
              </h1>
              <p className="text-xs text-slate-400 max-w-2xl">
                Plan one-off daily tasks alongside recurring habits, link deep work blocks to the Pomodoro timer, and stay accountable with persistent alerts.
              </p>
            </div>

            {/* Workspace Toolbar Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleToggleSound}
                title={soundMuted ? 'Unmute audio chimes' : 'Mute audio chimes'}
                className="flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                {soundMuted ? (
                  <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span>{soundMuted ? 'Sound Muted' : 'Audio On'}</span>
              </button>

              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                <Bell className="h-3.5 w-3.5 text-indigo-400" />
                <span>Alerts</span>
              </button>

              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Daily Check-In</span>
              </button>

              <button
                onClick={() => setIsMobileInstallOpen(true)}
                className="flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                <span>Mobile App</span>
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================================
            TAB 1: DAILY CHECKLIST & EXECUTION WORKSPACE
           ===================================================================== */}
        {activeTab === 'habits' && (
          <div className="space-y-5">
            {/* Top 3-Card KPI Strip */}
            <ProgressOverview
              completedCount={completedDueCount}
              totalDue={activeDueCount}
              stats={stats}
              onOpenCheckIn={() => setIsCheckInModalOpen(true)}
              selectedDateIsToday={isToday}
            />

            {/* Date Strip Navigation */}
            <DateStrip
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              logs={logs}
              habits={habits}
            />

            {/* Desktop 2-Column Asymmetric Split: 8 Cols Checklist + 4 Cols Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT / MAIN EXECUTION COLUMN (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                {/* 1. Urgent Overdue Banner */}
                {isToday &&
                  overdueHabits.length > 0 &&
                  notificationSettings.inAppBannerAlerts && (
                    <div className="rounded-2xl border border-rose-500/40 bg-[#140C14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-xs text-rose-300 font-mono tabular-nums">
                            <span className="font-bold">
                              {overdueHabits.length} Overdue{' '}
                              {overdueHabits.length === 1 ? 'Item' : 'Items'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Scheduled for {overdueHabits[0].timeOfDay}</span>
                          </div>
                          <p className="text-xs text-slate-200 mt-0.5">
                            <strong className="text-white">
                              &ldquo;{overdueHabits[0].title}&rdquo;
                            </strong>{' '}
                            is past its scheduled time. Complete it now or snooze reminders.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleToggleHabit(overdueHabits[0].id)}
                          className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark Done</span>
                        </button>
                        <button
                          onClick={() => handleStartFocusForHabit(overdueHabits[0])}
                          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-200 text-xs font-medium transition-all whitespace-nowrap"
                        >
                          Focus
                        </button>
                        <button
                          onClick={() => handleSnoozeHabit(overdueHabits[0].id, 15)}
                          className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all whitespace-nowrap"
                        >
                          Snooze 15m
                        </button>
                      </div>
                    </div>
                  )}

                {/* 2. Inline Quick-Add Composer Bar */}
                <form
                  onSubmit={handleQuickAdd}
                  className="rounded-2xl bg-[#0D121F]/90 border border-slate-800/70 p-3.5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      placeholder={
                        quickType === 'task'
                          ? 'Quick add a task for this day (e.g. Send client proposal)...'
                          : 'Quick add a recurring daily habit (e.g. 20m Reading)...'
                      }
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      className="flex-1 rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={quickTime}
                        onChange={(e) => setQuickTime(e.target.value)}
                        aria-label="Scheduled time"
                        className="rounded-xl bg-slate-900/90 border border-slate-800 px-2.5 py-2 text-xs font-mono text-white tabular-nums focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!quickTitle.trim()}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Quick Add</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/50 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setQuickType('task')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                            quickType === 'task'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          One-Off Task
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickType('habit')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                            quickType === 'habit'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Recurring Habit
                        </button>
                      </div>

                      <select
                        value={quickCategory}
                        onChange={(e) => setQuickCategory(e.target.value as HabitCategory)}
                        aria-label="Quick category"
                        className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="focus">Deep Focus</option>
                        <option value="health">Health</option>
                        <option value="fitness">Fitness</option>
                        <option value="mindset">Mindset</option>
                        <option value="routine">Routine</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenNew}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
                    >
                      Full Options & Subtasks →
                    </button>
                  </div>
                </form>

                {/* 3. Filter, Search & View Density Bar */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-xs">
                      <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Filter schedule..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl bg-[#0D121F] border border-slate-800/80 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Time-of-Day Filter + View Mode Toggle */}
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {[
                          { id: 'all' as const, label: 'All Times' },
                          { id: 'morning' as const, label: 'Morning' },
                          { id: 'afternoon' as const, label: 'Afternoon' },
                          { id: 'evening' as const, label: 'Evening' },
                          ...(isToday && overdueHabits.length > 0
                            ? [{ id: 'overdue' as const, label: `Overdue (${overdueHabits.length})` }]
                            : []),
                        ].map((tf) => (
                          <button
                            key={tf.id}
                            onClick={() => setTimeFilter(tf.id)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                              timeFilter === tf.id
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        <button
                          onClick={() => handleToggleViewDensity('compact')}
                          title="Compact rows"
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                            viewDensity === 'compact'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <LayoutList className="h-3 w-3" />
                          <span className="hidden sm:inline">Compact</span>
                        </button>
                        <button
                          onClick={() => handleToggleViewDensity('standard')}
                          title="Detailed cards"
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                            viewDensity === 'standard'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <LayoutGrid className="h-3 w-3" />
                          <span className="hidden sm:inline">Detailed</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Segmented Filter */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 touch-pan-x">
                      {[
                        { id: 'all', label: 'All Pillars' },
                        { id: 'focus', label: 'Deep Focus' },
                        { id: 'health', label: 'Health' },
                        { id: 'fitness', label: 'Fitness' },
                        { id: 'mindset', label: 'Mindset' },
                        { id: 'routine', label: 'Routine' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                            selectedCategory === cat.id
                              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
                      {filteredDueHabits.length} shown
                    </span>
                  </div>
                </div>

                {/* 4. Habit & Task Cards List */}
                <div className={viewDensity === 'compact' ? 'space-y-2' : 'space-y-3'}>
                  {filteredDueHabits.length > 0 ? (
                    filteredDueHabits.map((habit) => {
                      const isCompleted = completedTodayIds.includes(habit.id);
                      const isSkipped = skippedTodayIds.includes(habit.id);
                      const isOverdue = overdueHabits.some((oh) => oh.id === habit.id);
                      const habitStreak = getHabitStreak(habit.id, logs);
                      return (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          isCompleted={isCompleted}
                          isSkipped={isSkipped}
                          isOverdue={isOverdue}
                          onToggle={handleToggleHabit}
                          onToggleSkip={handleToggleSkipHabit}
                          onToggleSubtask={handleToggleSubtask}
                          onStartFocus={handleStartFocusForHabit}
                          streak={habitStreak}
                          logs={logs}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteHabit}
                          compactView={viewDensity === 'compact'}
                        />
                      );
                    })
                  ) : habits.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-800/80 bg-[#0D121F]/70 p-7 sm:p-9 text-center space-y-4">
                      <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-white">No Items Scheduled Yet</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Use the quick-add bar above to jot down today&apos;s tasks or pick a starter routine below.
                        </p>
                      </div>

                      <div>
                        <button
                          onClick={handleOpenNew}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create First Habit or Task</span>
                        </button>
                      </div>

                      <div className="pt-4 border-t border-slate-800/60">
                        <span className="text-xs text-slate-400 block mb-2.5">
                          Quick-start templates:
                        </span>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[
                            {
                              title: 'Morning Hydration & Sunlight',
                              category: 'health',
                              color: '#06B6D4',
                              timeOfDay: '07:30',
                              promptMessage: 'Did you drink 500ml water and get morning light?',
                            },
                            {
                              title: 'Deep Work Sprint (45m)',
                              category: 'focus',
                              color: '#6366F1',
                              timeOfDay: '09:30',
                              promptMessage: 'Ready for an uninterrupted 45-minute focus session?',
                            },
                            {
                              title: 'Daily Movement / Workout',
                              category: 'fitness',
                              color: '#10B981',
                              timeOfDay: '17:30',
                              promptMessage: 'Did you move your body or hit your workout today?',
                            },
                            {
                              title: 'Evening Reading (20 Pages)',
                              category: 'mindset',
                              color: '#F59E0B',
                              timeOfDay: '21:30',
                              promptMessage: 'Screens down — did you read tonight?',
                            },
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
                              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs transition-colors"
                            >
                              + {idea.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0D121F]/60 p-8 text-center space-y-3">
                      <p className="text-sm font-medium text-slate-300">
                        No items match the current filter for this day.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        {(selectedCategory !== 'all' ||
                          timeFilter !== 'all' ||
                          searchQuery.trim() !== '') && (
                          <button
                            onClick={() => {
                              setSelectedCategory('all');
                              setTimeFilter('all');
                              setSearchQuery('');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                          >
                            Reset Filters
                          </button>
                        )}
                        <button
                          onClick={handleOpenNew}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                        >
                          + Add Task for This Day
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT SIDEBAR COLUMN (4 Cols): Live Radar + Daily Reflection Journal */}
              <aside className="lg:col-span-4 space-y-5">
                {/* Card 1: Live Reminder Radar & Next Up */}
                <div className="rounded-2xl bg-[#0D121F]/90 border border-slate-800/70 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <h2 className="text-sm font-bold text-white">Reminder Radar</h2>
                    </div>
                    <button
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      Configure
                    </button>
                  </div>

                  {overdueHabits.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs text-rose-300 font-mono tabular-nums">
                        <span className="font-semibold">Overdue Now</span>
                        <span>{overdueHabits[0].timeOfDay}</span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">
                        {overdueHabits[0].title}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleToggleHabit(overdueHabits[0].id)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleSnoozeHabit(overdueHabits[0].id, 15)}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                        >
                          Snooze 15m
                        </button>
                      </div>
                    </div>
                  ) : nextUpcomingHabit ? (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                        <span>Up Next Today</span>
                        <span className="text-indigo-400 font-semibold">
                          {nextUpcomingHabit.timeOfDay}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white truncate">
                        {nextUpcomingHabit.title}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleStartFocusForHabit(nextUpcomingHabit)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Timer className="h-3.5 w-3.5" />
                          <span>Start Focus</span>
                        </button>
                        <button
                          onClick={() => handleToggleHabit(nextUpcomingHabit.id)}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          Mark Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/70 text-xs text-slate-400">
                      {dueHabits.length > 0 && completedDueCount >= activeDueCount
                        ? 'All scheduled items for today are complete.'
                        : 'No upcoming timed alerts remaining for today.'}
                    </div>
                  )}

                  {/* Quick Aggressive Mode Switch */}
                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-200 block">
                        Persistent Overdue Nagging
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {notificationSettings.aggressiveMode
                          ? `Alerts every ${notificationSettings.overdueNagIntervalMinutes}m when overdue`
                          : 'Standard single reminder'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateNotificationSettings({
                          ...notificationSettings,
                          aggressiveMode: !notificationSettings.aggressiveMode,
                        })
                      }
                      role="switch"
                      aria-checked={notificationSettings.aggressiveMode}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        notificationSettings.aggressiveMode ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          notificationSettings.aggressiveMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Card 2: Daily Reflection & Focus Journal */}
                <div className="rounded-2xl bg-[#0D121F]/90 border border-slate-800/70 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-white">Daily Reflection Log</h2>
                    </div>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      {selectedDate === todayKey ? 'Today' : selectedDate}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 block">
                      Energy & Focus Rating
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'great' as const, label: 'Locked In' },
                        { id: 'steady' as const, label: 'Steady' },
                        { id: 'struggled' as const, label: 'Friction' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setJournalMood(m.id)}
                          className={`py-2 px-2 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                            journalMood === m.id
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 block">
                      Wins, Blockers & Notes
                    </label>
                    <textarea
                      rows={3}
                      value={journalNote}
                      onChange={(e) => setJournalNote(e.target.value)}
                      placeholder="What went well today? Any distractions to eliminate tomorrow?"
                      className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-emerald-400">
                      {journalSavedFeedback ? 'Reflection saved' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveReflection(journalMood, journalNote, selectedDate)
                      }
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                    >
                      Save Reflection
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: POMODORO FOCUS TIMER
           ===================================================================== */}
        {activeTab === 'pomodoro' && (
          <PomodoroView
            key={activeFocusHabitId || 'default-pomo'}
            habits={habits.filter((h) => !h.archived)}
            onCompleteHabit={handleToggleHabit}
            completedTodayIds={completedTodayIds}
            initialHabitId={activeFocusHabitId}
          />
        )}

        {/* =====================================================================
            TAB 3: ANALYTICS & 365-DAY HEATMAP
           ===================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <HeatmapView
              logs={logs}
              selectedDate={selectedDate}
              onSelectDate={(dateKey) => {
                handleSelectDate(dateKey);
                setActiveTab('habits');
              }}
            />
            <AnalyticsView habits={habits} logs={logs} stats={stats} />
          </div>
        )}

        {/* =====================================================================
            TAB 4: MILESTONES & STREAKS
           ===================================================================== */}
        {activeTab === 'milestones' && <MilestonesView stats={stats} />}

        {/* =====================================================================
            TAB 5: ALERTS & SETTINGS
           ===================================================================== */}
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            <div
              className={`rounded-3xl border p-6 sm:p-7 space-y-5 transition-colors ${
                notificationSettings.aggressiveMode
                  ? 'bg-[#120D1A] border-rose-500/40'
                  : 'bg-[#0C1220] border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                      notificationSettings.aggressiveMode
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-0.5">
                      <span>Alert Engine</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          notificationSettings.aggressiveMode
                            ? 'text-rose-400 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        {notificationSettings.aggressiveMode
                          ? 'Relentless Mode Active'
                          : 'Standard Mode'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Aggressive Reminders & Accountability Engine
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      Fires morning task-planning kickoffs at{' '}
                      <strong className="text-white font-mono">
                        {notificationSettings.morningPlanningTime}
                      </strong>
                      , nags overdue tasks every{' '}
                      <strong className="text-white font-mono">
                        {notificationSettings.overdueNagIntervalMinutes} mins
                      </strong>
                      , and triggers an evening streak-saver warning at{' '}
                      <strong className="text-white font-mono">
                        {notificationSettings.eveningStreakSaverTime}
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-medium text-slate-300">
                    {notificationSettings.aggressiveMode ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateNotificationSettings({
                        ...notificationSettings,
                        aggressiveMode: !notificationSettings.aggressiveMode,
                      })
                    }
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notificationSettings.aggressiveMode ? 'bg-rose-600' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={notificationSettings.aggressiveMode}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        notificationSettings.aggressiveMode
                          ? 'translate-x-6'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Active Schedule Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Morning Planning Kickoff
                    </span>
                    <span className="text-sm font-bold text-white font-mono tabular-nums mt-0.5 block">
                      {notificationSettings.morningPlanningReminder
                        ? notificationSettings.morningPlanningTime
                        : 'Disabled'}
                    </span>
                  </div>
                  <SunMedium className="h-5 w-5 text-amber-400" />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Overdue Task Nag Frequency
                    </span>
                    <span className="text-sm font-bold text-rose-300 font-mono tabular-nums mt-0.5 block">
                      {notificationSettings.overdueNagging
                        ? `Every ${notificationSettings.overdueNagIntervalMinutes}m`
                        : 'Disabled'}
                    </span>
                  </div>
                  <Clock className="h-5 w-5 text-rose-400" />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Evening Streak-Saver
                    </span>
                    <span className="text-sm font-bold text-indigo-300 font-mono tabular-nums mt-0.5 block">
                      {notificationSettings.eveningStreakSaver
                        ? notificationSettings.eveningStreakSaverTime
                        : 'Disabled'}
                    </span>
                  </div>
                  <Flame className="h-5 w-5 text-indigo-400" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                >
                  Customize Alert Times & Data Backup
                </button>

                <button
                  onClick={() => sendAggressiveTestNotification()}
                  className="px-4 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 hover:bg-rose-900/50 text-rose-200 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Zap className="h-3.5 w-3.5 text-rose-400" />
                  <span>Test Aggressive Alert Now</span>
                </button>

                <button
                  onClick={() => setIsMobileInstallOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5"
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

      {/* Live Non-Blocking Toast & Undo Notification Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all ${
                t.type === 'urgent'
                  ? 'bg-[#190D16]/95 border-rose-500/50 text-white'
                  : 'bg-[#0F172A]/95 border-slate-700/80 text-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                {t.subtitle && (
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">{t.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {t.actionLabel && t.onAction && (
                  <button
                    onClick={() => {
                      t.onAction?.();
                      dismissToast(t.id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {t.actionLabel}
                  </button>
                )}
                <button
                  onClick={() => dismissToast(t.id)}
                  aria-label="Dismiss notification"
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Ergonomic Bottom Tab Bar (Fixed thumb zone, 44px+ hitboxes) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 items-center">
          {[
            { id: 'habits' as const, label: 'Checklist', icon: CheckCircle2 },
            { id: 'pomodoro' as const, label: 'Focus', icon: Timer },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
            { id: 'milestones' as const, label: 'Streaks', icon: Trophy },
            { id: 'reminders' as const, label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
                  isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-1 whitespace-nowrap">{tab.label}</span>
                {isActive && (
                  <span className="absolute -top-1.5 h-0.5 w-6 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <HabitModal
        key={editingHabit ? editingHabit.id || editingHabit.title : `new-habit-${selectedDate}`}
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
        defaultDate={selectedDate}
      />

      <AccountabilityModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        pendingHabits={pendingHabitsForCheckIn}
        onCompleteHabit={handleToggleHabit}
        onSaveReflection={(mood, note) => handleSaveReflection(mood, note, todayKey)}
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
