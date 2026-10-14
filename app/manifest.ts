import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'FocusPulse · Habit Accountability & Reminders',
    short_name: 'FocusPulse',
    description: 'Personal reminder and accountability habit tracker with push notifications, daily streaks, and progress visualization dashboards.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#070A10',
    theme_color: '#090D16',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
