import { format, startOfWeek, addDays, isSameDay, isToday, isThisWeek } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatDate(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: de });
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: de });
}

export function formatDateTime(date: Date): string {
  return format(date, 'dd.MM.yyyy HH:mm', { locale: de });
}

export function getWeekDays(date: Date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isDateInRange(date: Date, range: 'today' | 'week' | 'all'): boolean {
  if (range === 'all') return true;
  if (range === 'today') return isToday(date);
  if (range === 'week') return isThisWeek(date, { weekStartsOn: 1 });
  return false;
}

export function getDayName(date: Date): string {
  return format(date, 'EEEE', { locale: de });
}

export function getNextOccurrence(daysOfWeek: number[], startFrom: Date = new Date()): Date {
  const today = startFrom.getDay();
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

  // Find next occurrence
  for (const day of sortedDays) {
    if (day > today) {
      const diff = day - today;
      return addDays(startFrom, diff);
    }
  }

  // If no day found this week, get first day of next week
  const firstDay = sortedDays[0];
  const daysUntilNext = (7 - today + firstDay) % 7 || 7;
  return addDays(startFrom, daysUntilNext);
}

export function isSameDayHelper(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}
