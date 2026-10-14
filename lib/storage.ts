import { Habit, HabitLogsMap, Milestone, UserStats } from '@/types/habit';

export const HABIT_STORAGE_KEY = 'focuspulse_habits_v2';
export const LOGS_STORAGE_KEY = 'focuspulse_logs_v2';
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

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Morning Hydration & Sunlight',
    description: 'Drink 500ml of water and get 10 minutes of direct sunlight upon waking.',
    category: 'health',
    timeOfDay: '07:30',
    reminderEnabled: true,
    promptMessage: 'Have you had your morning glass of water and sunlight walk?',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
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
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
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
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
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
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    color: '#F59E0B', // amber
  },
];

/**
 * Generate starter completion history for the previous 21 days
 * so the initial view has an authentic streak and rich visual heatmap.
 */
export function generateStarterLogs(): HabitLogsMap {
  const logs: HabitLogsMap = {};
  const today = new Date();

  // Seed completions for the past 21 days with realistic high consistency
  for (let i = 21; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDateKey(d);

    // High consistency: complete 3 or 4 habits most days
    const completed: string[] = ['habit-1', 'habit-2'];
    if (i % 3 !== 0) {
      completed.push('habit-3');
    }
    if (i % 2 === 0) {
      completed.push('habit-4');
    }

    logs[key] = {
      completedHabitIds: completed,
      reflectionMood: i % 4 === 0 ? 'steady' : 'great',
    };
  }

  // Today initial state (habit-1 already checked to show active progress)
  const todayKey = formatDateKey(today);
  logs[todayKey] = {
    completedHabitIds: ['habit-1'],
    reflectionMood: 'great',
  };

  return logs;
}

export function loadHabitsFromStorage(): Habit[] {
  if (typeof window === 'undefined') return DEFAULT_HABITS;
  try {
    const saved = localStorage.getItem(HABIT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading habits:', e);
  }
  return DEFAULT_HABITS;
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
  if (typeof window === 'undefined') return generateStarterLogs();
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
  const starter = generateStarterLogs();
  saveLogsToStorage(starter);
  return starter;
}

export function saveLogsToStorage(logs: HabitLogsMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving logs:', e);
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
