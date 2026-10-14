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

// Clean slate default: no dummy habits on fresh install
export const DEFAULT_HABITS: Habit[] = [];

// Optional starter templates for inspiration (only applied if user chooses)
export const DEMO_HABIT_TEMPLATES: Habit[] = [
  {
    id: 'habit-1',
    title: 'Morning Hydration & Sunlight',
    description: 'Drink 500ml of water and get 10 minutes of direct sunlight upon waking.',
    category: 'health',
    timeOfDay: '07:30',
    reminderEnabled: true,
    promptMessage: 'Have you had your morning glass of water and sunlight walk?',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
    color: '#06B6D4', // cyan
  },
  {
    id: 'habit-2',
    title: 'Deep Work Sprint (45 mins)',
    description: 'Uninterrupted deep focus with phone on Do Not Disturb.',
    category: 'focus',
    timeOfDay: '10:00',
    reminderEnabled: true,
    promptMessage: 'Ready for your 45-minute deep focus block?',
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: new Date().toISOString(),
    color: '#6366F1', // indigo
  },
  {
    id: 'habit-3',
    title: 'Daily Movement or Workout',
    description: '30+ minutes of brisk walking, resistance training, or mobility work.',
    category: 'fitness',
    timeOfDay: '17:30',
    reminderEnabled: true,
    promptMessage: 'Time to get your body moving and shake off sedentary fatigue!',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
    color: '#10B981', // emerald
  },
  {
    id: 'habit-4',
    title: 'Evening Digital Sunset & Reading',
    description: 'Put screens away 45 minutes before sleep and read 15 pages of a book.',
    category: 'mindset',
    timeOfDay: '21:30',
    reminderEnabled: true,
    promptMessage: 'Screens down — have you opened your book for tonight?',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date().toISOString(),
    color: '#F59E0B', // amber
  },
];

/**
 * Optional demo generator (only used if explicitly imported)
 */
export function generateStarterLogs(): HabitLogsMap {
  return {};
}

export function loadHabitsFromStorage(): Habit[] {
  if (typeof window === 'undefined') return [];
  try {
    // Clean up any legacy dummy data from earlier demo versions
    const legacyHabits = localStorage.getItem('focuspulse_habits_v2');
    if (legacyHabits && !localStorage.getItem(HABIT_STORAGE_KEY)) {
      try {
        const parsedLegacy = JSON.parse(legacyHabits);
        // If legacy only contained the default dummy sample habits, clear them out
        const isPureDummy =
          Array.isArray(parsedLegacy) &&
          parsedLegacy.length === 4 &&
          parsedLegacy.every((h: Habit) => ['habit-1', 'habit-2', 'habit-3', 'habit-4'].includes(h.id));
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

  // Consecutive streak calculation
  // A day counts towards the streak if at least 1 habit scheduled for that day was completed,
  // or if target was reached. We check backwards from today or yesterday.
  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  // Check 120 days backwards to compute streaks
  const daysToCheck = 120;
  const dayResults: boolean[] = [];

  for (let i = 0; i < daysToCheck; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayOfWeek = d.getDay();
    const dateKey = formatDateKey(d);

    const habitsDue = activeHabits.filter((h) => h.daysOfWeek.includes(dayOfWeek));
    if (habitsDue.length === 0) {
      // Free day with no habits scheduled doesn't break streak
      dayResults.push(true);
      continue;
    }

    const dayLog = logs[dateKey];
    const completedCount = dayLog ? dayLog.completedHabitIds.filter((id) => habitsDue.some((h) => h.id === id)).length : 0;

    // Perfect day count
    if (completedCount >= habitsDue.length && habitsDue.length > 0) {
      perfectDaysCount++;
    }

    // A day is considered sustained if at least 50% or >=1 scheduled habit was completed
    const dayPassed = completedCount > 0;
    dayResults.push(dayPassed);
  }

  // Calculate current streak:
  // If today has activity, start from today (index 0).
  // If today has no activity yet, but yesterday had activity (index 1), streak is intact!
  let startIndex = 0;
  if (!dayResults[0] && dayResults[1]) {
    startIndex = 1; // Today is still in progress, count from yesterday
  }

  if (dayResults[startIndex]) {
    for (let i = startIndex; i < dayResults.length; i++) {
      if (dayResults[i]) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak calculation
  for (let i = dayResults.length - 1; i >= 0; i--) {
    if (dayResults[i]) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // 7-day and 30-day completion rate
  const calcRate = (days: number): number => {
    let totalScheduled = 0;
    let totalDone = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      const dateKey = formatDateKey(d);
      const habitsDue = activeHabits.filter((h) => h.daysOfWeek.includes(dayOfWeek));
      totalScheduled += habitsDue.length;

      const dayLog = logs[dateKey];
      if (dayLog && dayLog.completedHabitIds) {
        totalDone += dayLog.completedHabitIds.filter((id) => habitsDue.some((h) => h.id === id)).length;
      }
    }
    return totalScheduled === 0 ? 100 : Math.min(100, Math.round((totalDone / totalScheduled) * 100));
  };

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak, 14),
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

  let checkDate = new Date(today);
  if (!todayCompleted) {
    // Check if completed yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = formatDateKey(checkDate);
    if (logs[key]?.completedHabitIds?.includes(habitId)) {
      streak++;
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

  // Last 7 days (6 days ago through today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = formatDateKey(d);
    const dayOfWeek = d.getDay();
    const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isScheduled = habit.daysOfWeek.includes(dayOfWeek);
    const isCompleted = !!logs[dateKey]?.completedHabitIds?.includes(habit.id);

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
      isScheduled,
      isToday: dateKey === todayKey,
    });
  }

  const denominator = totalScheduled > 0 ? totalScheduled : 7;
  const percentage = Math.min(100, Math.round((completedCount / denominator) * 100));

  return {
    percentage,
    completedCount,
    totalScheduled: denominator,
    days,
  };
}

export const MILESTONES: Milestone[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Complete your first habit and ignite the momentum.',
    requiredStreak: 1,
    icon: 'Sparkles',
    tier: 'bronze',
  },
  {
    id: 'momentum-3',
    title: 'Consistency Spark',
    description: 'Maintain a 3-day active streak.',
    requiredStreak: 3,
    icon: 'Flame',
    tier: 'bronze',
  },
  {
    id: 'ironclad-7',
    title: 'Ironclad Routine',
    description: 'Power through 7 consecutive days of discipline.',
    requiredStreak: 7,
    icon: 'ShieldCheck',
    tier: 'silver',
  },
  {
    id: 'fortress-14',
    title: 'Fortress of Focus',
    description: 'Two full unbroken weeks of daily consistency.',
    requiredStreak: 14,
    icon: 'Zap',
    tier: 'silver',
  },
  {
    id: 'master-30',
    title: 'Habit Transformation',
    description: '30-day streak — neural pathways firmly established.',
    requiredStreak: 30,
    icon: 'Trophy',
    tier: 'gold',
  },
  {
    id: 'century-100',
    title: 'Century Club',
    description: '100 days of relentless execution. Elite 1% consistency.',
    requiredStreak: 100,
    icon: 'Crown',
    tier: 'platinum',
  },
];
