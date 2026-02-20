import { Feature, Priority, FinancialDataPoint, Status, Sprint, RunRateData, System, LogEntry } from './types';

export const getPriorityScore = (priority: Priority): number => {
  const scores: Record<Priority, number> = {
    [Priority.CRITICAL]: 0,
    [Priority.HIGH]: 1,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 3,
  };
  return scores[priority];
};

export const sortFeaturesByPriority = (features: Feature[]): Feature[] => {
  return [...features].sort((a, b) => getPriorityScore(a.priority) - getPriorityScore(b.priority));
};

export const reorderList = <T>(list: T[], fromIndex: number, toIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

export const filterFeatures = (
  features: Feature[],
  statusFilter: string,
  requestorFilter: string,
  systemFilter: string
): Feature[] => {
  return features.filter(f => {
    const statusMatch = statusFilter === 'All' || f.status === statusFilter;
    const requestorMatch = f.owner.toLowerCase().includes(requestorFilter.toLowerCase());
    const systemMatch = systemFilter === 'All' || f.system === systemFilter;
    return statusMatch && requestorMatch && systemMatch;
  });
};

export const getCanadianWorkingDays = (year: number, month: number): number => {
  const holidays2026: Record<number, number[]> = {
    0: [1],      
    1: [16],     
    3: [3],      
    4: [18],     
    6: [1],      
    7: [3],      
    8: [7, 30],  
    9: [12],     
    10: [11],    
    11: [25, 28] 
  };

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  let count = 0;
  const monthHolidays = holidays2026[month] || [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = monthHolidays.includes(d.getDate());
    
    if (!isWeekend && !isHoliday) {
      count++;
    }
  }
  return count;
};

export const getDateRangePresets = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const quarter = Math.floor(now.getMonth() / 3);
  const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
  const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  return {
    month: { start: startOfMonth, end: endOfMonth },
    quarter: { start: startOfQuarter, end: endOfQuarter },
    year: { start: startOfYear, end: endOfYear }
  };
};

