
import { TestRunner, expect } from './framework';
import * as utils from '../utils';
import { Feature, Priority, Status, System, Sprint, LogEntry, RunRateData } from '../types';

export const runSuite = async () => {
  const runner = new TestRunner();

  const mockFeatures: Feature[] = [
    {
      id: 'f1', name: 'Task 1', description: 'Desc 1', priority: Priority.LOW, status: Status.BACKLOG,
      startDate: '2026-01-01', endDate: '2026-01-31', estimatedCost: 1000, points: 10, owner: 'John Doe',
      programs: ['Prog A'], system: System.TOM, jiraNumber: 'J-1', sprintAllocations: []
    },
    {
      id: 'f2', name: 'Task 2', description: 'Desc 2', priority: Priority.CRITICAL, status: Status.COMPLETED,
      startDate: '2026-02-01', endDate: '2026-02-28', estimatedCost: 5000, points: 5, owner: 'Jane Smith',
      programs: ['Prog B'], system: System.EOM, jiraNumber: 'J-2', sprintAllocations: []
    }
  ];

  // --- Priority and Sorting Tests ---
  runner.add('Priority Score: Should return correct rank for each priority level', () => {
    expect(utils.getPriorityScore(Priority.CRITICAL)).toBe(0);
    expect(utils.getPriorityScore(Priority.HIGH)).toBe(1);
    expect(utils.getPriorityScore(Priority.MEDIUM)).toBe(2);
    expect(utils.getPriorityScore(Priority.LOW)).toBe(3);
  });

  runner.add('Priority Sorting: Should sort Critical features to the top', () => {
    const sorted = utils.sortFeaturesByPriority(mockFeatures);
    expect(sorted[0].priority).toBe(Priority.CRITICAL);
    expect(sorted[1].priority).toBe(Priority.LOW);
  });

  // --- List Manipulation Tests ---
  runner.add('Reorder List: Should correctly move items within an array', () => {
    const list = [1, 2, 3];
    const reordered = utils.reorderList(list, 0, 2);
    expect(reordered).toEqual([2, 3, 1]);
  });

  // --- Filtering Logic Tests ---
  runner.add('Feature Filtering: Should filter by status, owner, and system', () => {
    const statusFiltered = utils.filterFeatures(mockFeatures, Status.COMPLETED, '', 'All');
    expect(statusFiltered.length).toBe(1);
    expect(statusFiltered[0].id).toBe('f2');

    const ownerFiltered = utils.filterFeatures(mockFeatures, 'All', 'Jane', 'All');
    expect(ownerFiltered.length).toBe(1);
    expect(ownerFiltered[0].owner).toBe('Jane Smith');

    const systemFiltered = utils.filterFeatures(mockFeatures, 'All', '', System.TOM);
    expect(systemFiltered.length).toBe(1);
    expect(systemFiltered[0].system).toBe(System.TOM);
  });

  // --- Date and Timeline Tests ---
  runner.add('Working Days: Should calculate business days correctly for Canada (e.g. Sept 2026)', () => {
    // Sept 2026: Starts Tues (1), Ends Wed (30). Total 30 days.
    // 8 weekend days (5,6, 12,13, 19,20, 26,27)
    // 2 holidays defined in utils.ts: 7 (Labor Day), 30 (Truth & Reconciliation)
    // 30 - 8 - 2 = 20
    const workingDays = utils.getCanadianWorkingDays(2026, 8); // Sept is index 8
    expect(workingDays).toBe(20);
  });

  runner.add('Timeline Months: Should generate sequence of months spanning the date range', () => {
    const features: Feature[] = [
      { ...mockFeatures[0], startDate: '2026-01-01', endDate: '2026-01-15' },
      { ...mockFeatures[1], startDate: '2026-03-01', endDate: '2026-03-15' }
    ];
    const months = utils.getTimelineMonths(features);
    expect(months.length).toBe(3); // Jan, Feb, Mar
    expect(months[0].getMonth()).toBe(0); // Jan
    expect(months[2].getMonth()).toBe(2); // Mar
  });

  runner.add('Date Position: Should calculate percentage position within a timeline correctly', () => {
    const months = [new Date(2026, 0, 1), new Date(2026, 1, 1)]; // Jan, Feb
    // Timeline spans from Jan 1st to Feb 28th (59 days)
    const midJanPos = utils.calculateDatePosition('2026-01-15', months);
    expect(midJanPos).toBeGreaterThan(20);
    expect(midJanPos).toBeLessThan(30);
  });

  // --- Financial Calculation Tests ---
  runner.add('Financial Mapping: Should aggregate costs by end date month', () => {
    const financials = utils.getMonthlyFinancials(mockFeatures);
    expect(financials.length).toBe(2);
    expect(financials[0].payment).toBe(1000); // Jan
    expect(financials[1].payment).toBe(5000); // Feb
    expect(financials[1].cumulative).toBe(6000);
  });

  runner.add('Financial Comparison: Should calculate gap between burn and delivery value', () => {
    const runRates: RunRateData = {
      2026: {
        0: { [System.TOM]: 2000, [System.EOM]: 0, [System.C3]: 0 }, // Jan
        1: { [System.TOM]: 2000, [System.EOM]: 0, [System.C3]: 0 }  // Feb
      }
    };
    // Jan: 1000 delivery, 2000 run rate -> 1000 excess burn
    const comparison = utils.getFinancialComparison(mockFeatures, runRates, System.TOM);
    const janData = comparison.find(d => d.month === 'Jan 26');
    expect(janData?.runRate).toBe(2000);
    expect(janData?.budget).toBe(1000);
    expect(janData?.diff).toBe(1000); 
  });

  runner.add('Program Financials: Should group costs correctly by program name', () => {
    const programCosts = utils.getProgramFinancials(mockFeatures);
    expect(programCosts.length).toBe(2);
    expect(programCosts.find(p => p.name === 'Prog B')?.cost).toBe(5000);
  });

  // --- Feature and Sprint Logic Tests ---
  runner.add('Allocation Logic: Should sum points across sprint allocations correctly', () => {
    const feature: Feature = { 
      ...mockFeatures[0], 
      sprintAllocations: [
        { sprintId: 's1', points: 4 },
        { sprintId: 's2', points: 5 }
      ] 
    };
    expect(utils.getFeatureAllocatedPoints(feature)).toBe(9);
  });

  runner.add('Sprint Sync: Should update feature dates to align with associated sprints', () => {
    const sprints: Sprint[] = [
      { id: 's1', name: 'S1', startDate: '2026-03-01', endDate: '2026-03-14', targetDeploymentDate: '2026-03-15', capacity: 40, system: System.TOM },
      { id: 's2', name: 'S2', startDate: '2026-04-01', endDate: '2026-04-14', targetDeploymentDate: '2026-04-15', capacity: 40, system: System.TOM }
    ];
    const feature: Feature = { 
      ...mockFeatures[0], 
      sprintAllocations: [{ sprintId: 's1', points: 5 }, { sprintId: 's2', points: 5 }] 
    };
    const updated = utils.updateFeatureDatesFromSprints(feature, sprints);
    expect(updated.startDate).toBe('2026-03-01');
    expect(updated.endDate).toBe('2026-04-14');
  });

  runner.add('Validation: doSprintsOverlap should detect date collisions correctly', () => {
    const s1 = { startDate: '2026-03-01', endDate: '2026-03-14' };
    const s2 = { startDate: '2026-03-10', endDate: '2026-03-24' };
    const s3 = { startDate: '2026-03-15', endDate: '2026-03-30' };
    expect(utils.doSprintsOverlap(s1, s2)).toBe(true);
    expect(utils.doSprintsOverlap(s1, s3)).toBe(false);
  });

  // --- Audit Logging Tests ---
  runner.add('Logging: createLogDescription should identify specific field changes', () => {
    const oldFeat = mockFeatures[0];
    const newFeat = { ...oldFeat, name: 'Task 1 Updated', points: 15 };
    const desc = utils.createLogDescription(oldFeat, newFeat);
    expect(desc.includes('Changed name')).toBe(true);
    expect(desc.includes('Changed points')).toBe(true);
  });

  runner.add('Logging: filterLogs should return targeted subset based on query', () => {
    const logs: LogEntry[] = [
      { id: 'l1', timestamp: '2026-01-01', type: 'feature', entityId: '1', entityName: 'Feature Alpha', action: 'Update', details: 'Detail' },
      { id: 'l2', timestamp: '2026-01-02', type: 'sprint', entityId: 's1', entityName: 'Sprint One', action: 'Delete', details: 'Detail' },
    ];
    const results = utils.filterLogs(logs, 'Alpha', 'All');
    expect(results.length).toBe(1);
    expect(results[0].entityName).toBe('Feature Alpha');
  });

  return await runner.run();
};
