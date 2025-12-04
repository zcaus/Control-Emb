
import { AppState, WeekData } from './types';

// Helper to check if a date is a weekend
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

// Generate weeks structure dynamically based on month/year
export const generateWeeksForMonth = (year: number, month: number): WeekData[] => {
  const weeks: WeekData[] = [];
  const date = new Date(year, month, 1);
  
  let currentWeekId = 1;
  let currentWeekDays: string[] = [];
  
  // We need to group by "Visual Week" (rows in a calendar).
  // Usually, a new row starts on Sunday.
  
  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay(); // 0-6
    const dateStr = date.toISOString().split('T')[0];

    // If it's a working day (Mon-Fri), add to current buffer
    if (!isWeekend(date)) {
      currentWeekDays.push(dateStr);
    }

    // If it's Saturday (end of week) or End of Month, push the week
    const isSaturday = dayOfWeek === 6;
    
    // Move to next day to check if month ends
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    const isEndOfMonth = nextDay.getMonth() !== month;

    if ((isSaturday || isEndOfMonth) && currentWeekDays.length > 0) {
      weeks.push({
        id: currentWeekId,
        label: `${currentWeekId}ª SEMANA`,
        goal: 0, // Default goal, can be updated by logic later
        days: [...currentWeekDays]
      });
      currentWeekDays = []; // Reset buffer
      currentWeekId++;
    }

    date.setDate(date.getDate() + 1);
  }

  // Set default goals based on number of working days in that week
  // Default logic: 6000 * number of working days
  return weeks.map(w => ({
    ...w,
    goal: w.days.length * 6000
  }));
};

export const calculateKPIs = (state: AppState) => {
  let totalProduced = 0;
  let totalGoal = 0;
  let totalOEs = 0;
  let filledDaysCount = 0; // Days with production data
  let totalEffectiveWorkingDays = 0; // Total days in month minus excluded days

  // Calculate totals
  state.weeks.forEach(week => {
    totalGoal += week.goal;
    
    // Count effective working days in this week
    const effectiveDaysInWeek = week.days.filter(d => !state.excludedDates[d]).length;
    totalEffectiveWorkingDays += effectiveDaysInWeek;

    week.days.forEach(dateStr => {
      const entry = state.dailyEntries[dateStr];
      const isExcluded = state.excludedDates[dateStr];

      if (entry) {
        totalProduced += (entry.quantity || 0);
        totalOEs += (entry.oes || 0);
        
        // Count as a filled day for stats if it has quantity
        if ((entry.quantity || 0) > 0) {
           filledDaysCount++;
        }
      }
    });
  });

  const missingGoal = Math.max(0, totalGoal - totalProduced);
  
  // Weekly Breakdown
  const weeklyStats = state.weeks.map(week => {
    let weekTotal = 0;
    let weekOEs = 0;
    let weekFilledDays = 0;

    week.days.forEach(dateStr => {
      const entry = state.dailyEntries[dateStr];
      if (entry) {
        weekTotal += (entry.quantity || 0);
        weekOEs += (entry.oes || 0);
        if ((entry.quantity || 0) > 0) weekFilledDays++;
      }
    });

    const percent = week.goal > 0 ? (weekTotal / week.goal) * 100 : 0;

    return {
      ...week,
      produced: weekTotal,
      oes: weekOEs,
      percent,
      filledDays: weekFilledDays
    };
  });

  // Forecasting
  // Forecast = Current Total + (Daily Average * Remaining Business Days)
  const averagePerDay = filledDaysCount > 0 ? totalProduced / filledDaysCount : 0;
  
  // Remaining days should only be future EFFECTIVE working days that don't have data yet
  let remainingEffectiveDays = 0;
  state.weeks.forEach(week => {
    week.days.forEach(dateStr => {
      const isExcluded = state.excludedDates[dateStr];
      const hasData = state.dailyEntries[dateStr] && state.dailyEntries[dateStr].quantity > 0;
      
      if (!isExcluded && !hasData) {
        remainingEffectiveDays++;
      }
    });
  });

  const forecast = totalProduced + (averagePerDay * remainingEffectiveDays);

  // Current Week Logic: Find the last week that has any production data (quantity > 0)
  // If no data exists, fallback to the first week.
  const lastActiveWeekIndex = [...weeklyStats].reverse().findIndex(w => w.produced > 0);
  
  const activeWeekIdx = lastActiveWeekIndex === -1 
    ? 0 
    : weeklyStats.length - 1 - lastActiveWeekIndex;
    
  const activeWeekStat = weeklyStats[activeWeekIdx] || { produced: 0, filledDays: 0 };

  // Strict average calculation: Sum of Week Quantities / Count of Days with Executed Quantity
  const weeklyAverage = activeWeekStat.filledDays > 0 
    ? activeWeekStat.produced / activeWeekStat.filledDays 
    : 0;

  return {
    monthlyTotal: totalProduced,
    monthlyGoal: totalGoal,
    monthlyPercent: totalGoal > 0 ? (totalProduced / totalGoal) * 100 : 0,
    totalOEs,
    missingGoal,
    weeklyStats,
    averagePerDay, 
    currentWeekAverage: weeklyAverage,
    currentWeekTotal: activeWeekStat.produced,
    forecast: Math.round(forecast),
    totalWorkingDays: totalEffectiveWorkingDays
  };
};

export const getMonthName = (monthIndex: number) => {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return months[monthIndex];
};
