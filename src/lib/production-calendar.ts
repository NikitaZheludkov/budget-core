import { isWeekend, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

// Simple list of fixed holidays (Day/Month). 
// In a real app, this might come from a DB or API.
// Using Russian holidays as an example based on user language.
const FIXED_HOLIDAYS = [
  { day: 1, month: 0 }, // Jan 1
  { day: 2, month: 0 }, // Jan 2
  { day: 3, month: 0 }, // Jan 3
  { day: 4, month: 0 }, // Jan 4
  { day: 5, month: 0 }, // Jan 5
  { day: 6, month: 0 }, // Jan 6
  { day: 7, month: 0 }, // Jan 7 (Orthodox Christmas)
  { day: 8, month: 0 }, // Jan 8
  { day: 23, month: 1 }, // Feb 23
  { day: 8, month: 2 }, // Mar 8
  { day: 1, month: 4 }, // May 1
  { day: 9, month: 4 }, // May 9
  { day: 12, month: 5 }, // Jun 12
  { day: 4, month: 10 }, // Nov 4
];

export function isHoliday(date: Date): boolean {
  return FIXED_HOLIDAYS.some(
    (h) => h.day === date.getDate() && h.month === date.getMonth()
  );
}

export function isWorkingDay(date: Date): boolean {
  if (isWeekend(date)) return false;
  if (isHoliday(date)) return false;
  return true;
}

export function getWorkingDaysInMonth(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  const days = eachDayOfInterval({ start, end });
  return days.filter(isWorkingDay);
}

export function getWorkingDaysInInterval(start: Date, end: Date): Date[] {
  const days = eachDayOfInterval({ start, end });
  return days.filter(isWorkingDay);
}
