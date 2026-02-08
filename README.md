# Habit Quest

A local-first habit tracker that feels like an RPG. Complete daily quests, earn XP + coins, climb weekly ranks, and unlock skill perks without guilt.

## Setup

```bash
npm install
npm run dev
```

Other targets:

```bash
npm run test
npm run build
```

## Assumptions

- XP formula: `base = 10 * difficulty`, `time bonus = min(minutes, 60) / 5`, `consistency bonus = rolling7 * 12`, `combo bonus = combo * 2 when combo > 1`. Low-energy completions grant 60% XP.
- Weekly XP score normalization uses `weeklyXp / 500` capped at 1 for rank scoring.
- Shields are consumed in `updateStreakState` when a day is missing, up to a maximum of 3.
- High contrast toggle is stored but requires further theming work to apply across the UI.

## Architecture

- **UI**: React + Tailwind UI with a tabbed interface. Context + reducer handles global state.
- **Domain**: Pure functions for XP, streaks, missions, ranks, loot, and RNG in `src/domain` with unit tests in `src/tests`.
- **Persistence**: IndexedDB wrapper in `src/data` with minimal repositories for each store.

## Data Model

- Entities: `Habit`, `Completion`, `WeeklyMission`, `PlayerProfile`, `SkillState`, `InventoryItem`, `Settings`, `AppMeta`.
- IndexedDB stores: `habits`, `completions`, `missions`, `profile`, `skills`, `inventory`, `settings`, `meta`.
- Indexes: `completions` by date and habit, `missions` by week_start.

## Demo data

Use **Settings → Load demo data** to seed 6 habits and 14 days of completions.

## Export/Import

Settings contains JSON export/import with schema versioning. The app validates version `1`.

## Accessibility

- Keyboard focus styles on buttons/inputs.
- Prefers-reduced-motion toggle (adds a `no-motion` class).
- High contrast toggle stored for future UI extension.

## Scripts

`npm run test` runs Vitest unit tests for core gamification logic.
