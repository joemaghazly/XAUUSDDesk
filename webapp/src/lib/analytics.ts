// Ported verbatim (same formulas, same field names) from the inline
// <script> in journal.html. This module is pure -- no DOM, no Supabase --
// so it can be unit-tested against fixture data independent of the
// rendering layer. Do not "improve" the math here without checking it
// against the original file; these numbers are what the Journal has
// always shown.
import type { Trade } from './db/trades';

export function n(v: unknown): number {
  const x = typeof v === 'number' ? v : parseFloat(String(v));
  return isFinite(x) ? x : 0;
}
export function has(v: unknown): boolean {
  return v !== null && v !== undefined && v !== '';
}
export function fmt(v: number, d = 1): string {
  return (v > 0 ? '+' : '') + v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}
export function cls(v: number): 'pos' | 'neg' | 'dimc' {
  return v > 0 ? 'pos' : v < 0 ? 'neg' : 'dimc';
}
export function pts(t: Trade): number {
  return n(t.totalPts);
}
export function R(t: Trade): number {
  return n(t.resR);
}

export function sorted(trades: Trade[]): Trade[] {
  return trades.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return n(a.tradeNo) - n(b.tradeNo);
  });
}

export interface Agg {
  n: number; pts: number; R: number; wins: number; losses: number;
  avg: number; avgR: number; wr: number; name?: string;
}
export function agg(list: Trade[]): Agg {
  const c = list.length;
  const p = list.reduce((s, t) => s + pts(t), 0);
  const r = list.reduce((s, t) => s + R(t), 0);
  const w = list.filter((t) => pts(t) > 0).length;
  return {
    n: c, pts: p, R: r, wins: w, losses: list.filter((t) => pts(t) < 0).length,
    avg: c ? p / c : 0, avgR: c ? r / c : 0, wr: c ? (w / c) * 100 : 0,
  };
}

export interface PerfStats {
  pf: number | null; avgWinner: number | null; avgLoser: number | null; maxDD: number;
  best: number | null; worst: number | null; winnersN: number; losersN: number;
}
export function perfStats(list: Trade[]): PerfStats {
  const winners = list.filter((t) => pts(t) > 0);
  const losers = list.filter((t) => pts(t) < 0);
  const grossWin = winners.reduce((s, t) => s + pts(t), 0);
  const grossLoss = losers.reduce((s, t) => s + pts(t), 0); // negative or 0
  const pf = grossLoss < 0 ? grossWin / Math.abs(grossLoss) : (grossWin > 0 ? Infinity : null);
  const avgWinner = winners.length ? grossWin / winners.length : null;
  const avgLoser = losers.length ? grossLoss / losers.length : null;
  const chron = list.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return n(a.tradeNo) - n(b.tradeNo);
  });
  let run = 0, peak = 0, maxDD = 0;
  chron.forEach((t) => {
    run += pts(t);
    if (run > peak) peak = run;
    const dd = peak - run;
    if (dd > maxDD) maxDD = dd;
  });
  const allPts = list.map(pts);
  return {
    pf, avgWinner, avgLoser, maxDD,
    best: allPts.length ? Math.max(...allPts) : null,
    worst: allPts.length ? Math.min(...allPts) : null,
    winnersN: winners.length, losersN: losers.length,
  };
}

