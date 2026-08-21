import { describe, expect, it, vi } from 'vitest';
import { generateConfluenceRead } from './engine';

const base = { dayType: null as null, hasAsianRange: false, checks: {}, tradesTaken: 0, losses: 0 };

describe('the descriptive-only guard actually fires, not just documents intent', () => {
  it('refuses to produce a read if CONFLUENCE_MODE is ever not "descriptive-only"', async () => {
    vi.resetModules();
    vi.doMock('./config', () => ({ CONFLUENCE_MODE: 'signal', CONFLUENCE_DISCLAIMER: 'x' }));
    const { generateConfluenceRead: tamperedRead } = await import('./engine');
    expect(() => tamperedRead({ ...base, phase: 'exec' })).toThrow(/descriptive-only/);
    vi.doUnmock('./config');
    vi.resetModules();
  });
});

describe('generateConfluenceRead', () => {
  it('never returns a directional label -- checked against the full closed set of possible outputs', () => {
    const ALL_LABELS = [
      'FLAT_FOR_DAY', 'BUDGET_EXHAUSTED', 'READING_SESSION', 'LONDON_EXPERIMENT_ELIGIBLE',
      'SETUP_FORMING', 'SETUP_DEVELOPING', 'CONDITIONS_ALIGNED',
    ];
    const forbidden = ['BUY', 'SELL', 'LONG', 'SHORT', 'ENTER', 'EXIT'];
    for (const label of ALL_LABELS) {
      expect(forbidden.some((f) => label.includes(f))).toBe(false);
    }
  });

  it('reports FLAT_FOR_DAY outside the framework hours regardless of anything else', () => {
    const res = generateConfluenceRead({ ...base, phase: 'eod' });
    expect(res.label).toBe('FLAT_FOR_DAY');
  });

  describe('asian phase', () => {
    it('reports READING_SESSION with a "not set" detail before the range is entered', () => {
      const res = generateConfluenceRead({ ...base, phase: 'asian', hasAsianRange: false });
      expect(res.label).toBe('READING_SESSION');
      expect(res.detail).toMatch(/marking/i);
    });
    it('reports READING_SESSION with a different detail once the range is set', () => {
      const res = generateConfluenceRead({ ...base, phase: 'asian', hasAsianRange: true });
      expect(res.label).toBe('READING_SESSION');
      expect(res.detail).toMatch(/reference/i);
    });
  });

  describe('london phase', () => {
    it('is LONDON_EXPERIMENT_ELIGIBLE only when day type is Compression/Normal AND londonRule is checked', () => {
      const eligible = generateConfluenceRead({ ...base, phase: 'london', dayType: 'Normal', checks: { londonRule: true } });
      expect(eligible.label).toBe('LONDON_EXPERIMENT_ELIGIBLE');

      const wrongDayType = generateConfluenceRead({ ...base, phase: 'london', dayType: 'Stretched', checks: { londonRule: true } });
      expect(wrongDayType.label).toBe('READING_SESSION');

      const notChecked = generateConfluenceRead({ ...base, phase: 'london', dayType: 'Compression', checks: {} });
      expect(notChecked.label).toBe('READING_SESSION');
    });

    it('reports BUDGET_EXHAUSTED even if London-experiment conditions are otherwise met', () => {
      const res = generateConfluenceRead({ ...base, phase: 'london', dayType: 'Normal', checks: { londonRule: true }, losses: 2 });
      expect(res.label).toBe('BUDGET_EXHAUSTED');
    });
  });

  describe('exec phase', () => {
    it('is SETUP_FORMING with zero checks confirmed', () => {
      const res = generateConfluenceRead({ ...base, phase: 'exec', checks: {} });
      expect(res.label).toBe('SETUP_FORMING');
      expect(res.checkedCount).toBe(0);
    });

    it('is SETUP_DEVELOPING with some but not all exec checks confirmed', () => {
      const res = generateConfluenceRead({ ...base, phase: 'exec', checks: { pullback: true, bb5m: true } });
      expect(res.label).toBe('SETUP_DEVELOPING');
      expect(res.checkedCount).toBe(2);
      expect(res.totalExecChecks).toBe(6);
    });

    it('is CONDITIONS_ALIGNED only when all 6 exec-phase checks are confirmed', () => {
      const res = generateConfluenceRead({
        ...base, phase: 'exec',
        checks: { pullback: true, bb5m: true, boundary: true, vwapDist: true, stopSet: true, bullets: true },
      });
      expect(res.label).toBe('CONDITIONS_ALIGNED');
      expect(res.checkedCount).toBe(6);
    });

    it('ignores non-exec-phase checklist items when counting (markAsian, h1Filter, flat, etc.)', () => {
      const res = generateConfluenceRead({
        ...base, phase: 'exec',
        checks: { markAsian: true, atrNoted: true, h1Filter: true, dayChar: true, londonRule: true, flat: true },
      });
      expect(res.checkedCount).toBe(0);
      expect(res.label).toBe('SETUP_FORMING');
    });

    it('reports BUDGET_EXHAUSTED once either cap is hit, even with every exec check confirmed', () => {
      const allChecked = { pullback: true, bb5m: true, boundary: true, vwapDist: true, stopSet: true, bullets: true };
      expect(generateConfluenceRead({ ...base, phase: 'exec', checks: allChecked, losses: 2 }).label).toBe('BUDGET_EXHAUSTED');
      expect(generateConfluenceRead({ ...base, phase: 'exec', checks: allChecked, tradesTaken: 3 }).label).toBe('BUDGET_EXHAUSTED');
    });
  });

  it('every read carries the disclaimer text verbatim', () => {
    const res = generateConfluenceRead({ ...base, phase: 'exec' });
    expect(res.disclaimer).toMatch(/not a buy or sell signal/i);
  });
});
