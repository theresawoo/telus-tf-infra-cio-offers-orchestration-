
import React, { useState, useMemo } from 'react';
import { LogEntry } from '../types';
import { filterLogs } from '../utils';

interface LogViewProps {
  logs: LogEntry[];
}

const LogView: React.FC<LogViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredLogs = useMemo(() => {
    return filterLogs(logs, searchQuery, typeFilter);
  }, [logs, searchQuery, typeFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Activity Logs</h2>
          <p className="text-slate-500 text-sm">Audit trail of all administrative changes across Features and Sprints.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entity Type</label>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Types</option>
            <option value="Feature">Feature</option>
            <option value="Sprint">Sprint</option>
          </select>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search</label>
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text"
              placeholder="Search logs by name, action, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${
                        log.type === 'feature' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">
                      {log.entityName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 leading-relaxed max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
};

export default LogView;
