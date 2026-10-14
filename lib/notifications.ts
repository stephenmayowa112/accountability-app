// FocusPulse Web Push & Browser Notification Manager

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

export async function sendWebNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: NotificationOptions & { renotify?: boolean; badge?: string } = {
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
 * Send an immediate test notification so the user can verify push delivery
 */
export async function sendTestNotification(): Promise<boolean> {
  return sendWebNotification('FocusPulse Accountability Active', {
    body: 'Push reminders are armed! You will receive timely prompts for your daily habits.',
    tag: 'focuspulse-test',
  });
}
