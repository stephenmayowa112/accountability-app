# FocusPulse: Personal Reminder & Accountability Habit Tracker

FocusPulse is a high-motivation daily habit tracking and accountability platform that combines scheduled Web Push and in-app check-in notifications with streak preservation, visual completion heatmaps, and progress analytics to help users maintain relentless consistency.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during the clarification interview and govern the design and architecture:

- **Confirmed: Dual-Channel Accountability Notifications**: We will implement both native Web Push notifications (via Service Worker and browser Notification API with optional Web Audio alert chimes) and interactive in-app accountability check-in modals that prompt users to mark habits complete or log quick reflections.
- **Confirmed: Habit Tracking & Progress Style**: Daily interactive checklist paired with consecutive streak calculations, a GitHub-style 365-day activity heatmap, weekly/monthly completion rate gauges, and motivational milestone achievements.
- **Confirmed: Visual Identity & Atmosphere**: Sleek modern dark mode (deep obsidian `#090D16` and dark slate `#111726` surfaces) highlighted by vibrant glowing accents (emerald green for completion, electric cyan/indigo for focus, and warm amber flame for streaks).
- **Default Persistence Architecture**: Client-side reactive persistence using structured local storage with one-click JSON backup/export and restore, allowing instant zero-sign-in access, offline PWA reliability, and zero risk of data loss.

---

### 1. Overview & Core Concept

- **What It Does**: FocusPulse empowers individuals to build, track, and maintain daily routines. Users configure custom habits with target schedules (e.g., Morning Meditation at 07:30, Daily Deep Work at 14:00, Hydration Goal). The app issues time-aware reminders via desktop/mobile Web Notifications and responsive in-app accountability modals. Completing habits increments streaks, illuminates the annual heatmap, and triggers celebratory visual feedback.
- **Target Audience / Persona**: Professionals, students, creators, and wellness enthusiasts seeking discipline, tangible daily momentum, and accountability without complicated setup or clutter.
- **Key Value**: Closes the intention-action gap by coupling time-sensitive accountability prompts with high-reward visual progress metrics (streaks, glowing completion rings, and year-long habit heatmaps).

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **First-Run Experience**: Zero-friction arrival pre-populated with 3 starter habits (e.g., "Morning Sunlight & Hydration", "30-Minute Focused Reading", "Evening Review & Plan Next Day") with one-click "Enable Reminders" permission button.
2. **Habit Creation & Schedule Customization**: Clean modal sheet to add habits with title, category (Health, Mindset, Deep Work, Fitness, Routine), reminder time, frequency (Daily, Weekdays, Custom Days), and accountability prompt text (e.g., *"Did you finish your 30m reading session?"*).
3. **Daily Execution & Habit Check-off**: Tactile checkboxes with smooth spring completion animations, sound chime toggles (Web Audio API synth), and a central dynamic glowing circular progress ring displaying today's completion percentage (e.g., `4 of 5 habits completed · 80%`).
4. **Accountability Check-In Modal**: When a reminder triggers (or via "Accountability Check-In" action), an interactive popup slides in displaying pending habits with quick single-tap actions: `"Mark Done"`, `"Snooze 15m"`, or `"Skip for today"`.
5. **Analytics & Streak Dashboard**: Dedicated visual tab presenting the 365-day grid heatmap with tooltips, longest streak vs. current streak counters, best day of the week, category distribution, and earned milestone badges (e.g., *"7-Day Ironclad"*, *"30-Day Master"*, *"Century Club"*).

#### Visual Identity & Theme
- **Canvas & Surfaces**:
  - Main Canvas: `#080B12` (Ultra-deep slate)
  - Card & Container Surfaces: `#0F1626` with hairline border `rgba(255, 255, 255, 0.08)`
  - Elevated Popups / Modals: `#141C30` with subtle ambient blur and drop shadow
- **Accent Tokens**:
  - Streak Fire: `#F59E0B` (Amber flame) / `#EF4444` (Crimson spark)
  - Habit Success: `#10B981` (Vibrant Emerald)
  - Primary Action / Focus: `#6366F1` (Electric Indigo) & `#06B6D4` (Cyan glow)
  - Text Hierarchy: Primary text `#F8FAFC` (Slate-50), Secondary text `#94A3B8` (Slate-400), Muted metadata `#64748B` (Slate-500)
- **Typography**: Clean neo-grotesque sans-serif with high legibility (`Plus Jakarta Sans` / system stack) paired with tabular numerals (`tabular-nums font-mono`) for all streaks, percentages, and timestamps.
- **Anti-AI Restraint**: No decorative pulsing dots on static text, no fake telemetry labels, no static pill badge sandwiches; metadata formatted with clean typography separators (`·`).