export interface Comparison {
  label: string; note: string; a: Agg; b: Agg;
}
export function comparisons(trades: Trade[]): Comparison[] {
  const yes = (t: Trade) => String(t.ruleBroken || '').toUpperCase().indexOf('Y') === 0;
  function c(label: string, an: string, af: (t: Trade) => boolean, bn: string, bf: (t: Trade) => boolean, note: string): Comparison {
    const A = agg(trades.filter(af)) as Agg; A.name = an;
    const B = agg(trades.filter(bf)) as Agg; B.name = bn;
    return { label, note, a: A, b: B };
  }
  return [
    c('Rules followed', 'Followed', (t) => !yes(t), 'Broken', yes,
      "Straight from the Rule Broken column. If the followed side isn't clearly ahead, the rules aren't earning their keep."),
    c('Setup type', 'Continuation', (t) => t.setup === 'Continuation', 'Reversal', (t) => t.setup === 'Reversal',
      '“Other” trades sit outside this split — they show up in the setup table below.'),
    c('Trade number in the day', '1st or 2nd', (t) => n(t.tradeNo) <= 2, '3rd or later', (t) => n(t.tradeNo) >= 3,
      'Whether the back end of the daily budget is worth spending.'),
    c('Session', 'London', (t) => t.session === 'London', 'New York', (t) => t.session === 'NY',
      'Only rows with the Session column filled in are counted here.'),
    c('Direction', 'Long', (t) => t.direction === 'Long', 'Short', (t) => t.direction === 'Short', ''),
    c('RSI at entry', 'Stretched (≤35 or ≥70)', (t) => has(t.rsi) && (n(t.rsi) <= 35 || n(t.rsi) >= 70),
      'Middle (36–69)', (t) => has(t.rsi) && n(t.rsi) > 35 && n(t.rsi) < 70,
      'Entering while RSI is already at an extreme, versus entering from the middle of the range.'),
  ];
}

