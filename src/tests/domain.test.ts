import { describe, expect, it } from 'vitest';
import { calculateXp } from '../domain/xp';
import { calculateRollingConsistency, updateStreakState } from '../domain/streak';
import { calculateWeeklyRankScore, rankFromScore } from '../domain/ranks';
import { createSeededRng } from '../domain/rng';
import { rollLoot } from '../domain/loot';
import { generateWeeklyMissions } from '../domain/missions';
import { toDateKey } from '../domain/time';

const baseDate = new Date('2024-06-15T00:00:00.000Z');

it('calculates xp with low energy scaling', () => {
  const full = calculateXp(3, 20, 0.5, 2, 'full');
  const low = calculateXp(3, 20, 0.5, 2, 'low_energy');
  expect(low).toBe(Math.round(full * 0.6));
});

it('calculates rolling consistency', () => {
  const completions = [
    { id: '1', habitId: 'h1', date: '2024-06-15', mode: 'full', createdAt: '' },
    { id: '2', habitId: 'h1', date: '2024-06-14', mode: 'full', createdAt: '' },
    { id: '3', habitId: 'h1', date: '2024-06-13', mode: 'full', createdAt: '' }
  ];
  const score = calculateRollingConsistency(completions, '2024-06-15');
  expect(score).toBeCloseTo(3 / 7, 4);
});

it('applies streak shields before breaking streak', () => {
  const completions = [
    { id: '1', habitId: 'h1', date: '2024-06-15', mode: 'full', createdAt: '' }
  ];
  const state = updateStreakState(
    { streak: 0, shieldsAvailable: 1, shieldsUsed: 0, lastActiveDate: null },
    completions,
    '2024-06-15',
    [],
    3
  );
  expect(state.streak).toBeGreaterThanOrEqual(1);
});

it('computes weekly rank score and rank', () => {
  const score = calculateWeeklyRankScore(0.8, 3, 4, 400);
  const rank = rankFromScore(score);
  expect(rank).toBe('Diamond');
});

it('uses pity timer to guarantee rare loot', () => {
  const rng = createSeededRng(42);
  const result = rollLoot(rng, 15);
  expect(result.item?.rarity).toBe('Rare');
});

it('generates weekly missions', () => {
  const rng = createSeededRng(1);
  const missions = generateWeeklyMissions(
    [
      {
        id: 'habit-1',
        name: 'Read',
        description: 'Read',
        difficulty: 3,
        estimatedMinutes: 20,
        category: 'Mind',
        schedule: { type: 'daily' },
        lowEnergyMinimum: null,
        createdAt: '',
        archivedAt: null
      }
    ],
    rng,
    baseDate
  );
  expect(missions.length).toBe(4);
  expect(missions[0].weekStart).toBe('2024-06-10');
});
