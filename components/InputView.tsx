import React from 'react';
import { AppState } from '../types';
import { calculateKPIs } from '../utils';
import { CalendarOff, CheckCircle2 } from 'lucide-react';

interface InputViewProps {
  state: AppState;
  onUpdateEntry: (dateStr: string, field: 'quantity' | 'oes', value: number) => void;
  onUpdateGoal: (weekId: number, value: number) => void;
  onUpdateDailyGoal: (value: number) => void;
  onToggleExclusion: (dateStr: string) => void;
}

const InputView: React.FC<InputViewProps> = ({ state, onUpdateEntry, onUpdateGoal, onUpdateDailyGoal, onToggleExclusion }) => {
  const kpis = calculateKPIs(state);

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Left Column: Weekly Summary Card */}
      <div className="w-full xl:w-1/3 flex-shrink-0 space-y-6">
        
        {/* Global Config Card */}
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
          <label className="block text-sm font-bold text-slate-700 mb-2">Meta Diária Padrão</label>
          <div className="flex items-center gap-3">
             <input 
              type="number" 
              value={state.dailyGoal} 
              onChange={(e) => onUpdateDailyGoal(Number(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
            />
            <span className="text-xs text-gray-400 leading-tight">
              Aplica-se a todos os dias úteis ativos.
            </span>
          </div>
        </div>

        {/* Summary Table Card */}
        <div className="bg-white rounded-3xl p-0 shadow-soft border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-bold text-slate-800 text-lg">Resumo Semanal</h3>
            <p className="text-sm text-gray-400">Progresso acumulado por semana</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Semana</th>
                  <th className="py-3 px-4 font-medium text-right">Qtd.</th>
                  <th className="py-3 px-4 font-medium text-right">Meta</th>
                  <th className="py-3 px-4 font-medium text-center">%</th>
                  <th className="py-3 px-4 font-medium text-right">OE's</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kpis.weeklyStats.map((week) => (
                  <tr key={week.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-700">{week.label}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{week.produced.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 text-right">
                      <input 
                        type="number" 
                        className="w-20 text-right bg-transparent border-b border-dashed border-gray-300 focus:border-blue-400 outline-none text-slate-600"
                        value={week.goal}
                        onChange={(e) => onUpdateGoal(week.id, Number(e.target.value))}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        week.percent >= 100 ? 'bg-green-100 text-green-700' : 
                        week.percent >= 80 ? 'bg-blue-50 text-blue-700' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {week.percent.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">{week.oes}</td>
                  </tr>
                ))}
                
                {/* Totals */}
                <tr className="bg-slate-50 font-bold">
                  <td className="py-4 px-4 text-slate-800">TOTAL</td>
                  <td className="py-4 px-4 text-right text-slate-800">{kpis.monthlyTotal.toLocaleString('pt-BR')}</td>
                  <td className="py-4 px-4 text-right text-slate-500">{kpis.monthlyGoal.toLocaleString('pt-BR')}</td>
                  <td className="py-4 px-4 text-center text-blue-600">{kpis.monthlyPercent.toFixed(0)}%</td>
                  <td className="py-4 px-4 text-right text-slate-500">{kpis.totalOEs}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Daily Grid */}
      <div className="flex-grow space-y-6">
         <div className="flex justify-between items-end">
           <div>
             <h3 className="font-bold text-slate-800 text-2xl">Entrada Diária</h3>
             <p className="text-gray-400 text-sm">Preencha a produção ou marque folgas.</p>
           </div>
         </div>

         {state.weeks.length === 0 && (
           <div className="p-8 bg-white rounded-3xl text-center border border-dashed border-gray-200 text-gray-400">
             Nenhum dia útil encontrado neste mês.
           </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {state.weeks.map((week) => (
             <div key={week.id} className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
               <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                 <span className="font-bold text-slate-700 text-sm tracking-wide uppercase">{week.label}</span>
                 <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                    {week.days.filter(d => !state.excludedDates[d]).length} Dias Úteis
                 </span>
               </div>
               
               <div className="p-2">
                 <table className="w-full text-sm">
                   <tbody>
                     {week.days.map(dateStr => {
                       const dayNum = parseInt(dateStr.split('-')[2]);
                       const isExcluded = !!state.excludedDates[dateStr];

                       return (
                         <tr key={dateStr} className={`group rounded-xl transition-all ${isExcluded ? 'opacity-60' : ''}`}>
                           <td className="py-2 pl-3 w-10">
                              <button 
                                onClick={() => onToggleExclusion(dateStr)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                                  isExcluded 
                                    ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                                    : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'
                                }`}
                                title={isExcluded ? "Ativar dia" : "Marcar como folga"}
                              >
                                {isExcluded ? <CalendarOff size={14} /> : <CheckCircle2 size={14} />}
                              </button>
                           </td>
                           <td className="py-2 px-2 w-12 text-center">
                              <span className={`text-sm font-bold ${isExcluded ? 'text-gray-300' : 'text-slate-700'}`}>{dayNum}</span>
                           </td>
                           <td className="py-2 px-2">
                             <div className={`relative rounded-xl overflow-hidden ${isExcluded ? 'bg-gray-50' : 'bg-gray-50 group-hover:bg-blue-50/50 transition-colors'}`}>
                               <input 
                                  type="number"
                                  placeholder={isExcluded ? "Folga" : "0"}
                                  className="w-full py-2 px-3 text-right bg-transparent outline-none font-medium text-slate-700 placeholder-gray-300"
                                  value={state.dailyEntries[dateStr]?.quantity || ''}
                                  onChange={(e) => onUpdateEntry(dateStr, 'quantity', Number(e.target.value))}
                                  disabled={isExcluded}
                               />
                             </div>
                           </td>
                           <td className="py-2 pr-3 pl-2 w-24">
                              <div className={`relative rounded-xl overflow-hidden ${isExcluded ? 'bg-gray-50' : 'bg-white border border-gray-100 group-hover:border-blue-100 transition-colors'}`}>
                               <input 
                                  type="number"
                                  placeholder="OE"
                                  className="w-full py-2 px-3 text-center bg-transparent outline-none text-xs text-gray-500"
                                  value={state.dailyEntries[dateStr]?.oes || ''}
                                  onChange={(e) => onUpdateEntry(dateStr, 'oes', Number(e.target.value))}
                                  disabled={isExcluded}
                               />
                             </div>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default InputView;