
import React, { useState, useMemo, useRef } from 'react';
import { Feature, Sprint, Priority, Status, System } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../constants';
import { getTimelineMonths, calculateDatePosition, getDateRangePresets, calculateProgramReadiness, doSprintsOverlap } from '../utils';
import FeatureDrawer from './FeatureDrawer';
import SprintDrawer from './SprintDrawer';

interface TimelineViewProps {
  features: Feature[];
  sprints: Sprint[];
  activeSystem: System | 'global';
  onUpdate: (f: Feature) => void;
  onAddSprint: (s: Sprint) => void;
  onUpdateSprint: (s: Sprint) => void;
  onDeleteSprint: (id: string) => void;
}

type ViewRangeType = 'all' | 'month' | 'quarter' | 'year' | 'custom';

const TimelineView: React.FC<TimelineViewProps> = ({ 
  features, 
  sprints, 
  activeSystem,
  onUpdate,
  onAddSprint,
  onUpdateSprint,
  onDeleteSprint
}) => {
  const [viewRange, setViewRange] = useState<ViewRangeType>('all');
  const [showClosedSprints, setShowClosedSprints] = useState(false);
  const [customRange, setCustomRange] = useState({
    start: '2026-01-01',
    end: '2026-12-31'
  });
  
  // Local string states for free-form custom range inputs
  const [startStr, setStartStr] = useState(customRange.start);
  const [endStr, setEndStr] = useState(customRange.end);

  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [viewingFeaturesSprintId, setViewingFeaturesSprintId] = useState<string | null>(null);

  const hiddenStartRef = useRef<HTMLInputElement>(null);
  const hiddenEndRef = useRef<HTMLInputElement>(null);

  // Set default current year to 2026 for the requested data context
  const currentYear = 2026;

  const rangeBounds = useMemo(() => {
    if (viewRange === 'all') return undefined;
    if (viewRange === 'custom') {
      return { start: new Date(customRange.start), end: new Date(customRange.end) };
    }
    const presets = getDateRangePresets();
    const yearBase = currentYear;
    if (viewRange === 'year') {
      return { start: new Date(yearBase, 0, 1), end: new Date(yearBase, 11, 31) };
    }
    return presets[viewRange];
  }, [viewRange, customRange]);

  const months = useMemo(() => getTimelineMonths(features, rangeBounds), [features, rangeBounds]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPos = useMemo(() => {
    if (months.length === 0) return null;
    const pos = calculateDatePosition(todayStr, months, rangeBounds);
    // Only show if today is within the visible range
    const today = new Date();
    const minDate = rangeBounds?.start || months[0];
    const lastMonth = months[months.length - 1];
    const maxDate = rangeBounds?.end || new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    if (today < minDate || today > maxDate) return null;
    return pos;
  }, [todayStr, months, rangeBounds]);

  const selectedFeature = useMemo(() => 
    features.find(f => f.id === selectedFeatureId), 
    [features, selectedFeatureId]
  );

  const selectedSprint = useMemo(() => 
    sprints.find(s => s.id === selectedSprintId),
    [sprints, selectedSprintId]
  );

  const activeSprint = useMemo(() => {
    const found = sprints.find(s => todayStr >= s.startDate && todayStr <= s.endDate);
    if (found) return found;
    return sprints.find(s => s.startDate >= '2026-01-01');
  }, [sprints, todayStr]);

  const activeSprintMetrics = useMemo(() => {
    if (!activeSprint) return null;
    const usedPoints = features.reduce((acc, f) => {
      const alloc = f.sprintAllocations.find(sa => sa.sprintId === activeSprint.id);
      return acc + (alloc?.points || 0);
    }, 0);
    const utilization = activeSprint.capacity > 0 ? (usedPoints / activeSprint.capacity) * 100 : 0;
    return { usedPoints, utilization };
  }, [activeSprint, features]);

  const stats = useMemo(() => {
    const completed = features.filter(f => f.status === 'Completed').length;
    const active = features.filter(f => f.status === 'In Progress').length;
    
    const yearFeatures = features.filter(f => {
      const year = new Date(f.endDate).getFullYear();
      return year === currentYear;
    });
    const completedThisYear = yearFeatures.filter(f => f.status === 'Completed').length;
    const totalThisYear = yearFeatures.length;
    const annualProgress = totalThisYear > 0 ? Math.round((completedThisYear / totalThisYear) * 100) : 0;

    return { 
      completed, 
      active, 
      total: features.length,
      completedThisYear,
      totalThisYear,
      annualProgress
    };
  }, [features, currentYear]);

  const handleAddNewSprint = () => {
    const start = '2026-01-01';
    const twoWeeks = '2026-01-14';
    const nextDay = '2026-01-15';
    
    const newSprint: Sprint = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Sprint ${sprints.length + 1}`,
      startDate: start,
      endDate: twoWeeks,
      targetDeploymentDate: nextDay,
      capacity: 40,
      isClosed: false,
      system: activeSystem === 'global' ? System.TOM : activeSystem
    };
    onAddSprint(newSprint);
    setSelectedSprintId(newSprint.id);
  };

  const handleCustomRangeUpdate = (type: 'start' | 'end', val: string) => {
    if (type === 'start') setStartStr(val);
    else setEndStr(val);

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      setCustomRange(prev => ({ ...prev, [type]: val }));
    }
  };

  const handleSyncCustomRange = () => {
    setStartStr(customRange.start);
    setEndStr(customRange.end);
  };

  const visibleSprints = useMemo(() => {
    return sprints.filter(s => showClosedSprints || !s.isClosed);
  }, [sprints, showClosedSprints]);

  const triggerPicker = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          ref.current.showPicker();
        } else {
          ref.current.focus();
        }
      } catch (e) {
        ref.current.focus();
      }
    }
  };

  const viewingFeaturesSprint = useMemo(() => 
    sprints.find(s => s.id === viewingFeaturesSprintId),
    [sprints, viewingFeaturesSprintId]
  );

  const featuresInSprint = useMemo(() => {
    if (!viewingFeaturesSprintId) return [];
    return features.filter(f => f.sprintAllocations.some(sa => sa.sprintId === viewingFeaturesSprintId));
  }, [features, viewingFeaturesSprintId]);

  const CalendarIcon = () => (
    <svg className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="relative">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Delivery Timeline</h2>
            <p className="text-slate-500 text-sm">Visualize feature delivery over time. Manage delivery cadence and team capacity.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
            {(['all', 'month', 'quarter', 'year', 'custom'] as ViewRangeType[]).map((type) => (
              <button
                key={type}
                onClick={() => setViewRange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  viewRange === type 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
            
            {viewRange === 'custom' && (
              <div className="flex items-center gap-2 px-2 border-l border-slate-200 ml-2 animate-in fade-in slide-in-from-left-2">
                <div className="relative group cursor-pointer">
                  <input 
                    type="text" 
                    value={startStr} 
                    placeholder="YYYY-MM-DD"
                    className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded pl-2 pr-7 py-1 outline-none cursor-pointer hover:bg-slate-100" 
                    onChange={(e) => handleCustomRangeUpdate('start', e.target.value)}
                    onClick={() => triggerPicker(hiddenStartRef)}
                    onBlur={handleSyncCustomRange}
                  />
                  <CalendarIcon />
                  <input ref={hiddenStartRef} type="date" value={customRange.start} className="absolute inset-0 opacity-0 pointer-events-none" onChange={(e) => handleCustomRangeUpdate('start', e.target.value)} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold">to</span>
                <div className="relative group cursor-pointer">
                  <input 
                    type="text" 
                    value={endStr} 
                    placeholder="YYYY-MM-DD"
                    className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded pl-2 pr-7 py-1 outline-none cursor-pointer hover:bg-slate-100" 
                    onChange={(e) => handleCustomRangeUpdate('end', e.target.value)}
                    onClick={() => triggerPicker(hiddenEndRef)}
                    onBlur={handleSyncCustomRange}
                  />
                  <CalendarIcon />
                  <input ref={hiddenEndRef} type="date" value={customRange.end} className="absolute inset-0 opacity-0 pointer-events-none" onChange={(e) => handleCustomRangeUpdate('end', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Summary Statistics Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deliverables</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{stats.total}</span>
              <span className="text-xs font-bold text-slate-400">PLANNED</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{stats.completed} lifetime completions</div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Projected Sprint</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-indigo-600 truncate max-w-full">
                {activeSprint ? activeSprint.name : 'No Active Sprint'}
              </span>
            </div>
            {activeSprint && (
              <div className="text-[10px] text-slate-500 mt-1 font-bold">
                Ends {new Date(activeSprint.endDate).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sprint Utilization</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${activeSprintMetrics && activeSprintMetrics.utilization > 100 ? 'text-red-500' : 'text-emerald-600'}`}>
                {activeSprintMetrics ? Math.round(activeSprintMetrics.utilization) : 0}%
              </span>
            </div>
            {activeSprintMetrics && (
              <div className="text-[10px] text-slate-500 mt-1">
                {activeSprintMetrics.usedPoints} / {activeSprint ? activeSprint.capacity : 0} PTS Used
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg shadow-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Delivery ({currentYear})</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{stats.completedThisYear}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">/ {stats.totalThisYear} COMPLETED</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-full transition-all duration-700" style={{ width: `${stats.annualProgress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Main Timeline View */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
          <div className="overflow-x-auto">
            <div className="flex border-b border-slate-200 bg-slate-50 min-w-[900px]">
              <div className="w-72 p-4 border-r border-slate-200 shrink-0 font-semibold text-xs text-slate-400 uppercase tracking-wider">Feature Roadmap</div>
              <div className="flex-1 flex">
                {months.length === 0 ? (
                  <div className="flex-1 p-4 text-center text-xs font-bold text-slate-400 uppercase">No months in view</div>
                ) : (
                  months.map((m, idx) => (
                    <div key={idx} className="flex-1 border-r border-slate-200 p-4 text-center text-xs font-bold text-slate-600">
                      {m.toLocaleString('default', { month: 'short', year: '2-digit' })}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="min-w-[900px] relative">
              {/* Today Indicator Line */}
              {todayPos !== null && (
                <div 
                  className="absolute top-0 bottom-0 z-30 pointer-events-none"
                  style={{ left: `calc(18rem + (100% - 18rem) * ${todayPos / 100})` }}
                >
                  <div className="h-full w-[2px] bg-red-500 opacity-60 relative">
                    <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                    <div className="absolute top-3 -left-6 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">TODAY</div>
                  </div>
                </div>
              )}

              {features.length === 0 ? (
                <div className="p-20 text-center text-slate-400">No features to display. Add some in the Backlog.</div>
              ) : (
                features.map((feature) => {
                  const startPos = calculateDatePosition(feature.startDate, months, rangeBounds);
                  const endPos = calculateDatePosition(feature.endDate, months, rangeBounds);
                  const width = Math.max(endPos - startPos, 2);
                  
                  if (new Date(feature.endDate).getTime() < (rangeBounds?.start.getTime() || -Infinity) || 
                      new Date(feature.startDate).getTime() > (rangeBounds?.end.getTime() || Infinity)) return null;

                  return (
                    <div key={feature.id} className={`flex border-b border-slate-100 transition-colors group ${selectedFeatureId === feature.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
                      <div className="w-72 p-4 border-r border-slate-100 shrink-0 flex items-center cursor-pointer" onClick={() => setSelectedFeatureId(feature.id)}>
                        <span className="text-sm font-semibold text-slate-700 truncate">{feature.name}</span>
                      </div>
                      <div className="flex-1 relative h-20 flex items-center px-4 overflow-hidden">
                        <div className="absolute inset-0 flex h-full">
                          {months.map((_, i) => (<div key={i} className="flex-1 border-r border-slate-100/50 h-full"></div>))}
                        </div>
                        <div 
                          onClick={() => setSelectedFeatureId(feature.id)}
                          className={`h-8 rounded-full relative z-10 flex items-center px-4 shadow-sm border-2 cursor-pointer ${PRIORITY_COLORS[feature.priority]} transition-all group-hover:scale-[1.02] ${selectedFeatureId === feature.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                          style={{ left: `${startPos}%`, width: `${width}%`, minWidth: 'fit-content' }}
                        >
                          <span className="text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                            {feature.priority} • {feature.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sprint Management Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Sprint Cadence Management</h4>
              <p className="text-xs text-slate-400 mt-1">Configure your delivery schedule and team velocity limits.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowClosedSprints(!showClosedSprints)}
                className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${
                  showClosedSprints 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showClosedSprints ? 'Hide Closed' : 'Show All'}
              </button>
              <button 
                onClick={handleAddNewSprint}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                New Sprint
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleSprints.length === 0 ? (
              <div className="col-span-2 py-10 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                No active sprints visible. {sprints.length > 0 && !showClosedSprints ? 'Check "Show All" to see closed sprints.' : ''}
              </div>
            ) : (
              visibleSprints.map((sprint) => {
                const usedPoints = features.reduce((acc, f) => {
                  const alloc = f.sprintAllocations.find(sa => sa.sprintId === sprint.id);
                  return acc + (alloc?.points || 0);
                }, 0);
                const utilization = sprint.capacity > 0 ? (usedPoints / sprint.capacity) * 100 : 0;
                return (
                  <div key={sprint.id} className={`p-4 rounded-xl border transition-all relative group ${
                    sprint.isClosed 
                      ? 'bg-slate-50 border-slate-200 opacity-80' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${sprint.isClosed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                          {sprint.name}
                        </span>
                        {sprint.isClosed && (
                          <span className="text-[8px] bg-slate-200 text-slate-600 font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Closed</span>
                        )}
                        {!sprint.isClosed && todayStr >= sprint.startDate && todayStr <= sprint.endDate && (
                          <span className="text-[8px] bg-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Current</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedSprintId(sprint.id)} title={sprint.isClosed ? 'View sprint details' : 'Edit sprint'} className="text-slate-300 hover:text-indigo-600 p-1.5 transition-colors">
                          {sprint.isClosed ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          )}
                        </button>
                        {!sprint.isClosed && (
                          <button onClick={() => onDeleteSprint(sprint.id)} title="Delete sprint" className="text-slate-300 hover:text-red-500 p-1.5 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Start</span><div className="text-[10px] font-bold text-slate-600">{sprint.startDate}</div></div>
                      <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">End</span><div className="text-[10px] font-bold text-slate-600">{sprint.endDate}</div></div>
                      <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Deployment</span><div className={`text-[10px] font-bold ${sprint.isClosed ? 'text-slate-400' : 'text-indigo-600'}`}>{sprint.targetDeploymentDate}</div></div>
                      <div className="flex flex-col items-end"><span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Velocity</span><div className={`text-xs font-black px-2 py-1 rounded-lg ${sprint.isClosed ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-700'}`}>{sprint.capacity} PTS</div></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                      <div className={`h-full transition-all duration-500 ${
                        sprint.isClosed ? 'bg-slate-400' : utilization > 100 ? 'bg-red-500' : 'bg-indigo-600'
                      }`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                    </div>
                    <button 
                      onClick={() => setViewingFeaturesSprintId(sprint.id)}
                      className="w-full py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                      View Features
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Viewing Features Modal */}
      {viewingFeaturesSprintId && viewingFeaturesSprint && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setViewingFeaturesSprintId(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewingFeaturesSprint.name} Features</h3>
                <p className="text-xs text-slate-500">{featuresInSprint.length} deliverables assigned</p>
              </div>
              <button onClick={() => setViewingFeaturesSprintId(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {featuresInSprint.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic text-sm">No features assigned to this sprint.</div>
              ) : (
                featuresInSprint.map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => {
                      setViewingFeaturesSprintId(null);
                      setSelectedFeatureId(f.id);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[f.priority].split(' ')[0]}`}></div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{f.name}</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => {
                  const id = viewingFeaturesSprintId;
                  setViewingFeaturesSprintId(null);
                  setSelectedSprintId(id);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
              >
                Go to Sprint Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedFeature && (
        <FeatureDrawer 
          feature={selectedFeature} 
          sprints={sprints} 
          onUpdate={onUpdate} 
          onOpenSprint={(id) => { setSelectedFeatureId(null); setSelectedSprintId(id); }}
          onClose={() => setSelectedFeatureId(null)} 
        />
      )}

      {selectedSprint && (
        <SprintDrawer 
          sprint={selectedSprint} 
          allSprints={sprints}
          allFeatures={features}
          onUpdateSprint={onUpdateSprint}
          onUpdateFeature={onUpdate}
          onOpenFeature={(id) => { setSelectedSprintId(null); setSelectedFeatureId(id); }}
          onClose={() => setSelectedSprintId(null)}
        />
      )}

      {/* Line space at end for better visibility */}
      <div className="h-24" />
    </div>
  );
};

export default TimelineView;
