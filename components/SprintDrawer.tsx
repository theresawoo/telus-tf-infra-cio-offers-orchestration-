
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sprint, Feature, Priority, Status } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../constants';
import { doSprintsOverlap, getFeatureAllocatedPoints } from '../utils';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface SprintDrawerProps {
  sprint: Sprint;
  allSprints: Sprint[];
  allFeatures: Feature[];
  onUpdateSprint: (s: Sprint) => void;
  onUpdateFeature: (f: Feature) => void;
  onOpenFeature?: (featureId: string) => void;
  onClose: () => void;
}

const SprintDrawer: React.FC<SprintDrawerProps> = ({ 
  sprint, 
  allSprints, 
  allFeatures, 
  onUpdateSprint, 
  onUpdateFeature,
  onOpenFeature,
  onClose 
}) => {
  const [draftSprint, setDraftSprint] = useState<Sprint>(sprint);
  // Staged features state to buffer allocation changes locally
  const [localFeatures, setLocalFeatures] = useState<Feature[]>(allFeatures);
  const [error, setError] = useState<string | null>(null);

  // Local string states for free-form editing
  const [startStr, setStartStr] = useState(sprint.startDate);
  const [endStr, setEndStr] = useState(sprint.endDate);
  const [deployStr, setDeployStr] = useState(sprint.targetDeploymentDate);

  const hiddenStartRef = useRef<HTMLInputElement>(null);
  const hiddenEndRef = useRef<HTMLInputElement>(null);
  const hiddenDeployRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftSprint(sprint);
    setLocalFeatures(allFeatures);
    setStartStr(sprint.startDate);
    setEndStr(sprint.endDate);
    setDeployStr(sprint.targetDeploymentDate);
    setError(null);
  }, [sprint, allFeatures]);

  const sprintDirty = useMemo(() => {
    return JSON.stringify(draftSprint) !== JSON.stringify(sprint);
  }, [draftSprint, sprint]);

  const featuresDirty = useMemo(() => {
    return JSON.stringify(localFeatures) !== JSON.stringify(allFeatures);
  }, [localFeatures, allFeatures]);

  const isDirty = sprintDirty || featuresDirty;

  const isClosed = draftSprint.isClosed;

  // Use localFeatures for calculations to show "potential" utilization immediately
  const sprintFeatures = useMemo(() => {
    return localFeatures.filter(f => f.sprintAllocations.some(sa => sa.sprintId === sprint.id));
  }, [localFeatures, sprint.id]);

  const availableFeatures = useMemo(() => {
    return localFeatures.filter(f => !f.sprintAllocations.some(sa => sa.sprintId === sprint.id));
  }, [localFeatures, sprint.id]);

  const handleUpdateSprintDraft = (updates: Partial<Sprint>) => {
    setDraftSprint(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  const handleDateStringUpdate = (type: 'startDate' | 'endDate' | 'targetDeploymentDate', val: string) => {
    if (type === 'startDate') {
      setStartStr(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const start = new Date(val);
        if (!isNaN(start.getTime())) {
          const end = new Date(start);
          end.setDate(end.getDate() + 14);
          const endVal = end.toISOString().split('T')[0];
          setEndStr(endVal);
          handleUpdateSprintDraft({ startDate: val, endDate: endVal });
        } else {
          handleUpdateSprintDraft({ startDate: val });
        }
      }
    } else if (type === 'endDate') {
      setEndStr(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) handleUpdateSprintDraft({ endDate: val });
    } else {
      setDeployStr(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) handleUpdateSprintDraft({ targetDeploymentDate: val });
    }
  };

  const handleSyncFromModel = () => {
    setStartStr(draftSprint.startDate);
    setEndStr(draftSprint.endDate);
    setDeployStr(draftSprint.targetDeploymentDate);
  };

  const handleSave = () => {
    const otherSprints = allSprints.filter(s => s.id !== draftSprint.id);
    const hasOverlap = otherSprints.some(other => doSprintsOverlap(draftSprint, other));

    if (hasOverlap) {
      setError("Sprint dates overlap with another existing sprint.");
      return;
    }

    if (new Date(draftSprint.startDate) > new Date(draftSprint.endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    // 1. Persist Sprint Details
    onUpdateSprint(draftSprint);

    // 2. Persist Feature Allocation Changes
    localFeatures.forEach(localFeature => {
      const originalFeature = allFeatures.find(f => f.id === localFeature.id);
      if (originalFeature && JSON.stringify(localFeature) !== JSON.stringify(originalFeature)) {
        onUpdateFeature(localFeature);
      }
    });

    onClose();
  };

  const handleToggleClosed = () => {
    const nextState = !draftSprint.isClosed;
    const updated = { ...draftSprint, isClosed: nextState };
    setDraftSprint(updated);
  };

  const toggleFeatureInSprintLocally = (featureId: string, action: 'add' | 'remove') => {
    if (isClosed) return; // Prevent logic trigger if locked
    setLocalFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      
      if (action === 'add') {
        const alreadyAllocated = getFeatureAllocatedPoints(f);
        const remaining = Math.max(0, f.points - alreadyAllocated);
        return {
          ...f,
          sprintAllocations: [...f.sprintAllocations, { sprintId: sprint.id, points: remaining }]
        };
      } else {
        return {
          ...f,
          sprintAllocations: f.sprintAllocations.filter(sa => sa.sprintId !== sprint.id)
        };
      }
    }));
  };

  const updateAllocationLocally = (featureId: string, newPoints: number) => {
    if (isClosed) return;
    const feature = localFeatures.find(f => f.id === featureId);
    if (!feature) return;

    const otherAllocationsSum = feature.sprintAllocations
      .filter(sa => sa.sprintId !== sprint.id)
      .reduce((acc, sa) => acc + sa.points, 0);
    
    if (otherAllocationsSum + newPoints > feature.points) {
      setError(`Cannot allocate ${newPoints} pts. Total for '${feature.name}' would exceed its limit of ${feature.points} pts.`);
      return;
    }

    setError(null);
    setLocalFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      return {
        ...f,
        sprintAllocations: f.sprintAllocations.map(sa => 
          sa.sprintId === sprint.id ? { ...sa, points: newPoints } : sa
        )
      };
    }));
  };

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

  const CalendarIcon = () => (
    <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const usedPoints = sprintFeatures.reduce((acc, f) => {
    const alloc = f.sprintAllocations.find(sa => sa.sprintId === sprint.id);
    return acc + (alloc?.points || 0);
  }, 0);
  
  const utilization = draftSprint.capacity > 0 ? (usedPoints / draftSprint.capacity) * 100 : 0;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${isClosed ? 'bg-slate-500' : 'bg-indigo-600'}`}>
              {isClosed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              ) : 'SP'}
            </div>
            <h3 className="text-xl font-bold text-slate-900">Sprint Configuration</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {isClosed && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 items-center">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <div className="text-sm">
                <span className="font-bold">This sprint is closed.</span> Feature assignments and points are locked. Reopen to edit contents.
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col">
              <Label>Sprint Name</Label>
              <input 
                className={`text-2xl font-black bg-transparent border-none focus:ring-0 p-0 rounded transition-all text-slate-900 hover:bg-slate-50 outline-none`}
                value={draftSprint.name}
                onChange={(e) => handleUpdateSprintDraft({ name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label>Start Date</Label>
                <div className="relative group cursor-pointer">
                  <Input 
                    placeholder="YYYY-MM-DD"
                    className="pr-10" 
                    value={startStr} 
                    onChange={(e) => handleDateStringUpdate('startDate', e.target.value)} 
                    onClick={() => triggerPicker(hiddenStartRef)}
                    onBlur={handleSyncFromModel}
                  />
                  <CalendarIcon />
                  <input 
                    ref={hiddenStartRef}
                    type="date"
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    value={draftSprint.startDate}
                    onChange={(e) => handleDateStringUpdate('startDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <Label>End Date</Label>
                <div className="relative group cursor-pointer">
                  <Input 
                    placeholder="YYYY-MM-DD"
                    className="pr-10" 
                    value={endStr} 
                    onChange={(e) => handleDateStringUpdate('endDate', e.target.value)} 
                    onClick={() => triggerPicker(hiddenEndRef)}
                    onBlur={handleSyncFromModel}
                  />
                  <CalendarIcon />
                  <input 
                    ref={hiddenEndRef}
                    type="date"
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    value={draftSprint.endDate}
                    onChange={(e) => handleDateStringUpdate('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label>Deployment Date</Label>
                <div className="relative group cursor-pointer">
                  <Input 
                    placeholder="YYYY-MM-DD"
                    className="bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 pr-10" 
                    value={deployStr} 
                    onChange={(e) => handleDateStringUpdate('targetDeploymentDate', e.target.value)} 
                    onClick={() => triggerPicker(hiddenDeployRef)}
                    onBlur={handleSyncFromModel}
                  />
                  <CalendarIcon />
                  <input 
                    ref={hiddenDeployRef}
                    type="date"
                    className="absolute inset-0 opacity-0 pointer-events-none"
                    value={draftSprint.targetDeploymentDate}
                    onChange={(e) => handleDateStringUpdate('targetDeploymentDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <Label>Sprint Capacity</Label>
                <Input type="number" value={draftSprint.capacity} onChange={(e) => handleUpdateSprintDraft({ capacity: Number(e.target.value) })} />
              </div>
            </div>

            {error && <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          </div>

          <div className={`rounded-2xl p-6 border transition-all bg-slate-50 border-slate-100`}>
             <div className="flex justify-between items-center mb-4">
                <Label>Sprint Utilization</Label>
                <span className={`text-xs font-black ${utilization > 100 ? 'text-red-500' : 'text-indigo-600'}`}>
                  {usedPoints} / {draftSprint.capacity} PTS ({Math.round(utilization)}%)
                </span>
             </div>
             <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${
                  utilization > 100 ? 'bg-red-500' : 'bg-indigo-600'
                }`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
             </div>
          </div>

          <div className="space-y-4">
            <Label>Assigned Deliverables</Label>
            <div className="space-y-3">
              {sprintFeatures.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No features assigned.</p>
              ) : (
                sprintFeatures.map(f => {
                  const currentAlloc = f.sprintAllocations.find(sa => sa.sprintId === sprint.id)?.points || 0;
                  const totalUsedElsewhere = f.sprintAllocations
                    .filter(sa => sa.sprintId !== sprint.id)
                    .reduce((acc, sa) => acc + sa.points, 0);
                  const availableForThisSprint = f.points - totalUsedElsewhere;

                  return (
                    <div key={f.id} className={`p-4 border rounded-xl transition-all ${isClosed ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group/item"
                          onClick={() => onOpenFeature?.(f.id)}
                        >
                          <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[f.priority].split(' ')[0]}`}></div>
                          <div>
                            <div className={`text-xs font-bold text-slate-800 group-hover/item:text-indigo-600 transition-colors`}>{f.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{f.points} Total Points</div>
                          </div>
                        </div>
                        {!isClosed && (
                          <button onClick={() => toggleFeatureInSprintLocally(f.id, 'remove')} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label>Allocated Points</Label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              disabled={isClosed}
                              min="0" 
                              max={availableForThisSprint} 
                              value={currentAlloc}
                              onChange={(e) => updateAllocationLocally(f.id, Number(e.target.value))}
                              className={`flex-1 h-1.5 rounded-lg appearance-none transition-all ${isClosed ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-100 cursor-pointer accent-indigo-600'}`}
                            />
                            <Input 
                              type="number"
                              disabled={isClosed}
                              min="0" 
                              max={availableForThisSprint} 
                              value={currentAlloc}
                              onChange={(e) => updateAllocationLocally(f.id, Number(e.target.value))}
                              className="w-16 px-2 py-1 text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2">
              <Select 
                disabled={isClosed}
                value=""
                onChange={(e) => {
                  if (e.target.value) toggleFeatureInSprintLocally(e.target.value, 'add');
                }}
              >
                <option value="">{isClosed ? 'Sprint is closed - assignment locked' : '+ Assign feature to sprint...'}</option>
                {!isClosed && availableFeatures.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.points} pts total)</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-3 shrink-0">
          <button 
            onClick={handleToggleClosed}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border-2 ${
              isClosed 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isClosed ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                Reopen Sprint
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Close Sprint
              </>
            )}
          </button>
          
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 text-slate-600 font-bold hover:text-slate-200 rounded-xl">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={!isDirty} 
              className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                isDirty ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
      <div className="h-24" />
    </>
  );
};

export default SprintDrawer;
