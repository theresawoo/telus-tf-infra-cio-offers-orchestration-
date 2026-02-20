
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum Status {
  BACKLOG = 'Backlog',
  READY = 'Ready',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold'
}

export enum System {
  TOM = 'TOM',
  EOM = 'EOM',
  C3 = 'C3'
}

export interface SprintAllocation {
  sprintId: string;
  points: number;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  status: Status;
  startDate: string; // ISO format
  endDate: string;   // ISO format
  estimatedCost: number;
  points: number;
  owner: string;
  programs: string[];
  system: System;
  jiraNumber: string;
  sprintAllocations: SprintAllocation[];
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  targetDeploymentDate: string;
  capacity: number;
  isClosed?: boolean;
}

export interface RunRateData {
  [year: number]: {
    [month: number]: { // 0-11
      [key in System]: number;
    }
  }
}

export interface PaymentMilestone {
  date: string;
  amount: number;
  description: string;
  featureId: string;
}

export interface FinancialDataPoint {
  month: string;
  payment: number;
  cumulative: number;
  rawKey: string;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  error?: string;
  duration: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'feature' | 'sprint';
  entityId: string;
  entityName: string;
  action: string;
  details: string;
}

export type AppTab = 'features' | 'timeline' | 'financials' | 'quality' | 'team' | 'logs';
