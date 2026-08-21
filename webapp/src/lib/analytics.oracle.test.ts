// Regression oracle: the functions below are copy-pasted, algorithm-for-
// algorithm, from journal.html's inline <script> (agg, perfStats,
// comparisons, periods, windowOf, buckets, modeOf, cleanPct, and the
// ordered/frequency groupings used by groupCard/orderedCard) -- only the
// var/function-expression syntax was translated to modern TS, nothing about
// the logic changed. This file exists to catch any drift the React port in
// analytics.ts introduces, by running both against the same fixture and
// diffing the output. If this test ever needs to change, the change should
// be justified by the original file, not by what's convenient here.
import { describe, expect, it } from 'vitest';
import type { Trade } from './db/trades';
import * as A from './analytics';

// ---- oracle, transcribed from journal.html ----
function oN(v: unknown): number { const x = typeof v === 'number' ? v : parseFloat(String(v)); return isFinite(x) ? x : 0; }
function oHas(v: unknown): boolean { return v !== null && v !== undefined && v !== ''; }
function oPts(t: Trade): number { return oN(t.totalPts); }
function oR(t: Trade): number { return oN(t.resR); }

function oAgg(list: Trade[]) {
  const c = list.length;
  const p = list.reduce((s, t) => s + oPts(t), 0);
  const r = list.reduce((s, t) => s + oR(t), 0);
  const w = list.filter((t) => oPts(t) > 0).length;
  return { n: c, pts: p, R: r, wins: w, losses: list.filter((t) => oPts(t) < 0).length, avg: c ? p / c : 0, avgR: c ? r / c : 0, wr: c ? (w / c) * 100 : 0 };
}

function oPerfStats(list: Trade[]) {
  const winners = list.filter((t) => oPts(t) > 0);
  const losers = list.filter((t) => oPts(t) < 0);
  const grossWin = winners.reduce((s, t) => s + oPts(t), 0);
  const grossLoss = losers.reduce((s, t) => s + oPts(t), 0);
  const pf = grossLoss < 0 ? grossWin / Math.abs(grossLoss) : (grossWin > 0 ? Infinity : null);
  const avgWinner = winners.length ? grossWin / winners.length : null;
  const avgLoser = losers.length ? grossLoss / losers.length : null;
  const chron = list.slice().sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : oN(a.tradeNo) - oN(b.tradeNo)));
  let run = 0, peak = 0, maxDD = 0;
  chron.forEach((t) => { run += oPts(t); if (run > peak) peak = run; const dd = peak - run; if (dd > maxDD) maxDD = dd; });
  const allPts = list.map(oPts);
  return { pf, avgWinner, avgLoser, maxDD, best: allPts.length ? Math.max(...allPts) : null, worst: allPts.length ? Math.min(...allPts) : null, winnersN: winners.length, losersN: losers.length };
}

function oComparisons(T: Trade[]) {
  function c(label: string, an: string, af: (t: Trade) => boolean, bn: string, bf: (t: Trade) => boolean) {
    const Aa = oAgg(T.filter(af)) as ReturnType<typeof oAgg> & { name?: string };
    const Bb = oAgg(T.filter(bf)) as ReturnType<typeof oAgg> & { name?: string };
    Aa.name = an; Bb.name = bn;
    return { label, a: Aa, b: Bb };
  }
  const yes = (t: Trade) => String(t.ruleBroken || '').toUpperCase().indexOf('Y') === 0;
  return [
    c('Rules followed', 'Followed', (t) => !yes(t), 'Broken', yes),
    c('Setup type', 'Continuation', (t) => t.setup === 'Continuation', 'Reversal', (t) => t.setup === 'Reversal'),
    c('Trade number in the day', '1st or 2nd', (t) => oN(t.tradeNo) <= 2, '3rd or later', (t) => oN(t.tradeNo) >= 3),
    c('Session', 'London', (t) => t.session === 'London', 'New York', (t) => t.session === 'NY'),
    c('Direction', 'Long', (t) => t.direction === 'Long', 'Short', (t) => t.direction === 'Short'),
    c('RSI at entry', 'Stretched (≤35 or ≥70)', (t) => oHas(t.rsi) && (oN(t.rsi) <= 35 || oN(t.rsi) >= 70), 'Middle (36–69)', (t) => oHas(t.rsi) && oN(t.rsi) > 35 && oN(t.rsi) < 70),
  ];
}

function oMondayOf(ds: string): string { const d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
function oPKey(ds: string, m: A.PeriodMode): string { return m === 'daily' ? ds : m === 'weekly' ? oMondayOf(ds) : ds.slice(0, 7); }

function oSorted(trades: Trade[]): Trade[] {
  return trades.slice().sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : oN(a.tradeNo) - oN(b.tradeNo)));
}

