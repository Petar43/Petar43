import {
  Completion,
  Habit,
  InventoryItem,
  PlayerProfile,
  Settings,
  SkillState,
  WeeklyMission
} from '../../domain/types';

export type AppState = {
  habits: Habit[];
  completions: Completion[];
  missions: WeeklyMission[];
  profile: PlayerProfile;
  skills: SkillState;
  inventory: InventoryItem[];
  settings: Settings;
  restDays: string[];
  activeTab: 'dashboard' | 'habits' | 'missions' | 'skills' | 'rewards' | 'stats' | 'settings';
};

export type Action =
  | { type: 'hydrate'; payload: AppState }
  | { type: 'setTab'; payload: AppState['activeTab'] }
  | { type: 'addHabit'; payload: Habit }
  | { type: 'updateHabit'; payload: Habit }
  | { type: 'addCompletion'; payload: Completion }
  | { type: 'setMissions'; payload: WeeklyMission[] }
  | { type: 'updateProfile'; payload: PlayerProfile }
  | { type: 'setSkills'; payload: SkillState }
  | { type: 'setInventory'; payload: InventoryItem[] }
  | { type: 'updateSettings'; payload: Settings }
  | { type: 'setRestDays'; payload: string[] };
