export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function weekStart(date: Date): string {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - ((day + 6) % 7);
  copy.setDate(diff);
  return toDateKey(copy);
}

export function isNewWeek(lastWeekStart: string, today: Date): boolean {
  return weekStart(today) !== lastWeekStart;
}
