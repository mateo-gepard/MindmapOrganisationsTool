import { format, startOfWeek, addDays, isSameDay, isToday, isThisWeek } from 'date-fns';
import { de } from 'date-fns/locale';

// Safe date conversion helper
export function toSafeDate(date: Date | string | undefined | null): Date | null {
  if (!date) return null;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

export function formatDate(date: Date | string | undefined | null): string {
  const safeDate = toSafeDate(date);
  if (!safeDate) return '';
  
  try {
    return format(safeDate, 'dd.MM.yyyy', { locale: de });
  } catch {
    return '';
  }
}

export function formatTime(date: Date | string | undefined | null): string {
  const safeDate = toSafeDate(date);
  if (!safeDate) return '';
  
  try {
    return format(safeDate, 'HH:mm', { locale: de });
  } catch {
    return '';
  }
}

export function formatDateTime(date: Date | string | undefined | null): string {
  const safeDate = toSafeDate(date);
  if (!safeDate) return '';
  
  try {
    return format(safeDate, 'dd.MM.yyyy HH:mm', { locale: de });
  } catch {
    return '';
  }
}

// Safe ISO date string for input fields
export function toISODateString(date: Date | string | undefined | null): string {
  const safeDate = toSafeDate(date);
  if (!safeDate) return '';
  
  try {
    return safeDate.toISOString().split('T')[0];
  } catch {
    return '';
  }
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
