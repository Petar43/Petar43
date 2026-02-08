export const SKILLS = [
  {
    id: 'focus',
    name: 'Focus',
    unlocks: ['bonus_xp_on_mind_habits', 'extra_streak_shield_chance']
  },
  {
    id: 'strength',
    name: 'Strength',
    unlocks: ['combo_bonus_multiplier', 'extra_coin_drop_chance']
  },
  {
    id: 'mind',
    name: 'Mind',
    unlocks: ['weekly_mission_bonus', 'improved_consistency_floor']
  }
];

export function pointsEarnedByLevel(levelUps: number): number {
  return Math.floor(levelUps / 3);
}
