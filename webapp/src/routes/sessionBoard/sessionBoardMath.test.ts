import { describe, expect, it } from 'vitest';
import { classifyDayType, londonVsAsianTag, vwapZoneFor } from './sessionBoardMath';

describe('classifyDayType', () => {
  it('applies the confirmed thresholds: <50 Compression, 50-75 Normal, 75-120 Stretched, >120 Extended', () => {
    expect(classifyDayType(40, 100)).toBe('Compression');
    expect(classifyDayType(49.9, 100)).toBe('Compression');
    expect(classifyDayType(50, 100)).toBe('Normal');
    expect(classifyDayType(74.9, 100)).toBe('Normal');
    expect(classifyDayType(75, 100)).toBe('Stretched');
    expect(classifyDayType(119.9, 100)).toBe('Stretched');
    expect(classifyDayType(120, 100)).toBe('Extended');
    expect(classifyDayType(200, 100)).toBe('Extended');
  });
});

describe('londonVsAsianTag', () => {
  it('reports a sweep only when both sides break', () => {
    expect(londonVsAsianTag(4090, 4050, 4080, 4060)).toBe('Swept both sides of the Asian range');
  });
  it('reports a single-side break', () => {
    expect(londonVsAsianTag(4090, 4065, 4080, 4060)).toBe('Broke the Asian high');
    expect(londonVsAsianTag(4075, 4050, 4080, 4060)).toBe('Broke the Asian low');
  });
  it('reports contained when neither side breaks', () => {
    expect(londonVsAsianTag(4075, 4065, 4080, 4060)).toBe('Contained inside the Asian range');
  });
});

describe('vwapZoneFor', () => {
  it('flags the 35-50% reversal-entry zone inclusively at both ends', () => {
    expect(vwapZoneFor(34.9)).toBe('below');
    expect(vwapZoneFor(35)).toBe('in');
    expect(vwapZoneFor(42)).toBe('in');
    expect(vwapZoneFor(50)).toBe('in');
    expect(vwapZoneFor(50.1)).toBe('beyond');
  });
});