#### Interactive Feedback & Motion
- **Celebration Confetti**: Lightweight canvas confetti burst when reaching 100% daily completion.
- **Micro-Audio Feedback**: Clean synthesizer chimes generated via Web Audio API (no external sound files required) with volume/mute toggle.
- **Fluid Layout**: Fully responsive across mobile touchscreens (compact sticky bottom bar, 44px+ touch targets) and desktop 1440px wide dashboard (2-column layout with habit checklist and live analytics).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Reminder Mechanism (Web Notification + In-App Accountability Modal)**
  - *Chosen Approach*: Support the standard browser `Notification` API with Service Worker integration for system popups, alongside an in-app reminder scheduler that fires check-in modals while the tab or app is open.
  - *Why*: Web notifications on some mobile browsers (like iOS prior to PWA home screen add) require specific permissions; the in-app modal ensures 100% accountability delivery regardless of browser restrictions.
  - *Alternatives Considered*: Native SMS/WhatsApp bot (requires external paid carrier APIs and phone collection) vs. Client-side PWA push & in-app alerts (instant, free, private).
- **Decision 2: Fast Local-First State with JSON Export/Import**
  - *Chosen Approach*: Store habits, logs, and notification preferences in browser storage with instant sync, zero authentication barrier, and full JSON data backup/restore.
  - *Why*: Users can start building habits in 2 seconds without creating an account or risking privacy; data is immediately available offline.
- **Decision 3: Streak & Heatmap Calculation Rigor**
  - *Chosen Approach*: Date-keyed completion records (`YYYY-MM-DD`). Consecutive streak calculation handles today vs. yesterday continuity seamlessly without penalizing unfinished current-day habits prematurely.
  - *Why*: Accurate streak logic prevents user demotivation and correctly reflects true habit adherence.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FocusPulse                                │
│                     Personal Habit Accountability                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌───────────────────────────────────┐    ┌───────────────────────────────────┐
│         Top Bar Contract          │    │         PWA & Install Banner      │
│  Brand Wordmark · Nav · New Habit │    │   Add to Home Screen · Status     │
└───────────────────────────────────┘    └───────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌───────────────────────────────────┐    ┌───────────────────────────────────┐
│      Habits View (Daily Flow)     │    │     Analytics & Heatmap View      │
│  - Radial Day Progress Ring       │    │  - 365-Day Activity Heatmap Grid  │
│  - Date Carousel (Mon-Sun)        │    │  - Current vs Longest Streak Card │
│  - Interactive Habit Checklist    │    │  - Weekly Adherence Bar Graph     │
│  - Quick Habit Add / Edit Drawer  │    │  - Milestone Badges & Trophies    │
└───────────────────────────────────┘    └───────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌───────────────────────────────────┐    ┌───────────────────────────────────┐
│     Accountability Modal Engine   │    │    Reminder & Sound Dispatcher    │
│  - Time-Triggered Check-In Alert  │    │  - Browser Web Notification API   │
│  - "Mark Done", "Snooze", "Skip"  │    │  - Web Audio API Chime Synth      │
│  - Reflection & Encouragement     │    │  - Service Worker Background PWA  │
└───────────────────────────────────┘    └───────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Local Reactive Storage                          │
│        Habits Config · Date Logs (YYYY-MM-DD) · Notification Settings  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Models
- **`Habit`**:
  - `id`: string
  - `title`: string
  - `category`: `'health' | 'mindset' | 'focus' | 'fitness' | 'routine'`
  - `timeOfDay`: string (e.g. `'08:00'`)
  - `reminderEnabled`: boolean
  - `promptMessage`: string (accountability question)
  - `daysOfWeek`: number[] (0 for Sunday to 6 for Saturday)
  - `createdAt`: string
  - `archived`: boolean
- **`HabitLog`**:
  - `date`: string (ISO `YYYY-MM-DD`)
  - `completedHabitIds`: string[]
  - `notes`?: Record<string, string>
- **`MilestoneBadge`**:
  - `id`: string
  - `name`: string
  - `criteria`: number (e.g., 3-day, 7-day, 14-day, 30-day, 100-day streak)
  - `unlockedAt`?: string

#### State Transition & Interactive Handlers
- **Toggle Habit Complete**: Updates today's entry in `completedHabitIds`. Recalculates streak counters, plays subtle audio chime, and triggers celebratory particle flare when all scheduled daily habits are checked.
- **Accountability Alarm Trigger**: Checked every 30 seconds via timer interval; compares current time with habit `timeOfDay`. If uncompleted, displays the interactive modal and dispatches a Web Notification if permission is granted.
- **Date Selector**: Allows inspecting previous days or historical progress; today is highlighted with distinct glowing indicator.
- **Habit Management**: Create, edit, reorder, delete, and filter habits by category or status.
