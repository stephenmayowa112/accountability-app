'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Plus,
  Download,
  Menu,
  X,
  CheckCircle2,
  Timer,
  BarChart3,
  Trophy,
  Settings,
  Flame,
} from 'lucide-react';
import { NotificationPermissionState } from '@/lib/notifications';

interface NavbarProps {
  activeTab: 'habits' | 'pomodoro' | 'analytics' | 'milestones' | 'reminders';
  setActiveTab: (tab: 'habits' | 'pomodoro' | 'analytics' | 'milestones' | 'reminders') => void;
  onOpenNewHabit: () => void;
  onOpenCheckIn: () => void;
  onOpenMobileInstall: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  notificationPermission: NotificationPermissionState;
  onRequestNotifications: () => void;
  habitCount?: number;
  streak?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewHabit,
  onOpenCheckIn,
  onOpenMobileInstall,
  soundMuted,
  onToggleSound,
  notificationPermission,
  onRequestNotifications,
  habitCount,
  streak,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleTabSelect = (tab: 'habits' | 'pomodoro' | 'analytics' | 'milestones' | 'reminders') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navItems: Array<{
    id: 'habits' | 'pomodoro' | 'analytics' | 'milestones' | 'reminders';
    label: string;
  }> = [
    { id: 'habits', label: 'Daily Checklist' },
    { id: 'pomodoro', label: 'Focus Timer' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'reminders', label: 'Alerts & Settings' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070A10]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-4 lg:gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            onClick={() => handleTabSelect('habits')}
            aria-label="FocusPulse Home"
            className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-indigo-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
          >
            FocusPulse
          </button>

          {/* Zone 2: Clean Typographic Navigation Links (Desktop LG+) */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Mobile Drawer Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewHabit}
              className="flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 shadow-sm shadow-indigo-600/20"
              aria-label="Add new habit or task"
            >
              <Plus className="h-4 w-4" />
              <span>New Item</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors active:scale-95"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Full Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="lg:hidden fixed inset-0 top-14 sm:top-16 z-50 bg-[#070A10]/98 backdrop-blur-xl border-b border-slate-800 flex flex-col animate-fade-in"
        >
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-28">
            {/* Summary Strip (unboxed clean metadata) */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#0D121F] border border-slate-800/80 text-xs text-slate-300">
              <span className="font-medium text-white">Daily Workspace</span>
              <div className="flex items-center gap-2 font-mono tabular-nums text-slate-400">
                {streak !== undefined && streak > 0 && (
                  <>
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <Flame className="h-3.5 w-3.5" />
                      {streak}d streak
                    </span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span>
                  {habitCount || 0} {habitCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            {/* Navigation Destinations */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-400 px-2 block mb-2">
                Views
              </span>

              {[
                {
                  id: 'habits' as const,
                  title: 'Daily Checklist',
                  subtitle: 'Schedule, habits, and daily tasks',
                  icon: CheckCircle2,
                },
                {
                  id: 'pomodoro' as const,
                  title: 'Focus Timer',
                  subtitle: 'Pomodoro sessions and ambient soundscapes',
                  icon: Timer,
                },
                {
                  id: 'analytics' as const,
                  title: 'Analytics & Heatmap',
                  subtitle: '365-day activity matrix and adherence metrics',
                  icon: BarChart3,
                },
                {
                  id: 'milestones' as const,
                  title: 'Milestones',
                  subtitle: 'Consecutive streak records and progression',
                  icon: Trophy,
                },
                {
                  id: 'reminders' as const,
                  title: 'Alerts & Settings',
                  subtitle: 'Persistent notifications, audio, and data backup',
                  icon: Settings,
                },
              ].map((dest) => {
                const Icon = dest.icon;
                const isActive = activeTab === dest.id;
                return (
                  <button
                    key={dest.id}
                    onClick={() => handleTabSelect(dest.id)}
                    className={`w-full min-h-[56px] flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-indigo-600/15 border border-indigo-500/40 text-white'
                        : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">{dest.title}</div>
                        <div className="text-xs text-slate-400">{dest.subtitle}</div>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-xs font-medium text-indigo-400">Current</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Utility Controls */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400 px-2 block">
                Quick Controls
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={onToggleSound}
                  className="min-h-[52px] flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      soundMuted
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {soundMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">Audio Chimes</div>
                    <div className="text-[11px] text-slate-400">
                      {soundMuted ? 'Muted' : 'Active'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRequestNotifications();
                  }}
                  className="min-h-[52px] flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      notificationPermission === 'granted'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {notificationPermission === 'granted' ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">Push Alerts</div>
                    <div className="text-[11px] text-slate-400">
                      {notificationPermission === 'granted' ? 'Enabled' : 'Configure'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCheckIn();
                  }}
                  className="min-h-[52px] flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">Daily Review</div>
                    <div className="text-[11px] text-slate-400">Reflection & log</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMobileInstall();
                  }}
                  className="min-h-[52px] flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-cyan-500/10 text-cyan-400">
                    <Download className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">Install App</div>
                    <div className="text-[11px] text-slate-400">Home screen guide</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
