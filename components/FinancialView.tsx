
import React, { useMemo } from 'react';
import { Feature, RunRateData, System } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Line, Legend } from 'recharts';
import { getMonthlyFinancials, getProgramFinancials, getFinancialComparison } from '../utils';

interface FinancialViewProps {
  features: Feature[];
  runRates: RunRateData;
  activeSystem: System | 'global';
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinancialView: React.FC<FinancialViewProps> = ({ features, runRates, activeSystem }) => {
  const monthlyFinancials = useMemo(() => getMonthlyFinancials(features), [features]);
  const comparisonData = useMemo(() => getFinancialComparison(features, runRates, activeSystem), [features, runRates, activeSystem]);
  const programFinancials = useMemo(() => getProgramFinancials(features), [features]);
  const totalBudget = features.reduce((sum, f) => sum + f.estimatedCost, 0);

  const totalRunRate = comparisonData.reduce((acc, d) => acc + d.runRate, 0);

  const topProgram = programFinancials[0];
  const secondProgram = programFinancials[1];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Orchestration</h2>
          <p className="text-slate-500 text-sm">System-level financial health. Comparing feature value delivery against operational burn.</p>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Budget</div>
          <div className="text-2xl font-black text-slate-900">${totalBudget.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-1">Portfolio value</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Run Rate</div>
          <div className="text-2xl font-black text-indigo-600">${totalRunRate.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-1">Operational burn</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Top Program: {topProgram?.name || 'N/A'}</div>
          <div className="text-2xl font-black text-emerald-600">${topProgram?.cost.toLocaleString() || '0'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Primary investment</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">2nd Program: {secondProgram?.name || 'N/A'}</div>
          <div className="text-2xl font-black text-emerald-600">${secondProgram?.cost.toLocaleString() || '0'}</div>
          <div className="text-[10px] text-slate-500 mt-1">Secondary investment</div>
        </div>
      </div>

      {/* Comparison Analysis Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Operational Burn vs. Delivery Value</h3>
            <p className="text-xs text-slate-400 mt-1">Monthly platform run rate compared to feature value realized (estimated cost) upon completion.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Period Run Rate</div>
               <div className="text-lg font-black text-indigo-600">${totalRunRate.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
              <Tooltip 
                formatter={(val: number) => [`$${val.toLocaleString()}`]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Bar dataKey="runRate" name="Op. Burn" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="budget" name="Value Delivered" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              <Line type="monotone" dataKey="diff" name="Gap" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 overflow-hidden border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest">Month</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-right">Run Rate (Burn)</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-right">Value Realized</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {comparisonData.filter(row => row.runRate > 0 || row.budget > 0).map(row => (
                <tr key={row.rawKey} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-700">{row.month}</td>
                  <td className="px-4 py-3 text-right text-indigo-600 font-medium">${row.runRate.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">${row.budget.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-black ${row.diff >= 0 ? 'text-orange-500' : 'text-indigo-500'}`}>
                    ${Math.abs(row.diff).toLocaleString()} {row.diff >= 0 ? '(Excess Burn)' : '(Under Burn)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Payment Outflow</h3>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-black px-2 py-0.5 rounded uppercase tracking-widest">Feature Payments</span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinancials}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip 
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Payment']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="payment" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Cumulative Realized Value</h3>
            <span className="text-[10px] bg-green-100 text-green-700 font-black px-2 py-0.5 rounded uppercase tracking-widest">Investment Execution</span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFinancials}>
                <defs>
                  <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip 
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Total Delivered']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#10b981" fillOpacity={1} fill="url(#colorCum)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Funding by Program Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Funding by Program</h3>
            <p className="text-xs text-slate-400 mt-1">Total investment distributed across associated programs. Costs are split for multi-program features.</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Active Programs</div>
            <div className="text-lg font-black text-indigo-600">{programFinancials.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programFinancials} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 600 }} width={120} />
                <Tooltip 
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Funding']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
            {programFinancials.map((prog, idx) => {
              const percentage = totalBudget > 0 ? (prog.cost / totalBudget) * 100 : 0;
              return (
                <div key={prog.name} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{prog.name}</span>
                    <span className="text-xs font-black text-indigo-600">${prog.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{Math.round(percentage)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
};

export default FinancialView;
