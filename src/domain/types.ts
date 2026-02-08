export type HabitCategory = 'Mind' | 'Strength' | 'Focus' | 'Health' | 'Social' | 'Craft';
export type HabitSchedule =
  | { type: 'daily' }
  | { type: 'daysOfWeek'; days: number[] }
  | { type: 'timesPerWeek'; count: number };

export type Habit = {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  estimatedMinutes: number;
  category: HabitCategory;
  schedule: HabitSchedule;
  lowEnergyMinimum: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type CompletionMode = 'full' | 'low_energy';

export type Completion = {
  id: string;
  habitId: string;
  date: string; // yyyy-mm-dd
  mode: CompletionMode;
  createdAt: string;
};

export type WeeklyMission = {
  id: string;
  weekStart: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  type: 'habitConsistency' | 'anyQuest' | 'combo' | 'boss';
  habitId?: string;
};

export type PlayerProfile = {
  id: string;
  level: number;
  xp: number;
  coins: number;
  rank: string;
  shieldsAvailable: number;
  streak: number;
  lastActiveDate: string | null;
  pityCounter: number;
  skillPoints: number;
};

export type SkillState = {
  id: string;
  unlocked: string[];
};

export type InventoryItem = {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  type: 'theme' | 'badge' | 'avatar_frame' | 'profile_title';
  acquiredAt: string;
};

export type Settings = {
  id: string;
  restDaysPerWeek: number;
  prefersReducedMotion: boolean;
  highContrast: boolean;
};

export type AppMeta = {
  key: string;
  value: string;
};

export type QuestReward = {
  xp: number;
  coins: number;
  loot?: InventoryItem;
};