function oPeriods(trades: Trade[], m: A.PeriodMode) {
  const map: Record<string, Trade[]> = {};
  oSorted(trades).forEach((t) => { const k = oPKey(t.date, m); (map[k] = map[k] || []).push(t); });
  return Object.keys(map).sort().map((k) => {
    const list = map[k], a = oAgg(list), tots = list.map(oPts);
    const dd: Record<string, 1> = {};
    list.forEach((t) => { dd[t.date] = 1; });
    const broken = list.filter((t) => String(t.ruleBroken || '').toUpperCase().indexOf('Y') === 0).length;
    return { key: k, n: a.n, pts: a.pts, R: a.R, avg: a.avg, wr: a.wr, wins: a.wins, losses: a.losses, broken, best: Math.max(...tots), worst: Math.min(...tots), days: Object.keys(dd).length };
  });
}

function oWindowKeys(trades: Trade[], v: A.ViewMode): string[] {
  const ds: Record<string, 1> = {};
  trades.forEach((t) => { ds[t.date] = 1; });
  const dates = Object.keys(ds).sort();
  if (!dates.length) return [];
  if (v === 'daily') return dates;
  if (v === 'weekly') { const w: Record<string, 1> = {}; dates.forEach((d) => { w[oMondayOf(d)] = 1; }); return Object.keys(w).sort(); }
  if (v === 'monthly') { const m: Record<string, 1> = {}; dates.forEach((d) => { m[d.slice(0, 7)] = 1; }); return Object.keys(m).sort(); }
  if (v === 'yearly') { const y: Record<string, 1> = {}; dates.forEach((d) => { y[d.slice(0, 4)] = 1; }); return Object.keys(y).sort(); }
  return ['_'];
}

function oWindowOf(trades: Trade[], v: A.ViewMode, off: number) {
  const keys = oWindowKeys(trades, v);
  if (!keys.length) return null;
  const idx = Math.min(keys.length - 1, Math.max(0, keys.length - 1 - off));
  let key = keys[idx], list: Trade[], sub: string;
  if (v === 'daily') { list = trades.filter((t) => t.date === key); sub = 'trade'; }
  else if (v === 'weekly') { list = trades.filter((t) => oMondayOf(t.date) === key); sub = 'day'; }
  else if (v === 'monthly') { list = trades.filter((t) => t.date.slice(0, 7) === key); sub = 'day'; }
  else if (v === 'yearly') { list = trades.filter((t) => t.date.slice(0, 4) === key); sub = 'month'; }
  else if (v === 'ytd') { const yr = oWindowKeys(trades, 'yearly').slice(-1)[0]; list = trades.filter((t) => t.date.slice(0, 4) === yr); key = yr; sub = 'month'; }
  else { list = trades.slice(); const dk = oWindowKeys(trades, 'daily'); sub = dk.length > 60 ? 'month' : 'day'; }
  return { key, list, sub, idx, count: keys.length, single: v === 'ytd' || v === 'all' };
}

function oBuckets(win: NonNullable<ReturnType<typeof oWindowOf>>) {
  if (win.sub === 'trade') {
    return win.list.slice().sort((a, b) => oN(a.tradeNo) - oN(b.tradeNo)).map((t) => oPts(t));
  }
  const map: Record<string, number> = {};
  win.list.forEach((t) => { const k = win.sub === 'day' ? t.date : t.date.slice(0, 7); map[k] = (map[k] || 0) + oPts(t); });
  return Object.keys(map).sort().map((k) => map[k]);
}

function oModeOf(list: Trade[], field: keyof Trade) {
  const c: Record<string, number> = {};
  list.forEach((t) => { if (oHas(t[field])) c[String(t[field])] = (c[String(t[field])] || 0) + 1; });
  let best: string | null = null;
  Object.keys(c).forEach((k) => { if (!best || c[k] > c[best]) best = k; });
  return best ? { name: best, n: c[best], of: Object.keys(c).length } : null;
}

function oCleanPct(list: Trade[]) {
  if (!list.length) return null;
  const clean = list.filter((t) => String(t.ruleBroken || '').toUpperCase().indexOf('Y') !== 0).length;
  return { pct: (clean / list.length) * 100, clean, broken: list.length - clean };
}

// ---- fixture ----
function makeTrade(overrides: Partial<Trade>): Trade {
  return {
    id: 'x', symbol: 'XAUUSD', date: '2026-01-01', tradeNo: 1, session: null, dayType: null, dayChar: null,
    asianHigh: null, asianLow: null, atr: null, asianRange: null, asianPctATR: null, dayPctATR: null,
    setup: null, direction: null, rsi: null, entry1: null, entry2: null, sl: null, risk1R: null,
    tp1: null, tp2: null, exit1: null, exit2: null, res1: null, res2: null, totalPts: null, resR: null,
    ruleBroken: null, confluence: null, notes: null, h1State: null,
    ...overrides,
  };
}

const SETUPS = ['Continuation', 'Reversal', 'Other'];
const SESSIONS = ['London', 'NY', null];
const DAY_TYPES = ['Compression', 'Normal', 'Stretched', 'Extended'];
const DAY_CHARS = ['Trending Bullish Day', 'Trending Bearish Day', 'Choppy Day', 'Reversal Day'];
const DIRECTIONS = ['Long', 'Short'];

