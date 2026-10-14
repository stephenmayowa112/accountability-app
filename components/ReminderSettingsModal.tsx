'use client';

import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  X,
  Check,
  Smartphone,
} from 'lucide-react';
import {
  NotificationPermissionState,
  requestNotificationPermission,
  sendTestNotification,
} from '@/lib/notifications';
import {
  playSuccessChime,
  playCelebrationChime,
  playReminderTone,
} from '@/lib/sound';
import { Habit, HabitLogsMap } from '@/types/habit';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermissionState;
  onRefreshPermission: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  habits: Habit[];
  logs: HabitLogsMap;
  onImportData: (habits: Habit[], logs: HabitLogsMap) => void;
  onResetData: () => void;
  onOpenMobileInstall?: () => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  permission,
  onRefreshPermission,
  soundMuted,
  onToggleSound,
  habits,
  logs,
  onImportData,
  onResetData,
  onOpenMobileInstall,
}) => {
  const [testSent, setTestSent] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
    onRefreshPermission();
  };

  const handleTestNotification = async () => {
    playReminderTone();
    const sent = await sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleExportJSON = () => {
    const data = {
      app: 'FocusPulse',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      habits,
      logs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuspulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.habits && Array.isArray(parsed.habits)) {
          onImportData(parsed.habits, parsed.logs || {});
          setImportStatus('Backup restored successfully!');
          setTimeout(() => setImportStatus(null), 3500);
        } else {
          setImportStatus('Invalid backup file format');
          setTimeout(() => setImportStatus(null), 3500);
        }
      } catch (err) {
        setImportStatus('Error reading file');
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0D1424] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A0F1C] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Reminders, Audio & Accountability
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Push Notifications */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              1. Web Push Notification Status
            </span>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                      permission === 'granted'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {permission === 'granted' ? (
                      <BellRing className="h-5 w-5" />
                    ) : (
                      <BellOff className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {permission === 'granted'
                        ? 'Push Notifications Active'
                        : permission === 'denied'
                        ? 'Notifications Blocked in Browser'
                        : 'Permissions Not Yet Granted'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {permission === 'granted'
                        ? 'Browser alerts will prompt you at scheduled habit times'
                        : 'Grant permission so FocusPulse can keep you accountable'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {permission !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                  >
                    Enable Browser Push
                  </button>
                )}

                <button
                  onClick={handleTestNotification}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  {testSent ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Alert Sent!
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5 text-indigo-400" />
                      Test Alert Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Audio Synthesis */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Sound Feedback & Audio Chimes
            </span>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">Micro-Audio Effects</span>
                  <span className="text-xs text-slate-400">
                    Crisp Web Audio synthesized harmonic tones
                  </span>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    soundMuted
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {soundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {soundMuted ? 'Muted' : 'Sound On'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                <button
                  onClick={playSuccessChime}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  <Play className="h-3 w-3 text-emerald-400" />
                  Check Chime
                </button>
                <button
                  onClick={playCelebrationChime}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  <Play className="h-3 w-3 text-amber-400" />
                  Streak Chime
                </button>
                <button
                  onClick={playReminderTone}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  <Play className="h-3 w-3 text-indigo-400" />
                  Reminder Tone
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Data Persistence & Backup */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              3. Data Backup & Local Storage
            </span>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              <p className="text-xs text-slate-400">
                All streaks, logs, and habit configurations are saved safely in your browser.
                Export anytime for offline backup.
              </p>

              {importStatus && (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                  {importStatus}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  Export JSON Backup
                </button>

                <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="h-3.5 w-3.5 text-indigo-400" />
                  Restore JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    if (confirm('Clear all data? This will remove all habits and logs so the app is 100% fresh and clean from scratch.')) {
                      onResetData();
                      setImportStatus('All data cleared. Welcome to your fresh clean slate!');
                      setTimeout(() => setImportStatus(null), 3500);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All Data (Start Fresh)
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Mobile Installation */}
          {onOpenMobileInstall && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                4. Mobile Phone Installation
              </span>

              <div className="rounded-2xl bg-gradient-to-r from-cyan-950/30 to-indigo-950/30 border border-cyan-500/30 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Add to Home Screen</span>
                    <span className="text-xs text-slate-400">
                      Step-by-step instructions for iPhone and Android devices
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMobileInstall();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 whitespace-nowrap"
                >
                  View Guide
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0A0F1C] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
