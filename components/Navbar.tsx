'use client';

import React from 'react';
import { Bell, BellOff, Volume2, VolumeX, Plus, Sparkles, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { NotificationPermissionState } from '@/lib/notifications';

interface NavbarProps {
  activeTab: 'habits' | 'analytics' | 'milestones' | 'reminders';
  setActiveTab: (tab: 'habits' | 'analytics' | 'milestones' | 'reminders') => void;
  onOpenNewHabit: () => void;
  onOpenCheckIn: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  notificationPermission: NotificationPermissionState;
  onRequestNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewHabit,
  onOpenCheckIn,
  soundMuted,
  onToggleSound,
  notificationPermission,
  onRequestNotifications,
}) => {
  const { isInstallable, install, isIOS } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070A10]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('habits')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#070A10]">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                FocusPulse
                <span className="hidden sm:inline-block text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  HABITS
                </span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('habits')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'habits'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Daily Checklist
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Analytics & Heatmap
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'milestones'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'reminders'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Reminders & Sound
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio Chime Mute Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            {soundMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-slate-300" />}
          </button>

          {/* Quick Notification Permission Bell */}
          <button
            onClick={onRequestNotifications}
            aria-label="Notification settings"
            title={
              notificationPermission === 'granted'
                ? 'Push notifications enabled'
                : 'Click to enable push reminders'
            }
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              notificationPermission === 'granted'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-slate-800 bg-slate-900/60 text-amber-400 hover:bg-slate-800/60'
            }`}
          >
            {notificationPermission === 'granted' ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </button>

          {/* PWA Install Trigger if installable */}
          {isInstallable && (
            <button
              onClick={install}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Install App
            </button>
          )}

          {/* Accountability Check-In Button */}
          <button
            onClick={onOpenCheckIn}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors whitespace-nowrap"
          >
            Check In
          </button>

          {/* Primary Action: + New Habit */}
          <button
            onClick={onOpenNewHabit}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Habit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
