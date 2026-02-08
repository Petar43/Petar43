import { QuestReward } from './types';

export function calculateXp(
  difficulty: number,
  estimatedMinutes: number,
  rollingConsistency: number,
  combo: number,
  mode: 'full' | 'low_energy'
): number {
  const base = 10 * difficulty;
  const timeBonus = Math.min(estimatedMinutes, 60) / 5;
  const consistencyBonus = Math.round(rollingConsistency * 12);
  const comboBonus = combo > 1 ? combo * 2 : 0;
  const total = base + timeBonus + consistencyBonus + comboBonus;
  return mode === 'low_energy' ? Math.round(total * 0.6) : Math.round(total);
}

export function xpToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.15));
}

export function applyXpReward(
  currentXp: number,
  currentLevel: number,
  gainedXp: number
): { xp: number; level: number; levelUps: number } {
  let xp = currentXp + gainedXp;
  let level = currentLevel;
  let levelUps = 0;
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    levelUps += 1;
  }
  return { xp, level, levelUps };
}

export function rewardFromXp(xp: number): QuestReward {
  return { xp, coins: Math.floor(xp / 4) };
}
