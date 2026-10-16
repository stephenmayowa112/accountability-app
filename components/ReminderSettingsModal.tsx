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
  Trash2,
  X,
  Check,
  Smartphone,
  Zap,
  Clock,
  Flame,
  ShieldAlert,
  SunMedium,
  CheckCircle2,
} from 'lucide-react';
import {
  NotificationPermissionState,
  requestNotificationPermission,
  sendTestNotification,
  sendAggressiveTestNotification,
} from '@/lib/notifications';
import {
  playSuccessChime,
  playCelebrationChime,
  playReminderTone,
  playAggressiveAlertTone,
} from '@/lib/sound';
import { Habit, HabitLogsMap } from '@/types/habit';
import { NotificationSettings } from '@/lib/storage';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermissionState;
  onRefreshPermission: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  habits: Habit[];
  logs: HabitLogsMap;
  notificationSettings: NotificationSettings;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
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
  notificationSettings,
  onUpdateNotificationSettings,
  onImportData,
  onResetData,
  onOpenMobileInstall,
}) => {
  const [testSent, setTestSent] = useState(false);
  const [aggressiveTestSent, setAggressiveTestSent] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
    onRefreshPermission();
  };

  const handleTestNotification = async () => {
    playReminderTone();
    await sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleTestAggressiveNotification = async () => {
    await sendAggressiveTestNotification();
    setAggressiveTestSent(true);
    setTimeout(() => setAggressiveTestSent(false), 3000);
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    onUpdateNotificationSettings({
      ...notificationSettings,
      [key]: value,
    });
  };

  const handleExportJSON = () => {
    const data = {
      app: 'FocusPulse',
      version: '2.1',
      exportedAt: new Date().toISOString(),
      notificationSettings,
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
          if (parsed.notificationSettings) {
            onUpdateNotificationSettings(parsed.notificationSettings);
          }
          onImportData(parsed.habits, parsed.logs || {});
          setImportStatus('Backup restored successfully!');
          setTimeout(() => setImportStatus(null), 3500);
        } else {
          setImportStatus('Invalid backup file format');
          setTimeout(() => setImportStatus(null), 3500);
        }
      } catch {
        setImportStatus('Error reading file');
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0D1424] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A0F1C] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Alerts & Accountability Settings
                {notificationSettings.aggressiveMode && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                    Relentless Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Configure task planning reminders, persistent alerts, and audio
              </p>
            </div>
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
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Aggressive Alert Engine (Featured) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-rose-400" />
                Aggressive Alert & Reminders Engine
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {notificationSettings.aggressiveMode ? 'Active & Persistent' : 'Muted'}
              </span>
            </div>

            {/* Master Aggressive Mode Toggle Card */}
            <div className={`rounded-2xl border p-4.5 transition-all ${
              notificationSettings.aggressiveMode
                ? 'bg-gradient-to-br from-rose-950/30 via-slate-900 to-indigo-950/30 border-rose-500/40 shadow-lg shadow-rose-950/20'
                : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Aggressive Alert Mode</span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      notificationSettings.aggressiveMode
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {notificationSettings.aggressiveMode ? 'High Urgency' : 'Standard'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Insistently alerts you each morning to set and plan your tasks, and nags you persistently until overdue tasks are checked off.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting('aggressiveMode', !notificationSettings.aggressiveMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notificationSettings.aggressiveMode ? 'bg-rose-600' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={notificationSettings.aggressiveMode}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationSettings.aggressiveMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sub-controls when aggressive mode is configured */}
              <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-3.5">
                {/* 1. Morning Task Planning Alert */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#090E1A]/80 p-3 rounded-xl border border-slate-800/90">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <SunMedium className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Morning Task-Setting Reminder</span>
                      <span className="text-[11px] text-slate-400">
                        Prompts you to define today&apos;s habits and kickoff your plan
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <input
                      type="time"
                      value={notificationSettings.morningPlanningTime}
                      onChange={(e) => updateSetting('morningPlanningTime', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={() => updateSetting('morningPlanningReminder', !notificationSettings.morningPlanningReminder)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        notificationSettings.morningPlanningReminder
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      {notificationSettings.morningPlanningReminder ? 'Enabled' : 'Off'}
                    </button>
                  </div>
                </div>

                {/* 2. Overdue Task Persistent Nagging */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#090E1A]/80 p-3 rounded-xl border border-slate-800/90">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Overdue Task Relentless Nagging</span>
                      <span className="text-[11px] text-slate-400">
                        Repeatedly alerts for past-due tasks until completed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                      value={notificationSettings.overdueNagIntervalMinutes}
                      onChange={(e) => updateSetting('overdueNagIntervalMinutes', Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:border-rose-500 focus:outline-none"
                    >
                      <option value={15}>Every 15 min</option>
                      <option value={30}>Every 30 min</option>
                      <option value={45}>Every 45 min</option>
                      <option value={60}>Every 1 hr</option>
                    </select>

                    <button
                      onClick={() => updateSetting('overdueNagging', !notificationSettings.overdueNagging)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        notificationSettings.overdueNagging
                          ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      {notificationSettings.overdueNagging ? 'Nagging On' : 'Off'}
                    </button>
                  </div>
                </div>

                {/* 3. Evening Streak-Saver Alert */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#090E1A]/80 p-3 rounded-xl border border-slate-800/90">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Flame className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Evening Streak-Saver Warning</span>
                      <span className="text-[11px] text-slate-400">
                        Urgent evening notice before midnight to protect streaks
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <input
                      type="time"
                      value={notificationSettings.eveningStreakSaverTime}
                      onChange={(e) => updateSetting('eveningStreakSaverTime', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={() => updateSetting('eveningStreakSaver', !notificationSettings.eveningStreakSaver)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        notificationSettings.eveningStreakSaver
                          ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      {notificationSettings.eveningStreakSaver ? 'Enabled' : 'Off'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Aggressive Test Trigger */}
              <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Audible alarm tone + mobile vibration + persistent pinned notification
                </span>
                <button
                  onClick={handleTestAggressiveNotification}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 active:scale-95"
                >
                  {aggressiveTestSent ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-white" />
                      Alert Fired!
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 text-white" />
                      Test Aggressive Alert Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Browser Web Push Permissions */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Browser Notification Permission
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
                        ? 'Notifications Blocked in Browser Settings'
                        : 'Permissions Not Yet Granted'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {permission === 'granted'
                        ? 'Browser push will trigger alerts even when backgrounded'
                        : 'Grant permission so FocusPulse can send your task reminders'}
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
                      Standard Alert Sent!
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5 text-indigo-400" />
                      Test Standard Alert
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Audio Feedback & Sound Effects */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              3. Sound & Audio Chimes
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
                  Task Check Chime
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
                  Prompt Tone
                </button>
                <button
                  onClick={playAggressiveAlertTone}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/50 text-rose-300 text-xs font-medium"
                >
                  <Zap className="h-3 w-3 text-rose-400" />
                  Aggressive Alarm
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Data Backup & Fresh Slate */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              4. Data Backup & Local Storage
            </span>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              <p className="text-xs text-slate-400">
                All streaks, logs, alert preferences, and habit configurations are saved safely in your browser.
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

          {/* Section 5: Mobile Installation */}
          {onOpenMobileInstall && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                5. Mobile Phone Installation
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
        <div className="px-6 py-4 bg-[#0A0F1C] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Preferences auto-save instantly</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