export const getTimelineMonths = (features: Feature[], rangeOverride?: { start: Date, end: Date }): Date[] => {
  let minDate: Date;
  let maxDate: Date;

  if (rangeOverride) {
    minDate = rangeOverride.start;
    maxDate = rangeOverride.end;
  } else {
    const dates = features.flatMap(f => [new Date(f.startDate), new Date(f.endDate)]);
    if (dates.length === 0) return [];
    minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  }
  
  const result = [];
  const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const endLimit = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  while (current <= endLimit) {
    result.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return result;
};

export const calculateDatePosition = (dateStr: string, months: Date[], rangeOverride?: { start: Date, end: Date }): number => {
  if (months.length === 0) return 0;
  const date = new Date(dateStr);
  let minTime: number;
  let maxTime: number;

  if (rangeOverride) {
    minTime = rangeOverride.start.getTime();
    maxTime = rangeOverride.end.getTime();
  } else {
    minTime = months[0].getTime();
    const lastMonth = months[months.length - 1];
    maxTime = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getTime();
  }

  const total = maxTime - minTime;
  if (total <= 0) return 0;
  const pos = ((date.getTime() - minTime) / total) * 100;
  return Math.max(0, Math.min(100, pos));
};

export const getMonthlyFinancials = (features: Feature[]): FinancialDataPoint[] => {
  const monthsMap: Record<string, number> = {};
  features.forEach(f => {
    const date = new Date(f.endDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthsMap[monthKey] = (monthsMap[monthKey] || 0) + f.estimatedCost;
  });

  const sortedKeys = Object.keys(monthsMap).sort();
  let cumulative = 0;
  return sortedKeys.map(key => {
    const amount = monthsMap[key];
    cumulative += amount;
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return {
      month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      payment: amount,
      cumulative: cumulative,
      rawKey: key
    };
  });
};

export const getFinancialComparison = (features: Feature[], runRates: RunRateData, activeSystem: System | 'global') => {
  const comparisonMap: Record<string, { budget: number, runRate: number }> = {};
  
  // 1. Collect Deliverable Value (Budget)
  features.forEach(f => {
    const date = new Date(f.endDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!comparisonMap[key]) comparisonMap[key] = { budget: 0, runRate: 0 };
    comparisonMap[key].budget += f.estimatedCost;
  });

  // 2. Map Run Rate from Data
  const years = Object.keys(runRates).map(Number);
  years.forEach(year => {
    for (let month = 0; month < 12; month++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      if (!comparisonMap[key]) comparisonMap[key] = { budget: 0, runRate: 0 };
      
      const monthData = runRates[year]?.[month];
      if (monthData) {
        if (activeSystem === 'global') {
          comparisonMap[key].runRate = (monthData[System.EOM] || 0) + (monthData[System.TOM] || 0) + (monthData[System.C3] || 0);
        } else {
          comparisonMap[key].runRate = monthData[activeSystem] || 0;
        }
      }
    }
  });

  const sortedKeys = Object.keys(comparisonMap).sort();
  return sortedKeys.map(key => {
    const { budget, runRate } = comparisonMap[key];
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return {
      month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      budget,
      runRate,
      diff: runRate - budget,
      rawKey: key
    };
  });
};

export const getFeatureAllocatedPoints = (feature: Feature): number => {
  return feature.sprintAllocations.reduce((acc, sa) => acc + sa.points, 0);
};

export const calculateProgramReadiness = (features: Feature[]): number => {
  if (features.length === 0) return 0;
  const completed = features.filter(f => f.status === Status.COMPLETED).length;
  return Math.round((completed / features.length) * 100);
};

export const getProgramFinancials = (features: Feature[]) => {
  const map: Record<string, number> = {};
  features.forEach(f => {
    const programs = f.programs && f.programs.length > 0 ? f.programs : ['Unassigned'];
    const costPerProgram = f.estimatedCost / programs.length;
    programs.forEach(p => {
      map[p] = (map[p] || 0) + costPerProgram;
    });
  });
  return Object.entries(map)
    .map(([name, cost]) => ({ name, cost }))
    .sort((a, b) => b.cost - a.cost);
};

export const getFeatureStats = (features: Feature[]) => {
  return {
    totalPoints: features.reduce((acc, f) => acc + f.points, 0),
    avgPoints: features.length ? (features.reduce((acc, f) => acc + f.points, 0) / features.length).toFixed(1) : 0,
    criticalCount: features.filter(f => f.priority === Priority.CRITICAL).length,
    highCount: features.filter(f => f.priority === Priority.HIGH).length,
    inProgressCount: features.filter(f => f.status === Status.IN_PROGRESS).length,
  };
};

export const updateFeatureDatesFromSprints = (feature: Feature, allSprints: Sprint[]): Feature => {
  const allocations = feature.sprintAllocations || [];
  if (allocations.length === 0) return feature;

  const associatedSprints = allSprints.filter(s => allocations.some(sa => sa.sprintId === s.id));
  if (associatedSprints.length === 0) return feature;

  const startTimes = associatedSprints.map(s => new Date(s.startDate).getTime());
  const endTimes = associatedSprints.map(s => new Date(s.endDate).getTime());

  return {
    ...feature,
    startDate: new Date(Math.min(...startTimes)).toISOString().split('T')[0],
    endDate: new Date(Math.max(...endTimes)).toISOString().split('T')[0]
  };
};

export const doSprintsOverlap = (s1: { startDate: string, endDate: string }, s2: { startDate: string, endDate: string }) => {
  const start1 = new Date(s1.startDate).getTime();
  const end1 = new Date(s1.endDate).getTime();
  const start2 = new Date(s2.startDate).getTime();
  const end2 = new Date(s2.endDate).getTime();
  // Fix: Replaced 'iNaN' with the correct 'isNaN' function.
  if (isNaN(start1) || isNaN(end1) || isNaN(start2) || isNaN(end2)) return false;
  if (start1 > end1 || start2 > end2) return false;
  return start1 <= end2 && start2 <= end1;
};

export const createLogDescription = (oldEntity: any, newEntity: any): string => {
  const changes: string[] = [];
  const keys = Object.keys(newEntity);
  keys.forEach(key => {
    if (key === 'sprintAllocations' || key === 'id') return;
    if (JSON.stringify(oldEntity[key]) !== JSON.stringify(newEntity[key])) {
      changes.push(`Changed ${key} from "${oldEntity[key]}" to "${newEntity[key]}"`);
    }
  });
  
  // Special handling for sprint allocations if it's a feature
  if (newEntity.sprintAllocations) {
     if (JSON.stringify(oldEntity.sprintAllocations) !== JSON.stringify(newEntity.sprintAllocations)) {
        changes.push('Updated sprint allocations');
     }
  }

  return changes.length > 0 ? changes.join('; ') : 'No identifiable changes';
};

export const filterLogs = (logs: LogEntry[], query: string, type: string): LogEntry[] => {
  return logs
    .filter(log => {
      const typeMatch = type === 'All' || log.type === type.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const contentMatch = 
        log.entityName.toLowerCase().includes(lowerQuery) ||
        log.action.toLowerCase().includes(lowerQuery) ||
        log.details.toLowerCase().includes(lowerQuery);
      return typeMatch && contentMatch;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};