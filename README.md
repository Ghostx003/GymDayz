# Gym Dayz 🏋️‍♂️

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Ready-000000.svg?logo=vercel)](https://vercel.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-16%20Passed-10b981.svg)](https://vitest.dev/)

> **Gym Dayz** is a modern, production-grade gym subscription and attendance tracker. Designed Android-first for mobile with an exceptional desktop experience, it empowers fitness enthusiasts to monitor their subscription days, workout attendance, cost per session, value recovered, and attendance streaks with zero cloud lock-in.

---

## 🌟 Key Highlights & Features

- **Inclusive Calendar Tracking**: Day 1 begins automatically on your subscription start date. Handles leap years, month lengths, midnight rollovers, and year boundaries with zero timezone shift bugs.
- **Dynamic Metrics**:
  - **Subscription Progress**: Animated SVG circular donut progress indicator with exact elapsed and remaining days.
  - **Attendance Consistency**: Live attendance rate clamped to elapsed subscription days.
  - **Cost Per Attended Session**: True cost breakdown (e.g. ₹7,500 / 37 = ₹202.70/session) with divide-by-zero protection.
  - **Membership Value Recovered**: Calculates actual monetary value extracted based on daily subscription rate.
  - **Streaks & Analytics**: Tracks current workout streak and all-time best streak.
- **Auto-Repeat Counters**:
  - `DAYS GONE` and `DAYS MISSED` counters featuring press-and-hold auto-repeat with pointer event debouncing for both touch and mouse devices.
  - Strict mathematical invariants: `daysGone + daysMissed <= currentSubscriptionDay` and `daysGone <= currentSubscriptionDay`.
- **Today Action & Daily Lock**:
  - One-tap `Go To Gym`, `Miss Today`, or `Skip Today` (locks attendance for planned rest days; can be unlocked via `Undo Skip`).
- **Interactive Attendance Calendar**:
  - Complete month-by-month navigation from start to end date.
  - Visual status markers: Green check (`✓`) for attended, Red cross (`✕`) for missed, Amber lock (`🔒`) for skipped.
  - Strict protection: future dates and out-of-range dates cannot be modified.
  - 100% synchronized with dashboard counters.
- **Peer-to-Peer QR Device Synchronization**:
  - Seamlessly synchronize data between Phone and Desktop PC completely client-side using device cameras or raw sync payloads.
  - **Deterministic Conflict Resolution**:
    1. **Higher Days Gone Wins**: If Device A has 38 days gone and Device B has 18, Device A wins regardless of timestamps.
    2. **Tiebreaker**: If Days Gone count is tied, the latest `lastUpdatedAt` timestamp wins.
- **Zero-Cloud Privacy & Local Persistence**:
  - All data stays locally in browser `localStorage`.
  - Self-healing storage layer with schema validation and corrupt data backup recovery.
- **Export & Import**:
  - Full JSON backup & restore (`gym-dayz-backup-YYYY-MM-DD.json`).
  - Attendance history CSV export (`gym-dayz-attendance-YYYY-MM-DD.csv`) for spreadsheets.
- **PWA & Mobile-First UX**:
  - Web App Manifest, theme-color meta tags, high-DPI vector icons, standalone display mode, and bottom navigation bar.

---

## 📐 Core Calculations & Rules

| Metric | Formula | Example |
| :--- | :--- | :--- |
| **Current Day** | `diffInCalendarDays(today, startDate) + 1` | Aug 18 start on Aug 18 = Day 1 |
| **Total Days** | `diffInCalendarDays(endDate, startDate) + 1` | Aug 18 to Nov 15 = 90 days |
| **Subscription Progress** | `clamp(currentDay / totalDays * 100, 0, 100)` | Day 72 of 100 = 72% |
| **Attendance %** | `clamp(daysGone / currentDay * 100, 0, 100)` | 37 attended of 40 = 92.5% |
| **Cost Per Session** | `feesPaid / daysGone` *(₹— if 0)* | ₹7,500 / 37 = ₹202.70/session |
| **Daily Membership Value** | `feesPaid / totalDays` | ₹7,500 / 100 days = ₹75.00/day |
| **Value Recovered** | `daysGone * dailyMembershipValue` | 40 days * ₹75 = ₹3,000 |
| **Remaining Value** | `max(0, feesPaid - valueRecovered)` | ₹7,500 - ₹3,000 = ₹4,500 |

---

## 🛠️ Tech Stack

- **Framework**: React 19 (Hooks, Context, Suspense, Lazy loading)
- **Bundler & Tooling**: Vite 6, PostCSS, Autoprefixer
- **Styling**: Tailwind CSS 3.4 (Custom dark gym fitness theme, glassmorphism, responsive utilities)
- **Icons**: Lucide React
- **QR Engine**: `qrcode.react` (SVG generation) & `html5-qrcode` (device camera scanner)
- **Delight Effects**: `canvas-confetti`
- **Testing**: Vitest unit test runner
- **Deployment**: Vercel ready (`vercel.json` SPA rewrites)

---

## 📂 Project Architecture

```
src/
├── __tests__/                  # Unit test suites (16 passing tests)
│   ├── calculations.test.js
│   ├── conflictResolver.test.js
│   ├── dateUtils.test.js
│   └── syncCodec.test.js
├── components/
│   ├── calendar/
│   │   └── AttendanceCalendar.jsx   # Full month navigation & day status toggling
│   ├── common/
│   │   ├── Modal.jsx                # Accessible modal overlay
│   │   ├── Navbar.jsx               # Desktop header & sync action
│   │   ├── TabBar.jsx               # Mobile-first Android bottom navigation
│   │   └── Toast.jsx                # Global notification toast
│   ├── dashboard/
│   │   ├── AttendanceCounter.jsx    # Press-and-hold auto-repeat counters
│   │   ├── DonutProgress.jsx        # Animated SVG donut percentage
│   │   ├── FinancialCards.jsx       # Cost per session & value recovered
│   │   ├── Header.jsx               # Profile greeting & date display
│   │   ├── SummaryCards.jsx         # Fees paid & current subscription day
│   │   └── TodayActionCard.jsx      # Go to gym, Miss today, Skip today toggle
│   ├── setup/
│   │   └── OnboardingSetup.jsx      # First launch validation & presets
│   ├── settings/
│   │   └── SettingsView.jsx         # Edit membership, JSON/CSV exports, reset
│   ├── stats/
│   │   └── StatisticsView.jsx       # Streaks, financial summary, breakdown
│   └── sync/
│       ├── QrScannerModal.jsx       # Camera QR code reader
│       └── SyncModal.jsx            # QR generation, scanning, & manual code
├── context/
│   └── GymContext.jsx               # Central reactive state & actions
├── hooks/
│   └── usePressAndHold.js           # Touch & mouse auto-repeat hook
├── storage/
│   ├── defaultData.js               # Initial data model & constants
│   └── gymStorage.js                # Local persistence & corrupted data fallback
├── sync/
│   ├── conflictResolver.js          # Deterministic 'Higher Days Gone Wins' engine
│   └── syncCodec.js                 # Compact QR payload serialization
├── utils/
│   ├── calculations.js              # Pure financial & streak formulas
│   ├── confetti.js                  # Milestone celebrations
│   ├── dateUtils.js                 # Pure calendar date math (zero timezone bugs)
│   └── exportImport.js              # JSON & CSV backup handlers
├── App.jsx                          # Main shell with code splitting
├── main.jsx                         # React entrypoint
└── index.css                        # Tailwind directives & theme styling
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
git clone https://github.com/Ghostx003/GymDayz.git
cd GymDayz
npm install
```

### Running Locally

```bash
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

The optimized static assets will be emitted to `dist/`. You can preview the production build locally:

```bash
npm run preview
```

---

## ⚡ Deployment to Vercel

Gym Dayz is pre-configured for zero-configuration deployment to [Vercel](https://vercel.com):

1. Push your repository to GitHub (`GymDayz`).
2. Import the repository into your Vercel Dashboard.
3. Framework Preset: **Vite**.
4. Root Directory: `./`.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Click **Deploy**.

---

## 🔒 Privacy & Data Ownership

- **100% Client-Side**: No backend database, tracking scripts, or analytics servers.
- **Local Storage**: Your workouts and finances never leave your device without your explicit action.
- **Direct Device Sync**: Synchronization between devices is conducted directly via visual QR code or direct copy-paste sync tokens.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
