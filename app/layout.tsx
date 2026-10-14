import type {Metadata, Viewport} from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
});

export const viewport: Viewport = {
  themeColor: '#090D16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'FocusPulse · Habit Accountability & Reminders',
  description: 'Personal reminder and accountability habit tracker with push notifications, streaks, and progress visualization dashboards.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FocusPulse',
  },
  openGraph: {
    title: 'FocusPulse · Habit Accountability & Reminders',
    description: 'Personal reminder and accountability habit tracker with push notifications, streaks, and progress visualization dashboards.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FocusPulse · Habit Accountability & Reminders',
    description: 'Personal reminder and accountability habit tracker with push notifications, streaks, and progress visualization dashboards.',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`dark scroll-smooth ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#070A10] text-slate-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200"
      >
        {children}
      </body>
    </html>
  );
}
