import { Habit, HabitLogsMap, Milestone, UserStats } from '@/types/habit';

export const HABIT_STORAGE_KEY = 'focuspulse_habits_v3';
export const LOGS_STORAGE_KEY = 'focuspulse_logs_v3';
export const LAST_ACTIVE_KEY = 'focuspulse_last_active';

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getHabitCreatedDateKey(habit: Habit): string {
  if (!habit.createdAt) return '2000-01-01';
  try {
    const d = new Date(habit.createdAt);
    if (isNaN(d.getTime())) return '2000-01-01';
    return formatDateKey(d);
  } catch {
    return '2000-01-01';
  }
}

/**
 * Determines whether a habit or one-off task is scheduled for a given dateKey.
 * When `respectCreationDate` is true (used in historical adherence calculations),
 * habits are not counted as missed on dates prior to their creation.
 */
export function isHabitDueOnDate(
  habit: Habit,
  dateKey: string,
  logs?: HabitLogsMap,
  respectCreationDate = false
): boolean {
  if (habit.archived) return false;

  // One-off daily task
  if (habit.itemType === 'task') {
    const target = habit.targetDate || getHabitCreatedDateKey(habit);
    if (target === dateKey) return true;
    // Carry over unfinished past tasks to today so they aren't forgotten
    const todayKey = getTodayKey();
    if (dateKey === todayKey && target < todayKey && logs) {
      const wasCompletedOnTarget = logs[target]?.completedHabitIds?.includes(habit.id);
      const wasCompletedToday = logs[todayKey]?.completedHabitIds?.includes(habit.id);
      if (!wasCompletedOnTarget || wasCompletedToday) {
        return true;
      }
    }
    return false;
  }

  // Recurring habit
  if (respectCreationDate) {
    const createdKey = getHabitCreatedDateKey(habit);
    const wasLoggedThatDay = logs?.[dateKey]?.completedHabitIds?.includes(habit.id);
    if (dateKey < createdKey && !wasLoggedThatDay) {
      return false;
    }
  }

  const d = parseDateKey(dateKey);
  const dayOfWeek = d.getDay();
  return habit.daysOfWeek.includes(dayOfWeek);
}

// Clean slate default: zero dummy habits on fresh install
export const DEFAULT_HABITS: Habit[] = [];

export function loadHabitsFromStorage(): Habit[] {
  if (typeof window === 'undefined') return [];
  try {
    // Clean up any legacy dummy data from earlier demo versions
    const legacyHabits = localStorage.getItem('focuspulse_habits_v2');
    if (legacyHabits && !localStorage.getItem(HABIT_STORAGE_KEY)) {
      try {
        const parsedLegacy = JSON.parse(legacyHabits);
        const isPureDummy =
          Array.isArray(parsedLegacy) &&
          parsedLegacy.length === 4 &&
          parsedLegacy.every((h: Habit) =>
            ['habit-1', 'habit-2', 'habit-3', 'habit-4'].includes(h.id)
          );
        if (isPureDummy) {
          localStorage.removeItem('focuspulse_habits_v2');
          localStorage.removeItem('focuspulse_logs_v2');
          localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify([]));
          localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify({}));
          return [];
        }
      } catch {
        // ignore
      }
    }

    const saved = localStorage.getItem(HABIT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading habits:', e);
  }
  return [];
}

export function saveHabitsToStorage(habits: Habit[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error('Error saving habits:', e);
  }
}

export function loadLogsFromStorage(): HabitLogsMap {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading logs:', e);
  }
  return {};
}

export function saveLogsToStorage(logs: HabitLogsMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving logs:', e);
  }
}

export function clearAllStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('focuspulse_habits_v2');
    localStorage.removeItem('focuspulse_logs_v2');
    localStorage.removeItem(HABIT_STORAGE_KEY);
    localStorage.removeItem(LOGS_STORAGE_KEY);
    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify({}));
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
}

/**
 * Calculates current consecutive streak, longest streak, and completion statistics
 * using strictly real user data (zero hardcoded minimum streaks or pre-creation penalties).
 */
