import { getWorkingDaysInMonth, getWorkingDaysInInterval } from './production-calendar';
import { startOfMonth, endOfMonth, min, isBefore, isAfter, eachDayOfInterval } from 'date-fns';

export type SalaryConfig = {
  type: 'FIXED' | 'HOURLY';
  baseAmount: number; // Monthly salary or Hourly rate
  advanceDay: number; // e.g. 25
  salaryDay: number; // e.g. 10 (of next month)
  advancePercent?: number; // e.g. 40 (meaning 40%) for FIXED
  workingHours?: number; // e.g. 8 for HOURLY
};

export type SalaryPayment = {
  date: Date;
  amount: number;
  type: 'ADVANCE' | 'SALARY';
};

export function calculateSalary(
  year: number,
  month: number, // 0-11
  config: SalaryConfig
): SalaryPayment[] {
  const currentMonthDate = new Date(year, month, 1);
  const totalWorkingDays = getWorkingDaysInMonth(currentMonthDate).length;
  
  // Dates
  const advanceDate = new Date(year, month, config.advanceDay);
  
  // Salary is usually paid next month
  // If salaryDay < advanceDay, it likely means next month.
  // E.g. Advance 25th, Salary 10th (of next month).
  let salaryDate = new Date(year, month, config.salaryDay);
  if (config.salaryDay < config.advanceDay) {
    salaryDate = new Date(year, month + 1, config.salaryDay);
  }

  let advanceAmount = 0;
  let salaryAmount = 0;

  if (config.type === 'FIXED') {
    // Fixed Salary Calculation
    if (config.advancePercent) {
      // Percentage based advance
      advanceAmount = config.baseAmount * (config.advancePercent / 100);
      salaryAmount = config.baseAmount - advanceAmount;
    } else {
      // Proportional to worked days in first half? 
      // If no percentage is set, let's assume proportional to days worked until advance date.
      // Or maybe 40% is standard. Let's default to proportional for now as it's more flexible.
      
      // Calculate working days until advance date
      const advanceCutoff = new Date(year, month, config.advanceDay); // Or maybe 15th? Usually advance is for 1-15.
      // Let's assume advance covers days 1-15 if paid on 25th.
      // Actually, usually advance is paid on 20-25th for days 1-15.
      const firstHalfEnd = new Date(year, month, 15);
      
      const daysWorkedFirstHalf = getWorkingDaysInInterval(
        startOfMonth(currentMonthDate),
        min([firstHalfEnd, endOfMonth(currentMonthDate)])
      ).length;
      
      const dailyRate = config.baseAmount / totalWorkingDays;
      advanceAmount = dailyRate * daysWorkedFirstHalf;
      salaryAmount = config.baseAmount - advanceAmount;
    }
  } else {
    // Hourly Calculation
    // We need to know exact hours, but for "planning" we assume standard 8h/day (or config.workingHours)
    const hoursPerDay = config.workingHours || 8;
    
    // Estimate for planning:
    // Advance: usually for first half of month (1-15)
    const firstHalfEnd = new Date(year, month, 15);
    const daysWorkedFirstHalf = getWorkingDaysInInterval(
      startOfMonth(currentMonthDate),
      min([firstHalfEnd, endOfMonth(currentMonthDate)])
    ).length;
    
    advanceAmount = daysWorkedFirstHalf * hoursPerDay * config.baseAmount;
    
    const daysWorkedTotal = totalWorkingDays; // Total working days in the month
    const totalAmount = daysWorkedTotal * hoursPerDay * config.baseAmount;
    salaryAmount = totalAmount - advanceAmount;
  }

  return [
    { date: advanceDate, amount: Math.round(advanceAmount), type: 'ADVANCE' },
    { date: salaryDate, amount: Math.round(salaryAmount), type: 'SALARY' },
  ];
}
