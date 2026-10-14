'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Share,
  PlusSquare,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, install, isIOS, isInstalled } = usePWAInstall();
  const [activeDeviceTab, setActiveDeviceTab] = useState<'ios' | 'android'>(
    isIOS ? 'ios' : 'android'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : 'https://ais-dev-toxr434l7ik3eejdadzsah-556021110533.europe-west2.run.app';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0D1424] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#0A0F1C] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Install on Mobile Phone
                <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  PWA
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Run FocusPulse full-screen with offline support and push alerts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close install modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* OS Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveDeviceTab('ios')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeDeviceTab === 'ios'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🍎 iPhone / iPad (iOS)</span>
            </button>
            <button
              onClick={() => setActiveDeviceTab('android')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeDeviceTab === 'android'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🤖 Android (Chrome)</span>
            </button>
          </div>

          {/* Quick Direct Install Button if supported */}
          {isInstallable && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">One-Click Install Ready</span>
                <span className="text-[11px] text-slate-400">
                  Your browser supports direct installation
                </span>
              </div>
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                <Download className="h-3.5 w-3.5" />
                Install Now
              </button>
            </div>
          )}

          {/* Step-by-Step Instructions */}
          {activeDeviceTab === 'ios' ? (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                iOS Safari Installation Steps
              </span>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Open this app in <strong>Safari</strong> on your iPhone or iPad. (Apple only allows PWAs to be installed through Safari).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Tap the <strong>Share</strong> button at the bottom of the screen (the square box with an upward pointing arrow <Share className="inline h-3.5 w-3.5 text-cyan-400 mx-0.5" />).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Scroll down the options list and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> (<PlusSquare className="inline h-3.5 w-3.5 text-emerald-400 mx-0.5" />).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Tap <strong>&ldquo;Add&rdquo;</strong> in the top-right corner. <strong>FocusPulse</strong> will now appear directly on your home screen with its app icon!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Android Installation Steps
              </span>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Open this app in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your Android phone.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    If prompted with <strong>&ldquo;Add FocusPulse to Home screen&rdquo;</strong> banner, tap it. Otherwise, tap the <strong>3 vertical dots menu (⋮)</strong> in the top-right corner.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Confirm <strong>Install</strong>. FocusPulse will install into your app drawer and home screen just like an app from the Play Store!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Copy URL section */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Send Link to Your Phone:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 select-all truncate"
              />
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold whitespace-nowrap transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Benefits strip */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Full-screen app experience</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Native push notifications</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0A0F1C] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