export function calculateStreakStats(habits: Habit[], logs: HabitLogsMap): UserStats {
  const activeHabits = habits.filter((h) => !h.archived);
  if (activeHabits.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate7d: 0,
      completionRate30d: 0,
      perfectDaysCount: 0,
    };
  }

  let totalCompletions = 0;
  let perfectDaysCount = 0;

  // Count total completions across all recorded logs
  Object.values(logs).forEach((log) => {
    if (log.completedHabitIds) {
      totalCompletions += log.completedHabitIds.length;
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find earliest date a habit was created or logged so we never evaluate days before the user started
  const earliestCreatedKey = activeHabits.reduce((minKey, h) => {
    const k = getHabitCreatedDateKey(h);
    return k < minKey ? k : minKey;
  }, formatDateKey(today));

  const logKeys = Object.keys(logs).filter(
    (k) => (logs[k]?.completedHabitIds?.length || 0) > 0
  );
  const earliestLogKey = logKeys.length > 0 ? logKeys.sort()[0] : earliestCreatedKey;
  const earliestActiveKey =
    earliestLogKey < earliestCreatedKey ? earliestLogKey : earliestCreatedKey;

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  const daysToCheck = 120;
  const dayStates: Array<'active' | 'missed' | 'free'> = [];

  for (let i = 0; i < daysToCheck; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = formatDateKey(d);

    if (dateKey < earliestActiveKey) {
      break;
    }

    const dayLog = logs[dateKey];
    const skippedIds = dayLog?.skippedHabitIds || [];
    const completedIds = dayLog?.completedHabitIds || [];

    const habitsDue = activeHabits.filter(
      (h) => isHabitDueOnDate(h, dateKey, logs, true) && !skippedIds.includes(h.id)
    );

    if (habitsDue.length === 0) {
      if (completedIds.length > 0) {
        dayStates.push('active');
      } else {
        dayStates.push('free');
      }
      continue;
    }

    const completedDueCount = completedIds.filter((id) =>
      habitsDue.some((h) => h.id === id)
    ).length;

    if (completedDueCount >= habitsDue.length && habitsDue.length > 0) {
      perfectDaysCount++;
    }

    if (completedDueCount > 0 || completedIds.length > 0) {
      dayStates.push('active');
    } else {
      dayStates.push('missed');
    }
  }

  // Calculate current streak from today (index 0) or yesterday (index 1 if today is still in progress)
  let startIndex = 0;
  if (dayStates.length > 0 && dayStates[0] !== 'active') {
    startIndex = 1;
  }

  for (let i = startIndex; i < dayStates.length; i++) {
    if (dayStates[i] === 'active') {
      currentStreak++;
    } else if (dayStates[i] === 'free') {
      // Scheduled rest day preserves streak without inflating count
      continue;
    } else {
      break;
    }
  }

  // Calculate longest streak chronologically
  for (let i = dayStates.length - 1; i >= 0; i--) {
    if (dayStates[i] === 'active') {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (dayStates[i] === 'free') {
      continue;
    } else {
      runningStreak = 0;
    }
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Calculate adherence rate over a window of days (only counting days since habit creation)
  const calcRate = (days: number): number => {
    let totalScheduled = 0;
    let totalDone = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = formatDateKey(d);
      if (dateKey < earliestActiveKey) continue;

      const dayLog = logs[dateKey];
      const skippedIds = dayLog?.skippedHabitIds || [];
      const habitsDue = activeHabits.filter(
        (h) => isHabitDueOnDate(h, dateKey, logs, true) && !skippedIds.includes(h.id)
      );
      totalScheduled += habitsDue.length;

      if (dayLog && dayLog.completedHabitIds) {
        totalDone += dayLog.completedHabitIds.filter((id) =>
          habitsDue.some((h) => h.id === id)
        ).length;
      }
    }
    return totalScheduled === 0
      ? 0
      : Math.min(100, Math.round((totalDone / totalScheduled) * 100));
  };

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate7d: calcRate(7),
    completionRate30d: calcRate(30),
    perfectDaysCount,
  };
}

/**
 * Calculates current streak for a single specific habit
 */
export function getHabitStreak(habitId: string, logs: HabitLogsMap): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;

  const todayKey = formatDateKey(today);
  const todayCompleted = logs[todayKey]?.completedHabitIds?.includes(habitId);

  const checkDate = new Date(today);
  if (!todayCompleted) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const key = formatDateKey(checkDate);
    if (logs[key]?.completedHabitIds?.includes(habitId)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (logs[key]?.skippedHabitIds?.includes(habitId)) {
      // Excused rest day preserves streak
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export interface Habit7DayStats {
  percentage: number;
  completedCount: number;
  totalScheduled: number;
  days: Array<{
    dateKey: string;
    dayLetter: string;
    isCompleted: boolean;
    isSkipped: boolean;
    isScheduled: boolean;
    isToday: boolean;
  }>;
}

/**
 * Calculates completion rate and day-by-day status for a specific habit over the last 7 days
 */
export function getHabit7DayStats(habit: Habit, logs: HabitLogsMap): Habit7DayStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateKey(today);

  let completedCount = 0;
  let totalScheduled = 0;
  const days: Habit7DayStats['days'] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = formatDateKey(d);
    const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isCompleted = !!logs[dateKey]?.completedHabitIds?.includes(habit.id);
    const isSkipped = !!logs[dateKey]?.skippedHabitIds?.includes(habit.id);
    const isScheduled =
      isHabitDueOnDate(habit, dateKey, logs, true) && !isSkipped;

    if (isScheduled) {
      totalScheduled++;
    }
    if (isCompleted) {
      completedCount++;
    }

    days.push({
      dateKey,
      dayLetter,
      isCompleted,
      isSkipped,
      isScheduled,
      isToday: dateKey === todayKey,
    });
  }

  const denominator = totalScheduled > 0 ? totalScheduled : 1;
  const percentage =
    totalScheduled === 0 && completedCount === 0
      ? 0
      : Math.min(100, Math.round((completedCount / denominator) * 100));

  return {
    percentage,
    completedCount,
    totalScheduled,
    days,
  };
}

export const MILESTONES: Milestone[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Complete your first habit and ignite daily momentum.',
    requiredStreak: 1,
    icon: 'Sparkles',
    tier: 'bronze',
  },
  {
    id: 'momentum-3',
    title: 'Consistency Spark',
    description: 'Maintain a 3-day consecutive active streak.',
    requiredStreak: 3,
    icon: 'Flame',
    tier: 'bronze',
  },
  {
    id: 'week-warrior',
    title: 'One-Week Rhythm',
    description: 'Complete habits for 7 consecutive days across a full week.',
    requiredStreak: 7,
    icon: 'ShieldCheck',
    tier: 'silver',
  },
  {
    id: 'fortnight-focus',
    title: 'Two-Week Anchor',
    description: '14 days of unbroken daily discipline.',
    requiredStreak: 14,
    icon: 'Zap',
    tier: 'silver',
  },
  {
    id: 'monthly-master',
    title: '30-Day Identity Shift',
    description: '30 consecutive days — your routines are now automatic.',
    requiredStreak: 30,
    icon: 'Trophy',
    tier: 'gold',
  },
  {
    id: 'centurion-60',
    title: '60-Day Standard',
    description: '60 consecutive days of personal accountability.',
    requiredStreak: 60,
    icon: 'Crown',
    tier: 'platinum',
  },
];

export interface NotificationSettings {
  aggressiveMode: boolean;
  morningPlanningReminder: boolean;
  morningPlanningTime: string;
  overdueNagging: boolean;
  overdueNagIntervalMinutes: number;
  middayCheckinReminder: boolean;
  middayCheckinTime: string;
  eveningStreakSaver: boolean;
  eveningStreakSaverTime: string;
  soundAlertsEnabled: boolean;
  vibrationEnabled: boolean;
  inAppBannerAlerts: boolean;
}

export const NOTIFICATION_SETTINGS_KEY = 'focuspulse_notification_settings_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  aggressiveMode: true,
  morningPlanningReminder: true,
  morningPlanningTime: '08:00',
  overdueNagging: true,
  overdueNagIntervalMinutes: 15,
  middayCheckinReminder: true,
  middayCheckinTime: '13:00',
  eveningStreakSaver: true,
  eveningStreakSaverTime: '20:30',
  soundAlertsEnabled: true,
  vibrationEnabled: true,
  inAppBannerAlerts: true,
};

export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading notification settings:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving notification settings:', e);
  }
}
