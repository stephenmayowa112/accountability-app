export type HabitCategory = 'health' | 'mindset' | 'focus' | 'fitness' | 'routine';

export type ItemPriority = 'high' | 'medium' | 'normal';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  timeOfDay: string; // e.g. "08:30" (24h)
  reminderEnabled: boolean;
  promptMessage: string; // Accountability prompt, e.g. "Did you complete your 20-min reading session?"
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  createdAt: string; // ISO string
  color: string; // Hex color for category accent
  archived?: boolean;
  itemType?: 'habit' | 'task'; // 'habit' = recurring schedule, 'task' = one-off daily task
  targetDate?: string; // YYYY-MM-DD for one-off daily tasks
  priority?: ItemPriority;
  estimatedMinutes?: number; // Target Pomodoro focus duration in minutes
  subtasks?: Subtask[];
}

export interface DayLog {
  completedHabitIds: string[];
  skippedHabitIds?: string[];
  note?: string;
  reflectionMood?: 'great' | 'steady' | 'struggled';
  focusMinutes?: number;
}

export type HabitLogsMap = Record<string, DayLog>; // key is "YYYY-MM-DD"

export interface Milestone {
  id: string;
  title: string;
  description: string;
  requiredStreak: number;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate7d: number;
  completionRate30d: number;
  perfectDaysCount: number;
}
