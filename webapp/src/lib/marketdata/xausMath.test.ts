import { describe, expect, it } from 'vitest';
import { beirutHourDate, computeAsianFromIntraday, computeATR14, parsePointTime } from './xausMath';

describe('parsePointTime', () => {
  it('treats large numbers as milliseconds and small numbers as seconds', () => {
    expect(parsePointTime(1_700_000_000_000)).toBe(1_700_000_000_000);
    expect(parsePointTime(1_700_000_000)).toBe(1_700_000_000_000);
  });
  it('parses numeric strings the same way as numbers', () => {
    expect(parsePointTime('1700000000')).toBe(1_700_000_000_000);
  });
  it('falls back to Date.parse for ISO strings', () => {
    expect(parsePointTime('2026-01-05T12:00:00Z')).toBe(Date.parse('2026-01-05T12:00:00Z'));
  });
  it('returns null for unparseable input', () => {
    expect(parsePointTime('not a date')).toBeNull();
  });
});

// Beirut observes DST (EEST, UTC+3) only roughly March-October; the rest
// of the year it's EET (UTC+2) -- so a fixed "+3" offset is wrong for a
// January fixture. Rather than hardcode either offset, derive it from
// beirutHourDate itself: try +2, check what Beirut date/hour that lands
// on, and correct by the difference (at most one step, since Lebanon only
// ever uses whole-hour offsets).
function beirutWallTimeToMs(dateStr: string, hour: number, minute: number): number {
  let guess = Date.parse(`${dateStr}T00:00:00Z`) + (hour - 2) * 3600_000 + minute * 60_000;
  for (let i = 0; i < 4; i++) {
    const got = beirutHourDate(guess);
    if (got.date === dateStr && got.hour === hour) return guess;
    // still off -- nudge by the day/hour delta and retry
    const gotMs = Date.parse(`${got.date}T00:00:00Z`) + got.hour * 3600_000;
    const wantMs = Date.parse(`${dateStr}T00:00:00Z`) + hour * 3600_000;
    guess += wantMs - gotMs;
  }
  throw new Error(`could not resolve Beirut wall time ${dateStr} ${hour}:${minute}`);
}

describe('beirutHourDate', () => {
  it('reports the Beirut-local date and hour for a UTC instant (winter, UTC+2)', () => {
    // 2026-01-05 22:30 UTC = 2026-01-06 00:30 Beirut in January (EET, UTC+2).
    const ms = Date.parse('2026-01-05T22:30:00Z');
    expect(beirutHourDate(ms)).toEqual({ date: '2026-01-06', hour: 0 });
  });
});

describe('computeAsianFromIntraday', () => {
  const nowMs = beirutWallTimeToMs('2026-01-06', 15, 0);

  function beirutPoint(dateStr: string, hour: number, minute: number, price: number) {
    return { t: beirutWallTimeToMs(dateStr, hour, minute), p: price };
  }

  it('only includes points inside 01:00-10:00 Beirut on the current Beirut date', () => {
    const points = [
      beirutPoint('2026-01-06', 0, 30, 9999), // before window -- excluded
      beirutPoint('2026-01-06', 1, 0, 4050),  // window start, inclusive
      beirutPoint('2026-01-06', 5, 0, 4080),  // inside
      beirutPoint('2026-01-06', 9, 59, 4040), // inside
      beirutPoint('2026-01-06', 10, 0, 9999), // window end, exclusive -- excluded
      beirutPoint('2026-01-05', 5, 0, 9999),  // right window, wrong day -- excluded
    ];
    const res = computeAsianFromIntraday(points, nowMs);
    expect(res).toEqual({ high: 4080, low: 4040, n: 3 });
  });

  it('returns null when there is no coverage for today\'s window', () => {
    expect(computeAsianFromIntraday([], nowMs)).toBeNull();
    expect(computeAsianFromIntraday(null, nowMs)).toBeNull();
    expect(computeAsianFromIntraday([beirutPoint('2026-01-05', 5, 0, 4000)], nowMs)).toBeNull();
  });

  it('drops points with unparseable timestamps instead of throwing', () => {
    const points = [{ t: 'garbage', p: 1 }, beirutPoint('2026-01-06', 5, 0, 4070)];
    expect(computeAsianFromIntraday(points, nowMs)).toEqual({ high: 4070, low: 4070, n: 1 });
  });
});

describe('computeATR14', () => {
  it('averages true range over the last 14 daily bars', () => {
    // 16 bars with a constant true range of 10 after the first, and one
    // planted outlier at the start that must NOT be included once there
    // are more than 14 transitions.
    const points = [];
    let prevClose = 4000;
    for (let i = 0; i < 16; i++) {
      const d = `2026-01-${String(i + 1).padStart(2, '0')}`;
      const h = prevClose + 5;
      const l = prevClose - 5;
      const c = prevClose;
      points.push({ d, h, l, c });
      prevClose = c; // true range for each transition after the first stays 10 (h-l)
    }
    const atr = computeATR14(points);
    expect(atr).toBe(10);
  });

  it('returns null with fewer than 2 bars', () => {
    expect(computeATR14([{ d: '2026-01-01', h: 10, l: 5, c: 8 }])).toBeNull();
    expect(computeATR14([])).toBeNull();
    expect(computeATR14(null)).toBeNull();
  });

  it('sorts out-of-order input by date before computing', () => {
    const points = [
      { d: '2026-01-03', h: 110, l: 90, c: 100 },
      { d: '2026-01-01', h: 105, l: 95, c: 100 },
      { d: '2026-01-02', h: 108, l: 92, c: 100 },
    ];
    // Sorted: (01: h105 l95 c100) -> (02: h108 l92 c100, TR=16) -> (03: h110 l90 c100, TR=20)
    expect(computeATR14(points)).toBe((16 + 20) / 2);
  });
});
