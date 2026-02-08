export const RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Mythic'] as const;

export function calculateWeeklyRankScore(
  consistency: number,
  missionsCompleted: number,
  totalMissions: number,
  weeklyXp: number
): number {
  const missionRate = totalMissions ? missionsCompleted / totalMissions : 0;
  const xpScore = Math.min(1, weeklyXp / 500);
  return consistency * 0.5 + missionRate * 0.3 + xpScore * 0.2;
}

export function rankFromScore(score: number): string {
  const index = Math.min(RANKS.length - 1, Math.floor(score * RANKS.length));
  return RANKS[index];
}

export function applyRankDecay(rank: string, inactiveWeeks: number): string {
  if (inactiveWeeks < 2) {
    return rank;
  }
  const currentIndex = RANKS.indexOf(rank as (typeof RANKS)[number]);
  const newIndex = Math.max(0, currentIndex - 1);
  return RANKS[newIndex];
}
