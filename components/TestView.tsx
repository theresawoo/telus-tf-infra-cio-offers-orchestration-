
import React, { useState, useEffect } from 'react';
import { runSuite } from '../testing/suite';
import { TestResult } from '../types';

const TestView: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    const res = await runSuite();
    setResults(res);
    setRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const totalDuration = results.reduce((acc, r) => acc + r.duration, 0).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quality Assurance</h2>
          <p className="text-slate-500 text-sm">Automated unit tests ensuring business logic integrity.</p>
        </div>
        <button 
          onClick={runTests}
          disabled={running}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-all"
        >
          {running ? 'Running...' : 'Rerun Suite'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pass Rate</div>
          <div className="text-3xl font-black text-green-600">
            {results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">{passedCount} tests passed</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Failures</div>
          <div className="text-3xl font-black text-red-600">{failedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Issues requiring attention</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Execution Time</div>
          <div className="text-3xl font-black text-indigo-600">{totalDuration}ms</div>
          <div className="text-xs text-slate-500 mt-1">Total suite runtime</div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="ml-4 text-xs font-mono text-slate-400">Unit Tests Suite v1.0.4</span>
          </div>
        </div>
        
        <div className="p-6 font-mono text-sm space-y-3 max-h-[500px] overflow-y-auto">
          {results.map((res, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${res.status === 'passed' ? 'bg-green-500/5 text-green-400' : 'bg-red-500/5 text-red-400'}`}>
              <span className="shrink-0">{res.status === 'passed' ? '✓' : '✗'}</span>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold">{res.name}</span>
                  <span className="text-slate-500 text-[10px]">{res.duration.toFixed(2)}ms</span>
                </div>
                {res.error && (
                  <div className="mt-2 text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-800/30">
                    {res.error}
                  </div>
                )}
              </div>
            </div>
          ))}
          {results.length === 0 && <div className="text-slate-500 italic">No tests executed yet.</div>}
        </div>
      </div>

      {/* Line space at end for better visibility */}
      <div className="h-24" />
    </div>
  );
};

export default TestView;
