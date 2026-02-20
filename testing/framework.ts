
import { TestResult } from '../types';

export const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) throw new Error(`Expected ${expected}, but got ${actual}`);
  },
  toEqual: (expected: any) => {
    const sActual = JSON.stringify(actual);
    const sExpected = JSON.stringify(expected);
    if (sActual !== sExpected) throw new Error(`Expected ${sExpected}, but got ${sActual}`);
  },
  toBeGreaterThan: (expected: number) => {
    if (typeof actual !== 'number') throw new Error(`Expected actual to be a number, but got ${typeof actual}`);
    if (actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`);
  },
  toBeLessThan: (expected: number) => {
    if (typeof actual !== 'number') throw new Error(`Expected actual to be a number, but got ${typeof actual}`);
    if (actual >= expected) throw new Error(`Expected ${actual} to be less than ${expected}`);
  }
});

export type TestCase = () => void | Promise<void>;

export class TestRunner {
  private tests: Map<string, TestCase> = new Map();

  add(name: string, fn: TestCase) {
    this.tests.set(name, fn);
  }

  async run(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (const [name, fn] of this.tests.entries()) {
      const start = performance.now();
      try {
        await fn();
        results.push({ name, status: 'passed', duration: performance.now() - start });
      } catch (e: any) {
        results.push({ name, status: 'failed', error: e.message, duration: performance.now() - start });
      }
    }
    return results;
  }
}
