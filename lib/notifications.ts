// FocusPulse Web Push & Browser Notification Manager
import { playAggressiveAlertTone, playReminderTone, triggerDeviceVibration } from '@/lib/sound';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Also register service worker if possible
      registerServiceWorker();
    }
    return permission as NotificationPermissionState;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

export type ExtendedNotificationOptions = NotificationOptions & {
  renotify?: boolean;
  requireInteraction?: boolean;
  vibrate?: number[];
  badge?: string;
};

export async function sendWebNotification(title: string, options?: ExtendedNotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: ExtendedNotificationOptions = {
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'focuspulse-habit-reminder',
    renotify: true,
    ...options,
  };

  try {
    // Try service worker registration first (works better on mobile PWAs)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, defaultOptions as NotificationOptions);
        return true;
      }
    }
    // Fallback to standard window Notification
    new Notification(title, defaultOptions as NotificationOptions);
    return true;
  } catch (e) {
    console.error('Error sending web notification:', e);
    try {
      new Notification(title, defaultOptions as NotificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Aggressive Notification Sender
 * - Keeps notification pinned on screen with requireInteraction: true
 * - Vibrates the device if supported
 * - Plays sharp dual-harmonic alert tone
 * - Forces tag renotification
 */
export async function sendAggressiveNotification(
  title: string,
  options?: ExtendedNotificationOptions & { playSound?: boolean; vibratePattern?: number[] }
): Promise<boolean> {
  const { playSound = true, vibratePattern = [250, 100, 250, 100, 400], ...restOptions } = options || {};

  // Trigger aggressive sound immediately
  if (playSound) {
    playAggressiveAlertTone();
  }

  // Trigger haptic vibration on phone
  triggerDeviceVibration(vibratePattern);

  // Send persistent notification with requireInteraction: true
  const aggressiveOpts: ExtendedNotificationOptions = {
    requireInteraction: true,
    tag: 'focuspulse-urgent-alert',
    renotify: true,
    ...restOptions,
  };

  return sendWebNotification(title, aggressiveOpts);
}

/**
 * Aggressive Morning Daily Kickoff: Prompts user to plan & set daily tasks
 */
export async function sendDailyPlanningReminder(): Promise<boolean> {
  return sendAggressiveNotification('📋 FocusPulse: Set Your Tasks for Today!', {
    body: 'Your day has begun! Plan your focus routines and target times now so you stay on track and maintain your streak.',
    tag: 'focuspulse-daily-planning',
  });
}

/**
 * Aggressive Overdue Task Nag: Repeatedly alerts for tasks past scheduled time until completed
 */
export async function sendOverdueTaskAlert(
  taskTitle: string,
  timeOfDay: string,
  promptMsg?: string
): Promise<boolean> {
  return sendAggressiveNotification(`⚠️ OVERDUE: "${taskTitle}" (${timeOfDay})`, {
    body: promptMsg || `You scheduled this for ${timeOfDay} and it's still pending. Take 2 minutes to complete it now!`,
    tag: `focuspulse-overdue-${taskTitle.replace(/\s+/g, '-').toLowerCase()}`,
  });
}

/**
 * Aggressive Midday Focus Check
 */
export async function sendMiddayNudgeAlert(pendingCount: number): Promise<boolean> {
  return sendAggressiveNotification(`⚡ Midday Check-in: ${pendingCount} Task${pendingCount > 1 ? 's' : ''} Remaining!`, {
    body: `Halfway through the day! Don't let your scheduled habits pile up. Tackle one right now.`,
    tag: 'focuspulse-midday-nudge',
  });
}

/**
 * Aggressive Evening Streak Saver: Emergency warning before midnight
 */
export async function sendStreakSaverAlert(pendingCount: number, currentStreak: number): Promise<boolean> {
  const streakText = currentStreak > 0 ? `Protect your ${currentStreak}-day streak!` : 'Start your streak today!';
  return sendAggressiveNotification(`🔥 STREAK DANGER: ${pendingCount} Task${pendingCount > 1 ? 's' : ''} Pending!`, {
    body: `Evening is here! ${streakText} Complete remaining habits before midnight to stay consistent.`,
    tag: 'focuspulse-streak-saver',
    vibratePattern: [300, 100, 300, 100, 500],
  });
}

/**
 * Send standard test alert
 */
export async function sendTestNotification(): Promise<boolean> {
  playReminderTone();
  return sendWebNotification('FocusPulse Accountability Active', {
    body: 'Push reminders are armed! You will receive timely prompts for your daily habits.',
    tag: 'focuspulse-test',
  });
}

/**
 * Send an immediate aggressive test notification (audible, vibrating, persistent)
 */
export async function sendAggressiveTestNotification(): Promise<boolean> {
  return sendAggressiveNotification('🚨 FocusPulse RELENTLESS Alert Active!', {
    body: 'Aggressive mode is armed! You will receive urgent prompts to set daily tasks and relentless nudges for overdue habits.',
    tag: 'focuspulse-aggressive-test',
  });
}
