'use client';

import React from 'react';
import { Bell, BellOff, Volume2, VolumeX, Plus, Sparkles, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-[#070A10]/95 backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('habits')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/15 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-[#070A10]">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                FocusPulse
                <span className="hidden sm:inline-block text-[9px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  HABITS
                </span>
              </span>
            </div>
          </button>
        </div>

        {/* Minimalist Single-Line Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('habits')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'habits'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Daily Checklist
          </button>
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'pomodoro'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>Pomodoro Focus</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Analytics & Heatmap
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'milestones'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'reminders'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Settings & Sound
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Install Guide Trigger */}
          <button
            onClick={onOpenMobileInstall}
            title="Install on Mobile Phone"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>

          {/* Audio Chime Mute Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
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
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
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

          {/* Accountability Check-In Button */}
          <button
            onClick={onOpenCheckIn}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors whitespace-nowrap"
          >
            Check In
          </button>

          {/* Primary Action: + New Habit */}
          <button
            onClick={onOpenNewHabit}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-[0.98] transition-all whitespace-nowrap shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Habit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
