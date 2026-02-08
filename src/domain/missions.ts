import { Habit, WeeklyMission } from './types';
import { SeededRng } from './rng';
import { weekStart } from './time';

export function generateWeeklyMissions(
  habits: Habit[],
  rng: SeededRng,
  today: Date
): WeeklyMission[] {
  const start = weekStart(today);
  const activeHabits = habits.filter((habit) => habit.archivedAt === null);
  const missions: WeeklyMission[] = [];
  if (activeHabits.length) {
    const habit = activeHabits[rng.int(0, activeHabits.length - 1)];
    missions.push({
      id: `mission-${start}-habit`,
      weekStart: start,
      description: `Complete "${habit.name}" 4 out of 7 days`,
      target: 4,
      progress: 0,
      completed: false,
      type: 'habitConsistency',
      habitId: habit.id
    });
  }
  missions.push({
    id: `mission-${start}-any`,
    weekStart: start,
    description: 'Complete any 5 quests this week',
    target: 5,
    progress: 0,
    completed: false,
    type: 'anyQuest'
  });
  missions.push({
    id: `mission-${start}-combo`,
    weekStart: start,
    description: 'Complete 3 days in a row (combo bonus)',
    target: 3,
    progress: 0,
    completed: false,
    type: 'combo'
  });
  missions.push({
    id: `mission-${start}-boss`,
    weekStart: start,
    description: 'Boss Fight: Complete 3 different categories in one day',
    target: 3,
    progress: 0,
    completed: false,
    type: 'boss'
  });
  return missions;
}

export function updateMissionProgress(
  missions: WeeklyMission[],
  habitId: string,
  uniqueCategoriesToday: number,
  comboStreak: number
): WeeklyMission[] {
  return missions.map((mission) => {
    if (mission.completed) {
      return mission;
    }
    if (mission.type === 'habitConsistency' && mission.habitId === habitId) {
      const progress = Math.min(mission.target, mission.progress + 1);
      return { ...mission, progress, completed: progress >= mission.target };
    }
    if (mission.type === 'anyQuest') {
      const progress = Math.min(mission.target, mission.progress + 1);
      return { ...mission, progress, completed: progress >= mission.target };
    }
    if (mission.type === 'combo' && comboStreak >= mission.target) {
      return { ...mission, progress: mission.target, completed: true };
    }
    if (mission.type === 'boss' && uniqueCategoriesToday >= mission.target) {
      return { ...mission, progress: mission.target, completed: true };
    }
    return mission;
  });
}
