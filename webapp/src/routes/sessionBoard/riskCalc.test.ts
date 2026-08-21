import { describe, expect, it } from 'vitest';
import { calcPositionSize } from './riskCalc';

describe('calcPositionSize', () => {
  it('computes risk amount, stop distance, oz, and lots for a typical setup', () => {
    const res = calcPositionSize({ accountBalance: 10_000, riskPct: 1, entry: 4066.85, stop: 4059.40, ozPerLot: 100 });
    expect(res.riskAmount).toBeCloseTo(100, 6);
    expect(res.stopDistance).toBeCloseTo(7.45, 6);
    expect(res.positionSizeOz).toBeCloseTo(100 / 7.45, 6);
    expect(res.lots).toBeCloseTo((100 / 7.45) / 100, 6);
  });

  it('is symmetric in entry/stop order (a short stop above entry still gives a positive distance)', () => {
    const long = calcPositionSize({ accountBalance: 10_000, riskPct: 1, entry: 4066.85, stop: 4059.40, ozPerLot: 100 });
    const short = calcPositionSize({ accountBalance: 10_000, riskPct: 1, entry: 4059.40, stop: 4066.85, ozPerLot: 100 });
    expect(short.stopDistance).toBeCloseTo(long.stopDistance, 6);
    expect(short.positionSizeOz).toBeCloseTo(long.positionSizeOz!, 6);
  });

  it('returns null position size when entry equals stop (zero distance, not a division error)', () => {
    const res = calcPositionSize({ accountBalance: 10_000, riskPct: 1, entry: 4066.85, stop: 4066.85, ozPerLot: 100 });
    expect(res.stopDistance).toBe(0);
    expect(res.positionSizeOz).toBeNull();
    expect(res.lots).toBeNull();
  });

  it('returns null lots (but a real oz figure) when ozPerLot is 0', () => {
    const res = calcPositionSize({ accountBalance: 10_000, riskPct: 1, entry: 4066.85, stop: 4059.40, ozPerLot: 0 });
    expect(res.positionSizeOz).not.toBeNull();
    expect(res.lots).toBeNull();
  });
});
