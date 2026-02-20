
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Feature, Priority, Status, System, Sprint } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../constants';
import { updateFeatureDatesFromSprints, getFeatureAllocatedPoints } from '../utils';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface FeatureDrawerProps {
  feature: Feature;
  allFeatures: Feature[];
  sprints: Sprint[];
  onUpdate: (f: Feature) => void;
  onOpenSprint?: (sprintId: string) => void;
  onClose: () => void;
}

const FeatureDrawer: React.FC<FeatureDrawerProps> = ({ feature, allFeatures, sprints, onUpdate, onOpenSprint, onClose }) => {
  const [draft, setDraft] = useState<Feature>(feature);
  
  // Unique existing programs from all features
  const existingPrograms = useMemo(() => {
    const progs = new Set<string>();
    allFeatures.forEach(f => {
      f.programs?.forEach(p => progs.add(p));
    });
    return Array.from(progs).sort();
  }, [allFeatures]);
  
  // Local string states to allow free-form typing without immediate object validation
  const [startStr, setStartStr] = useState(feature.startDate);
  const [endStr, setEndStr] = useState(feature.endDate);

  const hiddenStartRef = useRef<HTMLInputElement>(null);
  const hiddenEndRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(feature);
    setStartStr(feature.startDate);
    setEndStr(feature.endDate);
  }, [feature]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(feature);
  }, [draft, feature]);

  const handleUpdate = (updates: Partial<Feature>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };

  const handleDateStringUpdate = (type: 'startDate' | 'endDate', val: string) => {
    if (type === 'startDate') setStartStr(val);
    else setEndStr(val);

    // Only update the actual draft object if it's a valid yyyy-mm-dd string
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      handleUpdate({ [type]: val });
    }
  };

  const handleSyncFromModel = () => {
    setStartStr(draft.startDate);
    setEndStr(draft.endDate);
  };

  const handleSprintAssociation = (sprintId: string, action: 'add' | 'remove', points?: number) => {
    let nextAllocations = [...(draft.sprintAllocations || [])];
    if (action === 'add') {
      if (!nextAllocations.some(sa => sa.sprintId === sprintId)) {
        const alreadyAllocated = getFeatureAllocatedPoints(draft);
        const remaining = Math.max(0, draft.points - alreadyAllocated);
        nextAllocations.push({ sprintId, points: points ?? remaining });
      }
    } else {
      nextAllocations = nextAllocations.filter(sa => sa.sprintId !== sprintId);
    }
    
    const updatedWithSprints = updateFeatureDatesFromSprints({ ...draft, sprintAllocations: nextAllocations }, sprints);
    setDraft(updatedWithSprints);
    setStartStr(updatedWithSprints.startDate);
    setEndStr(updatedWithSprints.endDate);
  };

  const updateAllocation = (sprintId: string, val: number) => {
    const otherSum = draft.sprintAllocations
      .filter(sa => sa.sprintId !== sprintId)
      .reduce((acc, sa) => acc + sa.points, 0);
    
    const safeVal = Math.min(val, draft.points - otherSum);
    const nextAllocations = draft.sprintAllocations.map(sa => 
      sa.sprintId === sprintId ? { ...sa, points: safeVal } : sa
    );
    setDraft({ ...draft, sprintAllocations: nextAllocations });
  };

  const handleSave = () => {
    onUpdate(draft);
    onClose();
  };

  const handleRequestClose = () => {
    if (isDirty) {
      if (window.confirm("Save changes before closing?")) {
        handleSave();
        return;
      }
    }
    onClose();
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
    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-md pointer-events-none group-hover:bg-indigo-100 group-hover:border-indigo-200 transition-all shadow-sm">
      <svg className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in" onClick={handleRequestClose}></div>
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[draft.priority].split(' ')[0]}`}></div>
            <h3 className="text-xl font-bold text-slate-900">Feature Details</h3>
          </div>
          <button onClick={handleRequestClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col">
              <Label>Feature Name</Label>
              <input className="text-2xl font-black text-slate-900 bg-transparent border-none focus:ring-0 p-0 rounded outline-none" value={draft.name} onChange={(e) => handleUpdate({ name: e.target.value })} />
            </div>
            <div className="flex flex-col">
              <Label>Description</Label>
              <textarea className="text-slate-600 bg-slate-50 border border-transparent rounded-xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={draft.description} onChange={(e) => handleUpdate({ description: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={draft.status} onChange={(e) => handleUpdate({ status: e.target.value as Status })} className={`${STATUS_COLORS[draft.status]} border-transparent`}>
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={draft.priority} onChange={(e) => handleUpdate({ priority: e.target.value as Priority })} className={`${PRIORITY_COLORS[draft.priority]} border-transparent`}>
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <Label>Owner</Label>
              <Input 
                value={draft.owner} 
                onChange={(e) => handleUpdate({ owner: e.target.value })} 
                placeholder="Assign an owner..."
              />
            </div>
            <div className="flex flex-col">
              <Label>Jira Number</Label>
              <Input 
                value={draft.jiraNumber} 
                onChange={(e) => handleUpdate({ jiraNumber: e.target.value })} 
                placeholder="e.g. PROJ-123"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Planned Timeline</Label>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <Label>Start Date</Label>
                <div className="relative group cursor-pointer">
                  <Input 
                    placeholder="YYYY-MM-DD"
                    className="pr-12" 
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
                    value={draft.startDate}
                    onChange={(e) => handleDateStringUpdate('startDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <Label>End Date</Label>
                <div className="relative group cursor-pointer">
                  <Input 
                    placeholder="YYYY-MM-DD"
                    className="pr-12" 
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
                    value={draft.endDate}
                    onChange={(e) => handleDateStringUpdate('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
            <Label>Sprint Distribution</Label>
            <div className="space-y-3">
              {draft.sprintAllocations.map(sa => {
                const sprint = sprints.find(s => s.id === sa.sprintId);
                if (!sprint) return null;
                const isSprintClosed = sprint.isClosed;

                return (
                  <div key={sa.sprintId} className={`bg-white border rounded-xl p-3 shadow-sm flex flex-col gap-2 transition-all ${isSprintClosed ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`text-xs font-bold cursor-pointer hover:text-indigo-600 transition-colors ${isSprintClosed ? 'text-slate-400' : 'text-slate-800'}`}
                          onClick={() => onOpenSprint?.(sprint.id)}
                          title="View Sprint Details"
                        >
                          {sprint.name}
                        </div>
                        {isSprintClosed && (
                          <span className="text-[8px] bg-slate-200 text-slate-500 px-1 py-0.5 rounded font-black uppercase tracking-tighter">Closed</span>
                        )}
                      </div>
                      <button onClick={() => handleSprintAssociation(sa.sprintId, 'remove')} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-slate-400 font-bold">Allocation:</span>
                       <Input 
                         type="number" 
                         className="flex-1 px-2 py-1"
                         value={sa.points}
                         onChange={(e) => updateAllocation(sa.sprintId, Number(e.target.value))}
                       />
                       <span className={`text-[10px] font-bold text-slate-400`}>PTS</span>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <Select 
                  value="" 
                  onChange={(e) => { if (e.target.value) handleSprintAssociation(e.target.value, 'add'); e.target.value = ""; }}
                >
                  <option value="">Assign to sprint (active only)...</option>
                  {sprints
                    .filter(s => !s.isClosed && !draft.sprintAllocations.some(sa => sa.sprintId === s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <Label>Total Effort</Label>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <input type="number" className="w-full bg-transparent border-none focus:ring-0 font-bold text-slate-700 outline-none" value={draft.points} onChange={(e) => handleUpdate({ points: Number(e.target.value) })} />
                <span className="text-[10px] font-black text-slate-300">PTS</span>
              </div>
            </div>
            <div className="flex flex-col">
              <Label>Est. Cost</Label>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <span className="text-slate-400 font-bold">$</span>
                <input type="number" className="w-full bg-transparent border-none focus:ring-0 font-bold text-slate-700 outline-none" value={draft.estimatedCost} onChange={(e) => handleUpdate({ estimatedCost: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Programs Management */}
          <div className="space-y-4">
            <Label>Associated Programs</Label>
            <div className="flex flex-wrap gap-2">
              {draft.programs.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 text-sm font-bold group">
                  <input 
                    list="existing-programs"
                    className="bg-transparent border-none focus:ring-0 p-0 w-auto min-w-[80px] outline-none" 
                    value={p} 
                    onChange={(e) => {
                      const next = [...draft.programs];
                      next[idx] = e.target.value;
                      handleUpdate({ programs: next });
                    }}
                  />
                  <button 
                    onClick={() => {
                      const next = draft.programs.filter((_, i) => i !== idx);
                      handleUpdate({ programs: next });
                    }}
                    className="text-indigo-300 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button 
                onClick={() => handleUpdate({ programs: [...draft.programs, ''] })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all text-sm font-bold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Program
              </button>
            </div>
            <datalist id="existing-programs">
              {existingPrograms.map(prog => (
                <option key={prog} value={prog} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={handleRequestClose} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">Cancel</button>
          <button disabled={!isDirty} onClick={handleSave} className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${isDirty ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>Save Changes</button>
        </div>
      </div>
    </>
  );
};

export default FeatureDrawer;
