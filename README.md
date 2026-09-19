# The Ledger

Cross-platform (iOS / Android / Web) accountability tracker, rebuilt from the
"Ledger" spreadsheet: weekly Mon–Sun goal check-ins with proof, 100-day
season goals, peer comments, a red/orange/green completion status, and a
group's weekly team average — plus a rule-based nudge assistant, with an
opt-in AI coach planned for a later phase.

See `/root/.claude/plans/root-claude-uploads-65566872-ad88-5fc0-zany-lamport.md`
(or ask for a copy) for the full product plan and phased roadmap. This repo
currently implements **Phase 0 (project setup)** and **Phase 1 (core
tracker)**: auth, groups, seasons/weeks, weekly + 100-day goals, check-ins,
proof upload, team average, and comments. Notifications, the rule-based
"Nudges" polish pass, the LLM coach, and store deployment are Phases 2–5 and
are not built yet (the Assistant tab's Coach view is a placeholder).

## Stack

- Expo SDK 57 + Expo Router (file-based routing, one codebase for iOS/Android/Web)
- TypeScript, NativeWind v5 (release candidate — the version actually tested
  against this Expo/React Native/Tailwind v4 combination; see
  `package.json` for exact versions)
- Supabase: Postgres + Auth + Storage + Row Level Security
- React Query for server state

## Setup

1. Create a Supabase project, then run the SQL in `supabase/migrations/`
   (in order) against it — via the Supabase SQL editor or the Supabase CLI:

   ```bash
   npx supabase db push
   ```

2. Copy `.env.example` to `.env` and fill in your project's URL/anon key:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies and start the app:

   ```bash
   npm install
   npm start
   ```

   Then press `i` / `a` / `w` for iOS / Android / Web, or scan the QR code
   with Expo Go.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest — currently covers src/lib/scoring.ts
npm run lint        # expo lint (needs network access to bootstrap ESLint config on first run)
```

## Project layout

- `src/app/(auth)` — sign in/up, create-or-join-group onboarding
- `src/app/(app)` — the signed-in tab bar: Today, My Week, 100-Day, Group, Assistant, Profile
- `src/lib/api/` — typed Supabase queries/mutations, one file per domain
- `src/lib/scoring.ts` — the weekly %/color-band/team-average/streak math (unit tested)
- `src/types/database.ts` — hand-written types matching `supabase/migrations/0001_init.sql`;
  regenerate with `npx supabase gen types typescript --linked` once the project is linked
- `supabase/migrations/` — schema + RLS policies + storage bucket policies
