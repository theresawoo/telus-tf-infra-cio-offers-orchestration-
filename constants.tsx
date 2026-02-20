
import { Feature, Priority, Status, System, Sprint, RunRateData } from './types';

export const INITIAL_FEATURES: Feature[] = [
  {
    id: 'f1',
    name: 'Authentication System',
    description: 'Implement OAuth2 and multi-factor authentication.',
    priority: Priority.CRITICAL,
    status: Status.IN_PROGRESS,
    startDate: '2026-03-01',
    endDate: '2026-04-15',
    estimatedCost: 15000,
    points: 8,
    owner: 'Alex Chen',
    programs: ['Security Foundation'],
    system: System.TOM,
    jiraNumber: 'SEC-101',
    sprintAllocations: [
      { sprintId: 's1', points: 4 },
      { sprintId: 's2', points: 4 }
    ]
  },
  {
    id: 'f2',
    name: 'Dashboard UI Revamp',
    description: 'Modernize the main user interface with responsive layouts.',
    priority: Priority.HIGH,
    status: Status.BACKLOG,
    startDate: '2026-04-16',
    endDate: '2026-05-30',
    estimatedCost: 8000,
    points: 5,
    owner: 'Sarah Miller',
    programs: ['User Experience'],
    system: System.EOM,
    jiraNumber: 'UX-442',
    sprintAllocations: []
  },
  {
    id: 'f3',
    name: 'Payment Gateway Integration',
    description: 'Support for Stripe, PayPal and Apple Pay.',
    priority: Priority.HIGH,
    status: Status.COMPLETED,
    startDate: '2026-01-05',
    endDate: '2026-02-15',
    estimatedCost: 12000,
    points: 13,
    owner: 'James Wilson',
    programs: ['Commerce Platform'],
    system: System.C3,
    jiraNumber: 'BILL-89',
    sprintAllocations: []
  },
  {
    id: 'f4',
    name: 'AI Content Assistant',
    description: 'Leverage LLMs for automated content generation.',
    priority: Priority.MEDIUM,
    status: Status.ON_HOLD,
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    estimatedCost: 25000,
    points: 21,
    owner: 'Elena Rodriguez',
    programs: ['Intelligence Hub'],
    system: System.TOM,
    jiraNumber: 'AI-22',
    sprintAllocations: []
  }
];

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 's1',
    name: 'Sprint 1: Foundation',
    startDate: '2026-03-01',
    endDate: '2026-03-14',
    targetDeploymentDate: '2026-03-15',
    capacity: 40,
    system: System.TOM
  },
  {
    id: 's2',
    name: 'Sprint 2: Core Auth',
    startDate: '2026-03-15',
    endDate: '2026-03-28',
    targetDeploymentDate: '2026-03-29',
    capacity: 45,
    system: System.TOM
  }
];

export const INITIAL_RUN_RATE: RunRateData = {
  2026: {
    0: { [System.EOM]: 25000, [System.TOM]: 30000, [System.C3]: 15000 },
    1: { [System.EOM]: 25000, [System.TOM]: 30000, [System.C3]: 15000 },
    2: { [System.EOM]: 28000, [System.TOM]: 32000, [System.C3]: 18000 },
    3: { [System.EOM]: 28000, [System.TOM]: 32000, [System.C3]: 18000 },
    4: { [System.EOM]: 30000, [System.TOM]: 35000, [System.C3]: 20000 },
    5: { [System.EOM]: 30000, [System.TOM]: 35000, [System.C3]: 20000 },
    6: { [System.EOM]: 30000, [System.TOM]: 35000, [System.C3]: 20000 },
    7: { [System.EOM]: 30000, [System.TOM]: 35000, [System.C3]: 20000 },
    8: { [System.EOM]: 32000, [System.TOM]: 38000, [System.C3]: 22000 },
    9: { [System.EOM]: 32000, [System.TOM]: 38000, [System.C3]: 22000 },
    10: { [System.EOM]: 35000, [System.TOM]: 40000, [System.C3]: 25000 },
    11: { [System.EOM]: 35000, [System.TOM]: 40000, [System.C3]: 25000 }
  }
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700 border-slate-200',
  [Priority.MEDIUM]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700 border-orange-200',
  [Priority.CRITICAL]: 'bg-red-100 text-red-700 border-red-200',
};

export const STATUS_COLORS: Record<Status, string> = {
  [Status.BACKLOG]: 'bg-gray-100 text-gray-700',
  [Status.READY]: 'bg-cyan-100 text-cyan-700',
  [Status.IN_PROGRESS]: 'bg-indigo-100 text-indigo-700',
  [Status.COMPLETED]: 'bg-green-100 text-green-700',
  [Status.ON_HOLD]: 'bg-yellow-100 text-yellow-700',
};
