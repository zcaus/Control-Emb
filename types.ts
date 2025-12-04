
export interface DailyData {
  dateStr: string; // Format YYYY-MM-DD
  dayOfMonth: number;
  quantity: number;
  oes: number;
}

export interface WeekData {
  id: number;
  label: string;
  goal: number;
  days: string[]; // Array of YYYY-MM-DD strings
}

export interface AppState {
  dailyEntries: Record<string, DailyData>; // Keyed by YYYY-MM-DD
  excludedDates: Record<string, boolean>; // Keyed by YYYY-MM-DD, true if excluded from goal
  weeks: WeekData[];
  dailyGoal: number;
  selectedMonth: number; // 0-11
  selectedYear: number;
}