export function mondayOf(ds: string): string {
  const d = new Date(ds + 'T00:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export type PeriodMode = 'daily' | 'weekly' | 'monthly';
export function pKey(ds: string, m: PeriodMode): string {
  return m === 'daily' ? ds : m === 'weekly' ? mondayOf(ds) : ds.slice(0, 7);
}
export function pLabel(k: string, m: PeriodMode): string {
  if (m === 'daily') return new Date(k + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (m === 'weekly') {
    const s = new Date(k + 'T00:00:00'), e = new Date(s);
    e.setDate(s.getDate() + 6);
    return s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' – ' + e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return new Date(k + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export interface Period {
  key: string; label: string; n: number; pts: number; R: number; avg: number; wr: number;
  wins: number; losses: number; broken: number; best: number; worst: number; days: number; list: Trade[];
}
export function periods(trades: Trade[], m: PeriodMode): Period[] {
  const map: Record<string, Trade[]> = {};
  sorted(trades).forEach((t) => { const k = pKey(t.date, m); (map[k] = map[k] || []).push(t); });
  return Object.keys(map).sort().map((k) => {
    const list = map[k], a = agg(list), tots = list.map(pts);
    const dd: Record<string, 1> = {};
    list.forEach((t) => { dd[t.date] = 1; });
    const broken = list.filter((t) => String(t.ruleBroken || '').toUpperCase().indexOf('Y') === 0).length;
    return {
      key: k, label: pLabel(k, m), n: a.n, pts: a.pts, R: a.R, avg: a.avg, wr: a.wr, wins: a.wins, losses: a.losses,
      broken, best: Math.max(...tots), worst: Math.min(...tots), days: Object.keys(dd).length, list,
    };
  });
}

export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'ytd' | 'all';

export function windowKeys(trades: Trade[], v: ViewMode): string[] {
  const ds: Record<string, 1> = {};
  trades.forEach((t) => { ds[t.date] = 1; });
  const dates = Object.keys(ds).sort();
  if (!dates.length) return [];
  if (v === 'daily') return dates;
  if (v === 'weekly') { const w: Record<string, 1> = {}; dates.forEach((d) => { w[mondayOf(d)] = 1; }); return Object.keys(w).sort(); }
  if (v === 'monthly') { const m: Record<string, 1> = {}; dates.forEach((d) => { m[d.slice(0, 7)] = 1; }); return Object.keys(m).sort(); }
  if (v === 'yearly') { const y: Record<string, 1> = {}; dates.forEach((d) => { y[d.slice(0, 4)] = 1; }); return Object.keys(y).sort(); }
  return ['_'];
}

export interface Window {
  key: string; label: string; list: Trade[]; sub: 'trade' | 'day' | 'month';
  idx: number; count: number; single: boolean;
}
export function windowOf(trades: Trade[], v: ViewMode, off: number): Window | null {
  const keys = windowKeys(trades, v);
  if (!keys.length) return null;
  const idx = Math.min(keys.length - 1, Math.max(0, keys.length - 1 - off));
  let key = keys[idx], list: Trade[], label: string, sub: 'trade' | 'day' | 'month';
  if (v === 'daily') {
    list = trades.filter((t) => t.date === key);
    label = new Date(key + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    sub = 'trade';
  } else if (v === 'weekly') {
    list = trades.filter((t) => mondayOf(t.date) === key);
    const s = new Date(key + 'T00:00:00'), e = new Date(s);
    e.setDate(s.getDate() + 6);
    label = 'Week of ' + s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' – ' + e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    sub = 'day';
  } else if (v === 'monthly') {
    list = trades.filter((t) => t.date.slice(0, 7) === key);
    label = new Date(key + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    sub = 'day';
  } else if (v === 'yearly') {
    list = trades.filter((t) => t.date.slice(0, 4) === key);
    label = key; sub = 'month';
  } else if (v === 'ytd') {
    const yr = windowKeys(trades, 'yearly').slice(-1)[0];
    list = trades.filter((t) => t.date.slice(0, 4) === yr);
    label = yr + ' to date'; key = yr; sub = 'month';
  } else {
    list = trades.slice();
    const dk = windowKeys(trades, 'daily');
    label = dk.length > 1 ? 'All time · ' + dk[0] + ' → ' + dk[dk.length - 1] : 'All time';
    sub = dk.length > 60 ? 'month' : 'day';
  }
  return { key, label, list, sub, idx, count: keys.length, single: v === 'ytd' || v === 'all' };
}

export interface Bucket { label: string; pts: number }
export function buckets(win: Window): Bucket[] {
  if (win.sub === 'trade') {
    return win.list.slice().sort((a, b) => n(a.tradeNo) - n(b.tradeNo))
      .map((t, i) => ({ label: 'Trade ' + (has(t.tradeNo) ? t.tradeNo : i + 1), pts: pts(t) }));
  }
  const map: Record<string, number> = {};
  win.list.forEach((t) => {
    const k = win.sub === 'day' ? t.date : t.date.slice(0, 7);
    map[k] = (map[k] || 0) + pts(t);
  });
  return Object.keys(map).sort().map((k) => {
    const lab = win.sub === 'day'
      ? new Date(k + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : new Date(k + '-01T00:00:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    return { label: lab, pts: map[k] };
  });
}

export function modeOf(list: Trade[], field: keyof Trade): { name: string; n: number; of: number } | null {
  const c: Record<string, number> = {};
  list.forEach((t) => { const v = t[field]; if (has(v)) c[String(v)] = (c[String(v)] || 0) + 1; });
  let best: string | null = null;
  Object.keys(c).forEach((k) => { if (!best || c[k] > c[best]) best = k; });
  return best ? { name: best, n: c[best], of: Object.keys(c).length } : null;
}

export function cleanPct(list: Trade[]): { pct: number; clean: number; broken: number } | null {
  if (!list.length) return null;
  const clean = list.filter((t) => String(t.ruleBroken || '').toUpperCase().indexOf('Y') !== 0).length;
  return { pct: (clean / list.length) * 100, clean, broken: list.length - clean };
}

export function groupByField(list: Trade[], field: keyof Trade): Agg[] {
  const map: Record<string, Trade[]> = {};
  list.forEach((t) => { const k = has(t[field]) ? String(t[field]) : '(blank)'; (map[k] = map[k] || []).push(t); });
  return Object.keys(map).map((k) => { const a = agg(map[k]) as Agg; a.name = k; return a; })
    .sort((x, y) => y.n - x.n);
}

// Like groupByField, but keys are shown in a fixed, meaningful order (e.g.
// Mon..Sun, Trade 1..Trade N) instead of sorted by frequency. keyFn returns
// a key or null (null trades are dropped); order lists every key in
// display order; keys with zero trades are omitted from the result.
export function groupByOrdered(list: Trade[], keyFn: (t: Trade) => string | null, order: string[]): Agg[] {
  const map: Record<string, Trade[]> = {};
  list.forEach((t) => { const k = keyFn(t); if (k == null) return; (map[k] = map[k] || []).push(t); });
  return order.map((k) => { const a = agg(map[k] || []) as Agg; a.name = k; return a; })
    .filter((x) => x.n > 0);
}
