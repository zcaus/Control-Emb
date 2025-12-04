
import React from 'react';
import { AppState } from '../types';
import { calculateKPIs, getMonthName } from '../utils';

interface DashboardViewProps {
  state: AppState;
}

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  isHighlight?: boolean;
  isSuccess?: boolean;
  isMain?: boolean;
}> = ({ title, value, isHighlight = false, isSuccess = false, isMain = false }) => (
  <div className={`
    relative overflow-hidden rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300
    ${isMain ? 'bg-white shadow-soft border-2 border-foxblue/20 py-10' : 'bg-white shadow-soft border border-gray-100'}
  `}>
    <h3 className="font-semibold mb-2 uppercase tracking-wider text-xs text-gray-400">
      {title}
    </h3>
    <p className={`
      font-bold tracking-tighter leading-none
      ${isMain ? 'text-6xl md:text-7xl' : 'text-4xl md:text-5xl'}
      ${isSuccess ? 'text-green-500' : (isHighlight ? 'text-foxred' : 'text-slate-700')}
    `}>
      {value}
    </p>
  </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ state }) => {
  const kpis = calculateKPIs(state);

  return (
    <div className="max-w-6xl mx-auto min-h-[600px] flex flex-col">
      <div className="text-center mb-12">
        <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
          Relatório Mensal
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Performance
        </h1>
        <p className="text-xl text-gray-400 font-light mt-2">
          {getMonthName(state.selectedMonth)} {state.selectedYear}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
         {/* Top Row - Key Indicators */}
         <StatCard 
            title="Meta do Mês" 
            value={kpis.monthlyGoal.toLocaleString('pt-BR')} 
          />
          <StatCard 
            title="Total Produzido" 
            value={kpis.monthlyTotal.toLocaleString('pt-BR')} 
            isHighlight
          />
           <StatCard 
            title="Diferença Meta" 
            value={kpis.missingGoal.toLocaleString('pt-BR')} 
          />
           <StatCard 
            title="Meta Diária Config" 
            value={state.dailyGoal.toLocaleString('pt-BR')} 
          />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Main large cards for focus metrics */}
        <StatCard 
          title="Média da Semana" 
          value={kpis.currentWeekAverage.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} 
          isMain
          isHighlight
          isSuccess={kpis.currentWeekAverage > state.dailyGoal}
        />
        <StatCard 
          title="Previsão Fechamento" 
          value={kpis.forecast.toLocaleString('pt-BR')} 
          isMain
          isSuccess={kpis.forecast > kpis.monthlyGoal}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bottom secondary stats */}
         <StatCard 
            title="Embalagem Semana Atual" 
            value={kpis.currentWeekTotal.toLocaleString('pt-BR')} 
          />
           <StatCard 
            title="Total OE's" 
            value={kpis.totalOEs} 
          />
           <StatCard 
            title="Realização" 
            value={kpis.monthlyPercent.toFixed(0) + "%"}
            isHighlight 
            isSuccess={kpis.monthlyPercent > 100}
          />
      </div>

      <div className="flex justify-center mt-16 opacity-30 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-foxred rounded-full"></div>
          <span className="text-slate-900 font-bold text-xl tracking-tighter">FOXMIX</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;