
import React, { useState } from 'react';
import { RunRateData, System } from '../types';

interface RunRateViewProps {
  runRates: RunRateData;
  onUpdate: (year: number, month: number, system: System, amount: number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TeamView: React.FC<RunRateViewProps> = ({ runRates, onUpdate }) => {
  const [selectedYear, setSelectedYear] = useState(2026);
  
  const platforms = [System.EOM, System.TOM, System.C3];

  const getMonthTotal = (monthIdx: number) => {
    const data = runRates[selectedYear]?.[monthIdx] || { [System.EOM]: 0, [System.TOM]: 0, [System.C3]: 0 };
    // Fix: Explicitly cast the result of Object.values(data) to number[] to resolve '+' operator error on 'unknown' types during reduction.
    return (Object.values(data) as number[]).reduce((acc: number, val: number) => acc + val, 0);
  };

  const getPlatformTotal = (platform: System) => {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      total += runRates[selectedYear]?.[i]?.[platform] || 0;
    }
    return total;
  };

  const grandTotal = platforms.reduce((acc, p) => acc + getPlatformTotal(p), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-tight">Financial Governance Enabled</h3>
          <p className="text-xs text-indigo-700">Manage monthly platform run rates and global delivery burn.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monthly Run Rate</h2>
          <p className="text-slate-500 text-sm">Define operational burn per platform. This impacts financial gap analysis.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
          {[2025, 2026, 2027].map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedYear === year ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-20 border-r border-slate-100">Platform</th>
                {MONTHS.map((month, idx) => (
                  <th key={idx} className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center min-w-[100px]">
                    {month}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right sticky right-0 bg-slate-50 z-20 border-l border-slate-100">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {platforms.map(platform => (
                <tr key={platform} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">{platform}</td>
                  {MONTHS.map((_, monthIdx) => (
                    <td key={monthIdx} className="px-2 py-4">
                      <div className="flex items-center gap-1 px-2 border border-slate-100 rounded-lg hover:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all bg-slate-50/30">
                        <span className="text-[10px] font-bold text-slate-300">$</span>
                        <input 
                          type="number"
                          step="1000"
                          className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 p-1.5"
                          value={runRates[selectedYear]?.[monthIdx]?.[platform] || 0}
                          onChange={(e) => onUpdate(selectedYear, monthIdx, platform, Number(e.target.value))}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right font-black text-indigo-600 sticky right-0 bg-white z-10 border-l border-slate-100">
                    ${getPlatformTotal(platform).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50/80 font-black border-t-2 border-slate-100">
                <td className="px-6 py-6 text-[10px] uppercase tracking-widest text-slate-400 sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Total Monthly Burn</td>
                {MONTHS.map((_, idx) => (
                  <td key={idx} className="px-4 py-6 text-center text-sm text-slate-900">
                    ${getMonthTotal(idx).toLocaleString()}
                  </td>
                ))}
                <td className="px-6 py-6 text-right text-lg text-indigo-700 sticky right-0 bg-slate-50 z-10 border-l border-slate-100">
                  ${grandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-4">Annual Platform Allocation</h4>
          <div className="space-y-4">
            {platforms.map(p => {
              const total = getPlatformTotal(p);
              const percent = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return (
                <div key={p}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-600">{p} System</span>
                    <span className="font-black text-indigo-600">${total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col justify-center">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Projected Run Rate ({selectedYear})</div>
          <div className="text-5xl font-black tracking-tighter text-white">
            ${grandTotal.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-4 font-medium italic">
            * Adjust monthly values to see impact on system financials and delivery gaps.
          </p>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
};

export default TeamView;