function buildFixture(n = 140): Trade[] {
  const trades: Trade[] = [];
  let seed = 42;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const start = new Date('2025-11-01T00:00:00');
  for (let i = 0; i < n; i++) {
    const dayOffset = Math.floor(i / 2.3);
    const d = new Date(start); d.setDate(start.getDate() + dayOffset);
    const date = d.toISOString().slice(0, 10);
    const tradeNo = (i % 3) + 1;
    const totalPts = Math.round((rand() * 60 - 25) * 10) / 10;
    trades.push(makeTrade({
      date, tradeNo, totalPts, resR: Math.round((totalPts / 15) * 100) / 100,
      session: SESSIONS[i % SESSIONS.length],
      dayType: DAY_TYPES[i % DAY_TYPES.length],
      dayChar: i % 5 === 0 ? null : DAY_CHARS[i % DAY_CHARS.length],
      setup: SETUPS[i % SETUPS.length],
      direction: DIRECTIONS[i % DIRECTIONS.length],
      rsi: i % 4 === 0 ? null : Math.round(rand() * 100),
      ruleBroken: i % 6 === 0 ? 'Y' : 'N',
    }));
  }
  return trades;
}

const fixture = buildFixture();

describe('analytics.ts matches the original journal.html logic', () => {
  it('agg() matches on the full set and slices', () => {
    expect(A.agg(fixture)).toEqual(oAgg(fixture));
    expect(A.agg(fixture.filter((t) => t.direction === 'Long'))).toEqual(oAgg(fixture.filter((t) => t.direction === 'Long')));
    expect(A.agg([])).toEqual(oAgg([]));
  });

  it('perfStats() matches, including profit factor / drawdown / best-worst', () => {
    expect(A.perfStats(fixture)).toEqual(oPerfStats(fixture));
  });

  it('comparisons() matches every row label and both sides', () => {
    const mine = A.comparisons(fixture);
    const oracle = oComparisons(fixture);
    expect(mine.map((c) => ({ label: c.label, a: { ...c.a }, b: { ...c.b } })))
      .toEqual(oracle.map((c) => ({ label: c.label, a: c.a, b: c.b })));
  });

  it('periods() matches for daily/weekly/monthly', () => {
    (['daily', 'weekly', 'monthly'] as const).forEach((m) => {
      const mine = A.periods(fixture, m).map(({ list: _list, label: _label, ...rest }) => rest);
      const oracle = oPeriods(fixture, m);
      expect(mine).toEqual(oracle);
    });
  });

  it('windowOf() + buckets() match for every view mode and a few offsets', () => {
    (['daily', 'weekly', 'monthly', 'yearly', 'ytd', 'all'] as const).forEach((v) => {
      [0, 1, 3].forEach((off) => {
        const mine = A.windowOf(fixture, v, off);
        const oracle = oWindowOf(fixture, v, off);
        if (oracle === null) { expect(mine).toBeNull(); return; }
        expect(mine).not.toBeNull();
        expect({ key: mine!.key, sub: mine!.sub, idx: mine!.idx, count: mine!.count, single: mine!.single })
          .toEqual({ key: oracle.key, sub: oracle.sub, idx: oracle.idx, count: oracle.count, single: oracle.single });
        expect(mine!.list.map((t) => t.id).sort()).toEqual(oracle.list.map((t) => t.id).sort());
        expect(A.buckets(mine!).map((b) => b.pts)).toEqual(oBuckets(oracle as never));
      });
    });
  });

  it('modeOf() matches for dayChar and dayType', () => {
    expect(A.modeOf(fixture, 'dayChar')).toEqual(oModeOf(fixture, 'dayChar'));
    expect(A.modeOf(fixture, 'dayType')).toEqual(oModeOf(fixture, 'dayType'));
    expect(A.modeOf([], 'dayType')).toEqual(oModeOf([], 'dayType'));
  });

  it('cleanPct() matches, including the empty-list null case', () => {
    expect(A.cleanPct(fixture)).toEqual(oCleanPct(fixture));
    expect(A.cleanPct([])).toEqual(oCleanPct([]));
  });

  it('groupByOrdered() matches the weekday/trade-number ordered breakdowns used by orderedCard', () => {
    const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekdayKeyFn = (t: Trade) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(t.date + 'T00:00:00Z').getUTCDay()];
    const mine = A.groupByOrdered(fixture, weekdayKeyFn, weekdayOrder).map(({ name, n: nn, avg }) => ({ name, n: nn, avg }));

    // oracle, transcribed from orderedCard() in journal.html
    const map: Record<string, Trade[]> = {};
    fixture.forEach((t) => { const k = weekdayKeyFn(t); (map[k] = map[k] || []).push(t); });
    const oracle = weekdayOrder.map((k) => { const a = oAgg(map[k] || []); return { name: k, n: a.n, avg: a.avg }; }).filter((x) => x.n > 0);

    expect(mine).toEqual(oracle);
  });
});
