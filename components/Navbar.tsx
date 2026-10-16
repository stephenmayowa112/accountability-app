'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Plus,
  Sparkles,
  Download,
  Menu,
  X,
  CheckCircle2,
  Timer,
  BarChart3,
  Trophy,
  Settings,
  Smartphone,
  Check,
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

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile menu is open
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

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070A10]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => handleTabSelect('habits')}
              aria-label="FocusPulse Home"
              className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/15 group-hover:scale-105 transition-transform">
                <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-[#070A10]">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                  FocusPulse
                </span>
                <span className="hidden md:inline-block text-[9px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  HABITS
                </span>
              </div>
            </button>
          </div>

          {/* Minimalist Single-Line Nav Links (Desktop LG+) */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => handleTabSelect('habits')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'habits'
                  ? 'bg-slate-800/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Daily Checklist
            </button>
            <button
              onClick={() => handleTabSelect('pomodoro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'pomodoro'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>Pomodoro Focus</span>
            </button>
            <button
              onClick={() => handleTabSelect('analytics')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-slate-800/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Analytics & Heatmap
            </button>
            <button
              onClick={() => handleTabSelect('milestones')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'milestones'
                  ? 'bg-slate-800/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Milestones
            </button>
            <button
              onClick={() => handleTabSelect('reminders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'reminders'
                  ? 'bg-slate-800/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Settings & Sound
            </button>
          </nav>

          {/* Actions & Responsive Right Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop / Tablet: Mobile Install Guide Trigger */}
            <button
              onClick={onOpenMobileInstall}
              title="Install on Mobile Phone"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </button>

            {/* Audio Chime Mute Toggle (Always accessible) */}
            <button
              onClick={onToggleSound}
              aria-label={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
              title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors active:scale-95"
            >
              {soundMuted ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-slate-300" />
              )}
            </button>

            {/* Quick Notification Bell (Shown on sm+ to prevent phone navbar overflow) */}
            <button
              onClick={onRequestNotifications}
              aria-label="Notification settings"
              title={
                notificationPermission === 'granted'
                  ? 'Push notifications enabled'
                  : 'Click to enable push reminders'
              }
              className={`hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border transition-colors active:scale-95 ${
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

            {/* Desktop Only: Check In Button */}
            <button
              onClick={onOpenCheckIn}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors whitespace-nowrap"
            >
              Check In
            </button>

            {/* Primary Action: + Habit (Responsive text on mobile) */}
            <button
              onClick={onOpenNewHabit}
              className="flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-indigo-600 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all whitespace-nowrap shadow-sm shadow-indigo-600/30"
              aria-label="Add new habit"
            >
              <Plus className="h-4 w-4" />
              <span className="inline sm:hidden">Habit</span>
              <span className="hidden sm:inline">Add Habit</span>
            </button>

            {/* Mobile Menu Hamburger Toggle (Shown on mobile & tablet < lg) */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors active:scale-95"
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
          {/* Scrollable menu content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-28">
            {/* Quick Stats or Status Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D121F] border border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-300">
                  FocusPulse Active
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {streak !== undefined && streak > 0 && (
                  <span className="text-amber-400 font-mono font-medium">
                    🔥 {streak}d streak
                  </span>
                )}
                {habitCount !== undefined && (
                  <span className="text-slate-400 font-mono">
                    {habitCount} {habitCount === 1 ? 'habit' : 'habits'}
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-2">
                Navigation
              </span>

              <button
                onClick={() => handleTabSelect('habits')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === 'habits'
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      activeTab === 'habits'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">Daily Checklist</div>
                    <div className="text-[11px] text-slate-400">Track and tick off today’s habits</div>
                  </div>
                </div>
                {activeTab === 'habits' && (
                  <span className="text-[10px] font-mono bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabSelect('pomodoro')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === 'pomodoro'
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      activeTab === 'pomodoro'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Timer className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">Pomodoro Focus Mode</div>
                    <div className="text-[11px] text-slate-400">Fullscreen timer & ambient soundscapes</div>
                  </div>
                </div>
                {activeTab === 'pomodoro' && (
                  <span className="text-[10px] font-mono bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabSelect('analytics')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      activeTab === 'analytics'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">Analytics & Heatmap</div>
                    <div className="text-[11px] text-slate-400">Consistency charts & day-by-day logs</div>
                  </div>
                </div>
                {activeTab === 'analytics' && (
                  <span className="text-[10px] font-mono bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabSelect('milestones')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === 'milestones'
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      activeTab === 'milestones'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">Milestones & Streaks</div>
                    <div className="text-[11px] text-slate-400">Unlock achievement badges & records</div>
                  </div>
                </div>
                {activeTab === 'milestones' && (
                  <span className="text-[10px] font-mono bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabSelect('reminders')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeTab === 'reminders'
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      activeTab === 'reminders'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">Settings & Sound</div>
                    <div className="text-[11px] text-slate-400">Web push, sound chimes & backup</div>
                  </div>
                </div>
                {activeTab === 'reminders' && (
                  <span className="text-[10px] font-mono bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>

            {/* Quick Controls Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-2">
                Quick Controls
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Audio chime toggle */}
                <button
                  onClick={onToggleSound}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                      soundMuted
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {soundMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">Audio Sounds</div>
                    <div className="text-[10px] text-slate-400">
                      {soundMuted ? 'Muted' : 'Enabled'}
                    </div>
                  </div>
                </button>

                {/* Notifications setup */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRequestNotifications();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-left transition-colors"
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                      notificationPermission === 'granted'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {notificationPermission === 'granted' ? (
                      <Bell className="h-3.5 w-3.5" />
                    ) : (
                      <BellOff className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">Push Alerts</div>
                    <div className="text-[10px] text-slate-400">
                      {notificationPermission === 'granted' ? 'Allowed' : 'Configure'}
                    </div>
                  </div>
                </button>

                {/* Accountability Check-in */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCheckIn();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-left transition-colors"
                >
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-indigo-500/20 text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-indigo-200 truncate">Check In</div>
                    <div className="text-[10px] text-indigo-400">Accountability</div>
                  </div>
                </button>

                {/* Mobile Install Guide */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMobileInstall();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-left transition-colors"
                >
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-cyan-500/20 text-cyan-300">
                    <Download className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-cyan-200 truncate">Install App</div>
                    <div className="text-[10px] text-cyan-400">PWA on Phone</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenNewHabit();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Habit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
