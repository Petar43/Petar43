import { HabitSchedule } from './types';

export function isHabitScheduledToday(schedule: HabitSchedule, today: Date): boolean {
  if (schedule.type === 'daily') {
    return true;
  }
  if (schedule.type === 'daysOfWeek') {
    return schedule.days.includes(today.getDay());
  }
  if (schedule.type === 'timesPerWeek') {
    return schedule.count > 0;
  }
  return false;
}
