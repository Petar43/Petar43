import {
  AppMeta,
  Completion,
  Habit,
  InventoryItem,
  PlayerProfile,
  Settings,
  SkillState,
  WeeklyMission
} from '../domain/types';
import { deleteItem, putItem, putItems, readAll } from './db';

export const MetaKeys = {
  schemaVersion: 'schemaVersion'
};

export async function loadHabits(): Promise<Habit[]> {
  return readAll('habits');
}

export async function saveHabit(habit: Habit): Promise<void> {
  return putItem('habits', habit);
}

export async function deleteHabit(id: string): Promise<void> {
  return deleteItem('habits', id);
}

export async function loadCompletions(): Promise<Completion[]> {
  return readAll('completions');
}

export async function saveCompletion(completion: Completion): Promise<void> {
  return putItem('completions', completion);
}

export async function loadMissions(): Promise<WeeklyMission[]> {
  return readAll('missions');
}

export async function saveMissions(missions: WeeklyMission[]): Promise<void> {
  return putItems('missions', missions);
}

export async function loadProfile(): Promise<PlayerProfile[]> {
  return readAll('profile');
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  return putItem('profile', profile);
}

export async function loadSkills(): Promise<SkillState[]> {
  return readAll('skills');
}

export async function saveSkills(skills: SkillState[]): Promise<void> {
  return putItems('skills', skills);
}

export async function loadInventory(): Promise<InventoryItem[]> {
  return readAll('inventory');
}

export async function saveInventory(items: InventoryItem[]): Promise<void> {
  return putItems('inventory', items);
}

export async function loadSettings(): Promise<Settings[]> {
  return readAll('settings');
}

export async function saveSettings(settings: Settings): Promise<void> {
  return putItem('settings', settings);
}

export async function loadMeta(): Promise<AppMeta[]> {
  return readAll('meta');
}

export async function saveMeta(meta: AppMeta): Promise<void> {
  return putItem('meta', meta);
}
