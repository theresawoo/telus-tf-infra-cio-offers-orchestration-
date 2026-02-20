
import React, { useState, useMemo } from 'react';
import { Feature, AppTab, Sprint, System, RunRateData, LogEntry } from './types';
import { INITIAL_FEATURES, INITIAL_SPRINTS, INITIAL_RUN_RATE } from './constants';
import { reorderList, updateFeatureDatesFromSprints, createLogDescription } from './utils';
import FeatureView from './components/FeatureView';
import TimelineView from './components/TimelineView';
import FinancialView from './components/FinancialView';
import TeamView from './components/TeamView';
import TestView from './components/TestView';
import LogView from './components/LogView';

const App: React.FC = () => {
  const [activeSystem, setActiveSystem] = useState<System | 'global'>('global');
  const [activeTab, setActiveTab] = useState<AppTab>('features');
  
  // Local In-Memory State
  const [features, setFeatures] = useState<Feature[]>(INITIAL_FEATURES);
  const [sprints, setSprints] = useState<Sprint[]>(INITIAL_SPRINTS);
  const [runRates, setRunRates] = useState<RunRateData>(INITIAL_RUN_RATE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(false);

  const addLog = (type: 'feature' | 'sprint', entityId: string, entityName: string, action: string, details: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLog: LogEntry = {
      id,
      timestamp: new Date().toISOString(),
      type,
      entityId,
      entityName,
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateFeature = (updated: Feature) => {
    setFeatures(prev => {
      const original = prev.find(f => f.id === updated.id);
      if (original) {
        const details = createLogDescription(original, updated);
        if (details !== 'No identifiable changes') {
          addLog('feature', updated.id, updated.name, 'Updated Feature', details);
        }
      }
      return prev.map(f => f.id === updated.id ? updated : f);
    });
  };

  const handleDeleteFeature = (id: string) => {
    const original = features.find(f => f.id === id);
    if (original) {
      addLog('feature', id, original.name, 'Deleted Feature', `Feature removed from backlog.`);
    }
    setFeatures(prev => prev.filter(f => f.id !== id));
  };

  const handleAddFeature = (newFeature: Feature) => {
    addLog('feature', newFeature.id, newFeature.name, 'Added Feature', `New feature created.`);
    setFeatures(prev => [...prev, newFeature]);
  };

  const handleReorderFeatures = (fromIndex: number, toIndex: number) => {
    setFeatures(prev => reorderList(prev, fromIndex, toIndex));
  };

  const handleAddSprint = (sprint: Sprint) => {
    addLog('sprint', sprint.id, sprint.name, 'Added Sprint', `New sprint created.`);
    setSprints(prev => [...prev, sprint]);
  };

  const handleUpdateSprint = (updated: Sprint) => {
    setSprints(prev => {
      const original = prev.find(s => s.id === updated.id);
      if (original) {
        const details = createLogDescription(original, updated);
        if (details !== 'No identifiable changes') {
          addLog('sprint', updated.id, updated.name, 'Updated Sprint', details);
        }
      }
      return prev.map(s => s.id === updated.id ? updated : s);
    });
  };

  const handleDeleteSprint = (id: string) => {
    const original = sprints.find(s => s.id === id);
    if (original) {
      addLog('sprint', id, original.name, 'Deleted Sprint', `Sprint removed.`);
    }
    
    // Clean up sprint lists
    setSprints(prev => prev.filter(s => s.id !== id));
    
    // Clean up allocations in features
    setFeatures(prev => prev.map(f => {
      const hasAllocation = f.sprintAllocations.some(sa => sa.sprintId === id);
      if (hasAllocation) {
        const nextAllocations = f.sprintAllocations.filter(sa => sa.sprintId !== id);
        return updateFeatureDatesFromSprints(
          { ...f, sprintAllocations: nextAllocations }, 
          sprints.filter(s => s.id !== id)
        );
      }
      return f;
    }));
  };

  const handleUpdateRunRate = (year: number, month: number, system: System, amount: number) => {
    if (!isAdmin) return;
    setRunRates(prev => {
      const next = { ...prev };
      if (!next[year]) next[year] = {};
      if (!next[year][month]) next[year][month] = { [System.TOM]: 0, [System.EOM]: 0, [System.C3]: 0 };
      next[year][month][system] = amount;
      return next;
    });
  };

  const filteredFeatures = useMemo(() => {
    if (activeSystem === 'global') return features;
    return features.filter(f => f.system === activeSystem);
  }, [features, activeSystem]);

  const filteredSprints = useMemo(() => {
    if (activeSystem === 'global') return sprints;
    return sprints.filter(s => s.system === activeSystem);
  }, [sprints, activeSystem]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Offers Orchestrator</h1>
              </div>
            </div>
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['global', System.EOM, System.TOM, System.C3].map((sys) => (
                <button
                  key={sys}
                  onClick={() => setActiveSystem(sys as any)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeSystem === sys ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {sys.toUpperCase()}
                </button>
              ))}
              <div className="w-px h-4 bg-slate-300 mx-2" />
              <button
                onClick={() => setIsAdmin(!isAdmin)}
                className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  isAdmin ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {isAdmin ? 'Admin: ON' : 'Admin: OFF'}
              </button>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-8 h-12">
            {[
              { id: 'features', label: 'Features' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'financials', label: 'Financials' },
              isAdmin && { id: 'team', label: 'Run Rate' },
              isAdmin && { id: 'quality', label: 'Quality' },
              isAdmin && { id: 'logs', label: 'Logs' }
            ].filter((t): t is any => !!t).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-full px-1 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {activeTab === 'features' && (
          <FeatureView 
            features={filteredFeatures} 
            sprints={filteredSprints} 
            onUpdate={handleUpdateFeature} 
            onDelete={handleDeleteFeature} 
            onAdd={handleAddFeature} 
            onReorder={handleReorderFeatures} 
            onUpdateSprint={handleUpdateSprint} 
            activeSystem={activeSystem} 
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineView 
            features={filteredFeatures} 
            sprints={filteredSprints} 
            activeSystem={activeSystem}
            onUpdate={handleUpdateFeature} 
            onAddSprint={handleAddSprint} 
            onUpdateSprint={handleUpdateSprint} 
            onDeleteSprint={handleDeleteSprint} 
          />
        )}
        {activeTab === 'financials' && (
          <FinancialView 
            features={filteredFeatures} 
            runRates={runRates} 
            activeSystem={activeSystem} 
          />
        )}
        {activeTab === 'team' && isAdmin && (
          <TeamView 
            runRates={runRates} 
            onUpdate={handleUpdateRunRate} 
          />
        )}
        {activeTab === 'quality' && isAdmin && <TestView />}
        {activeTab === 'logs' && isAdmin && <LogView logs={logs} />}
      </main>
    </div>
  );
};

export default App;
