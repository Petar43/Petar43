import { Completion } from './types';
import { toDateKey } from './time';

export type StreakState = {
  streak: number;
  shieldsAvailable: number;
  shieldsUsed: number;
  lastActiveDate: string | null;
};

export function calculateRollingConsistency(
  completions: Completion[],
  todayKey: string
): number {
  const dayKeys = new Set(completions.map((c) => c.date));
  let completed = 0;
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(todayKey);
    date.setDate(date.getDate() - i);
    const key = toDateKey(date);
    if (dayKeys.has(key)) {
      completed += 1;
    }
  }
  return completed / 7;
}

export function updateStreakState(
  state: StreakState,
  completions: Completion[],
  todayKey: string,
  restDays: string[],
  maxShields: number
): StreakState {
  const completedDays = new Set(completions.map((c) => c.date));
  let streak = 0;
  let shieldsAvailable = state.shieldsAvailable;
  let shieldsUsed = 0;

  for (let offset = 0; offset < 30; offset += 1) {
    const date = new Date(todayKey);
    date.setDate(date.getDate() - offset);
    const key = toDateKey(date);
    const isCompleted = completedDays.has(key);
    const isRestDay = restDays.includes(key);

    if (isCompleted || isRestDay) {
      streak += 1;
      continue;
    }

    if (shieldsAvailable > 0) {
      shieldsAvailable -= 1;
      shieldsUsed += 1;
      streak += 1;
      continue;
    }

    break;
  }

  return {
    streak,
    shieldsAvailable: Math.min(maxShields, shieldsAvailable),
    shieldsUsed,
    lastActiveDate: completions.length ? completions[0].date : state.lastActiveDate
  };
}
