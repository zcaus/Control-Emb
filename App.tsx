
import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import { DEFAULT_DAILY_GOAL } from './constants';
import { generateWeeksForMonth, getMonthName } from './utils';
import InputView from './components/InputView';
import DashboardView from './components/DashboardView';
import { LayoutDashboard, Table, ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard'>('input');
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'saving'>('connected');
  
  // Initialize with current date
  const today = new Date();
  
  const [appState, setAppState] = useState<AppState>(() => {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    return {
      dailyEntries: {},
      excludedDates: {},
      weeks: generateWeeksForMonth(currentYear, currentMonth),
      dailyGoal: DEFAULT_DAILY_GOAL,
      selectedMonth: currentMonth,
      selectedYear: currentYear
    };
  });

  // Effect to simulate connection check (Replace with real Firebase listener)
  useEffect(() => {
    const handleOnline = () => setDbStatus('connected');
    const handleOffline = () => setDbStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Re-generate weeks when month/year changes
  const handleMonthChange = (direction: 'prev' | 'next') => {
    setAppState(prev => {
      let newMonth = prev.selectedMonth;
      let newYear = prev.selectedYear;

      if (direction === 'prev') {
        newMonth--;
        if (newMonth < 0) {
          newMonth = 11;
          newYear--;
        }
      } else {
        newMonth++;
        if (newMonth > 11) {
          newMonth = 0;
          newYear++;
        }
      }

      // Generate new weeks
      const newWeeks = generateWeeksForMonth(newYear, newMonth);
      
      // Adjust goals for pre-existing exclusions
      const adjustedWeeks = newWeeks.map(w => {
        const excludedCount = w.days.filter(d => prev.excludedDates[d]).length;
        const effectiveDays = Math.max(0, w.days.length - excludedCount);
        return {
          ...w,
          goal: effectiveDays * prev.dailyGoal
        };
      });

      return {
        ...prev,
        selectedMonth: newMonth,
        selectedYear: newYear,
        weeks: adjustedWeeks
      };
    });
  };

  // Helper to trigger saving state momentarily
  const triggerSave = () => {
    if (dbStatus === 'disconnected') return;
    setDbStatus('saving');
    setTimeout(() => setDbStatus('connected'), 800);
  };

  const handleUpdateEntry = (dateStr: string, field: 'quantity' | 'oes', value: number) => {
    triggerSave();
    setAppState(prev => ({
      ...prev,
      dailyEntries: {
        ...prev.dailyEntries,
        [dateStr]: {
          ...(prev.dailyEntries[dateStr] || { dateStr, dayOfMonth: parseInt(dateStr.split('-')[2]), quantity: 0, oes: 0 }),
          [field]: value
        }
      }
    }));
  };

  const handleUpdateGoal = (weekId: number, value: number) => {
    triggerSave();
    setAppState(prev => ({
      ...prev,
      weeks: prev.weeks.map(w => w.id === weekId ? { ...w, goal: value } : w)
    }));
  };

  const handleUpdateDailyGoal = (value: number) => {
    triggerSave();
    setAppState(prev => {
      const updatedWeeks = prev.weeks.map(w => {
        const excludedCount = w.days.filter(d => prev.excludedDates[d]).length;
        const effectiveDays = Math.max(0, w.days.length - excludedCount);
        return {
          ...w,
          goal: value * effectiveDays
        };
      });
      return { 
        ...prev, 
        dailyGoal: value,
        weeks: updatedWeeks
      };
    });
  };

  const handleToggleDayExclusion = (dateStr: string) => {
    triggerSave();
    setAppState(prev => {
      const isCurrentlyExcluded = !!prev.excludedDates[dateStr];
      const newExcludedDates = { ...prev.excludedDates, [dateStr]: !isCurrentlyExcluded };
      
      const updatedWeeks = prev.weeks.map(w => {
        if (w.days.includes(dateStr)) {
          const excludedCount = w.days.filter(d => newExcludedDates[d]).length;
          const effectiveDays = Math.max(0, w.days.length - excludedCount);
          return {
            ...w,
            goal: effectiveDays * prev.dailyGoal
          };
        }
        return w;
      });

      return {
        ...prev,
        excludedDates: newExcludedDates,
        weeks: updatedWeeks
      };
    });
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 pb-20">
      
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-foxred text-white font-bold italic px-3 py-1 rounded-full text-xs tracking-wider shadow-sm shadow-red-200">FOXMIX</div>
              <h1 className="font-medium text-slate-700 hidden lg:block">Controle de Produção</h1>
            </div>

            {/* DB Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
              dbStatus === 'connected' ? 'bg-green-100 text-green-700 border border-green-200' :
              dbStatus === 'saving' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
              'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              {dbStatus === 'connected' && <Wifi size={14} className="text-green-600" />}
              {dbStatus === 'saving' && <RefreshCw size={14} className="text-amber-600 animate-spin" />}
              {dbStatus === 'disconnected' && <WifiOff size={14} className="text-gray-400" />}
              
              <span className="hidden sm:inline">
                {dbStatus === 'connected' ? 'Online' : 
                 dbStatus === 'saving' ? 'Salvando...' : 
                 'Offline'}
              </span>
              
              {dbStatus === 'connected' && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1"></span>
              )}
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-gray-100 rounded-full p-1 flex-shrink-0">
            <button onClick={() => handleMonthChange('prev')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-gray-500 hover:text-black hover:shadow-sm transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="px-2 sm:px-6 text-xs sm:text-sm font-semibold text-slate-700 min-w-[100px] sm:min-w-[140px] text-center uppercase tracking-wide truncate">
              {getMonthName(appState.selectedMonth)} <span className="text-gray-400 font-normal">{appState.selectedYear}</span>
            </div>
            <button onClick={() => handleMonthChange('next')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-gray-500 hover:text-black hover:shadow-sm transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-full p-1 gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'input' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table size={16} />
              <span className="hidden sm:inline">Tabela</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'input' ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
             <InputView 
                state={appState} 
                onUpdateEntry={handleUpdateEntry} 
                onUpdateGoal={handleUpdateGoal}
                onUpdateDailyGoal={handleUpdateDailyGoal}
                onToggleExclusion={handleToggleDayExclusion}
             />
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <DashboardView state={appState} />
          </div>
        )}
      </main>

    </div>
  );
};

export default App;
