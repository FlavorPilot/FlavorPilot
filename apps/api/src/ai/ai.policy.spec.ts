import { describe,expect,it } from 'vitest';
import { aiCost,aiPeriods } from './ai.policy';
describe('AI accounting boundaries',()=>{
 it('reserves conservative micro USD using the pinned model prices',()=>{
  expect(aiCost(1000,200)).toBe(1650);
  expect(aiCost(1,0)).toBe(1);
  expect(aiCost(12000,4000)).toBe(27000);
 });
 it('renews calendar periods at UTC boundaries including the year rollover',()=>{
  const a=aiPeriods(new Date('2026-12-31T23:59:59Z'));
  expect(a.resetAt).toBe('2027-01-01T00:00:00.000Z');expect(a.dailyResetAt).toBe(a.resetAt);
  const b=aiPeriods(new Date('2027-01-01T02:00:00+02:00'));
  expect(b.month).toBe(a.resetAt);expect(b.day).toBe(a.resetAt);
 });
});
