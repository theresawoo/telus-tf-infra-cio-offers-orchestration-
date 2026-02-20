import React, { useState, useMemo } from 'react';
import { Feature, Priority, Status, System, Sprint } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../constants';
import { suggestFeatures } from '../geminiService';
import { filterFeatures, getFeatureStats } from '../utils';
import FeatureDrawer from './FeatureDrawer';
import SprintDrawer from './SprintDrawer';

interface FeatureViewProps {
  features: Feature[];
  sprints: Sprint[];
  onUpdate: (f: Feature) => void;
  onDelete: (id: string) => void;
  onAdd: (f: Feature) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdateSprint: (s: Sprint) => void;
  activeSystem: System | 'global';
}

const FeatureView: React.FC<FeatureViewProps> = ({ features, sprints, onUpdate, onDelete, onAdd, onReorder, onUpdateSprint, activeSystem }) => {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [productDesc, setProductDesc] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [requestorFilter, setRequestorFilter] = useState<string>('');
  const [systemFilter, setSystemFilter] = useState<string>('All');

  const filteredFeatures = useMemo(() => {
    return filterFeatures(features, statusFilter, requestorFilter, systemFilter);
  }, [features, statusFilter, requestorFilter, systemFilter]);

  const stats = useMemo(() => getFeatureStats(features), [features]);

  const selectedFeature = useMemo(() => 
    features.find(f => f.id === selectedFeatureId), 
    [features, selectedFeatureId]
  );

  const selectedSprint = useMemo(() => 
    sprints.find(s => s.id === selectedSprintId),
    [sprints, selectedSprintId]
  );

  const handleAIGenerate = async () => {
    if (!productDesc) return;
    setLoadingAI(true);
    try {
      const suggestions = await suggestFeatures(productDesc);
      suggestions.forEach((s) => {
        onAdd({
          id: Math.random().toString(36).substr(2, 9),
          name: s.name || 'New Feature',
          description: s.description || '',
          priority: (s.priority as Priority) || Priority.MEDIUM,
          status: Status.BACKLOG,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
          estimatedCost: s.estimatedCost || 5000,
          points: s.points || 5,
          owner: s.owner || 'Unassigned',
          programs: s.programs || ['New Program'],
          system: (s.system as System) || (activeSystem === 'global' ? System.TOM : activeSystem),
          jiraNumber: s.jiraNumber || 'TBD',
          sprintAllocations: []
        });
      });
      setIsAIModalOpen(false);
      setProductDesc('');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      const fromFeature = filteredFeatures[draggedIndex];
      const toFeature = filteredFeatures[index];
      const realFromIndex = features.findIndex(f => f.id === fromFeature.id);
      const realToIndex = features.findIndex(f => f.id === toFeature.id);
      onReorder(realFromIndex, realToIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const clearFilters = () => {
    setStatusFilter('All');
    setRequestorFilter('');
    setSystemFilter('All');
  };

  const isFiltered = statusFilter !== 'All' || requestorFilter !== '' || systemFilter !== 'All';

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Features</h2>
          <p className="text-slate-500 text-sm">Define, prioritize and estimate your product features. Drag cards to reorder. Click any card for full details.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            AI Suggest
          </button>
          <button 
            onClick={() => {
              const newFeature: Feature = {
                id: Math.random().toString(36).substr(2, 9),
                name: 'Untitled Feature',
                description: '',
                priority: Priority.MEDIUM,
                status: Status.BACKLOG,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0],
                estimatedCost: 1000,
                points: 1,
                owner: '',
                programs: [],
                system: activeSystem === 'global' ? System.TOM : activeSystem,
                jiraNumber: '',
                sprintAllocations: []
              };
              onAdd(newFeature);
              setSelectedFeatureId(newFeature.id);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Feature
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Effort</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{stats.totalPoints}</span>
            <span className="text-xs font-bold text-slate-400">PTS</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Avg {stats.avgPoints} points/feature</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Critical Risk</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-red-600">{stats.criticalCount}</span>
            <span className="text-xs font-bold text-slate-400">TASKS</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{stats.highCount} High Priority items</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Progress</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-indigo-600">{stats.inProgressCount}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Active delivery work</div>
        </div>
        <div className="bg-indigo-600 border border-indigo-500 p-5 rounded-2xl shadow-lg shadow-indigo-100">
          <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Total Value</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">${features.reduce((a,f)=>a+f.estimatedCost,0).toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-indigo-200 mt-1">Budgeted program cost</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Statuses</option>
            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">System</label>
          <select 
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Systems</option>
            {Object.values(System).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requestor</label>
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text"
              placeholder="Filter by name..."
              value={requestorFilter}
              onChange={(e) => setRequestorFilter(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {isFiltered && (
          <button 
            onClick={clearFilters}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {filteredFeatures.length === 0 ? (
          <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="text-slate-300 mb-2 font-medium">No features match your current filters.</div>
            <button onClick={clearFilters} className="text-sm text-indigo-600 font-bold">Show all features</button>
          </div>
        ) : (
          filteredFeatures.map((feature, index) => {
            const isFullyUnfiltered = statusFilter === 'All' && requestorFilter === '' && systemFilter === 'All';
            return (
              <div 
                key={feature.id} 
                draggable={isFullyUnfiltered}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => { setDraggedIndex(null); setDropTargetIndex(null); }}
                onClick={() => setSelectedFeatureId(feature.id)}
                className={`bg-white border transition-all group relative overflow-hidden rounded-xl p-5 shadow-sm 
                  ${draggedIndex === index ? 'opacity-40 scale-95 border-indigo-400' : 'opacity-100'} 
                  ${dropTargetIndex === index && draggedIndex !== index ? 'border-t-4 border-t-indigo-500 -translate-y-1' : 'border-slate-200'}
                  ${selectedFeatureId === feature.id ? 'border-indigo-300 ring-1 ring-indigo-50 shadow-lg' : 'hover:shadow-md'}
                  cursor-pointer`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${PRIORITY_COLORS[feature.priority].split(' ')[0]}`}></div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors ${!isFullyUnfiltered ? 'invisible' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 7a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zM13 7a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-bold text-slate-900 truncate block">
                            {feature.name || 'Untitled Feature'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[feature.priority]}`}>
                            {feature.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {feature.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 md:border-l border-slate-100 md:pl-8" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-3 gap-8">
                        <div className="flex flex-col w-24">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Status</span>
                          <div className={`mt-1 text-sm font-bold ${STATUS_COLORS[feature.status].replace('bg-', 'text-').replace('-100', '-700')}`}>
                            {feature.status}
                          </div>
                        </div>

                        <div className="flex flex-col w-24">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Cost</span>
                          <div className="mt-1 text-sm font-bold text-slate-900">
                            ${feature.estimatedCost.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex flex-col w-32">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Owner</span>
                          <div className="mt-1 text-sm font-bold text-slate-600 truncate">
                            {feature.owner || 'Unassigned'}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(feature.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Feature Details Side Drawer */}
      {selectedFeature && (
        <FeatureDrawer 
          feature={selectedFeature}
          allFeatures={features}
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

      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">AI Feature Generator</h3>
              <p className="text-slate-500 text-sm mt-1">Describe your product vision and Gemini will propose high-level features.</p>
            </div>
            <div className="p-6">
              <textarea 
                className="w-full h-40 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="e.g. A multi-vendor marketplace for locally sourced organic produce with real-time delivery tracking..."
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
              />
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAIModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
              >
                Cancel
              </button>
              <button 
                onClick={handleAIGenerate}
                disabled={loadingAI || !productDesc}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loadingAI ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Thinking...
                  </>
                ) : 'Generate Suggestions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Line space at end for better visibility */}
      <div className="h-24" />
    </div>
  );
};

export default FeatureView;
