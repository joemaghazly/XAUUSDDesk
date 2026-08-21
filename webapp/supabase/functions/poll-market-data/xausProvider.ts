// Deno copy of ../../../src/lib/marketdata/xausMath.ts + xausProvider.ts.
// Duplicated rather than imported because this runs in Supabase's Deno
// Edge Function runtime, a separate deployment unit from the Vite app --
// keep the two in sync by hand if the parsing logic ever changes. The
// canonical, unit-tested version (with tests run against fixtures shaped
// like xaus.com's documented responses -- this sandbox's network policy
// blocks the live API, so that's the extent of verification possible for
// either copy right now) lives in the webapp; this file has NOT been
// executed anywhere (no Deno runtime in this sandbox either) -- review it
// closely before it goes near a real deployment.

export interface IntradayPoint { t: number | string; p: number }
export interface HistoryPoint { d: string; h: number; l: number; c: number }

function parsePointTime(t: number | string): number | null {
  if (typeof t === 'number') return t > 1e12 ? t : t * 1000;
  const num = Number(t);
  if (t !== '' && !isNaN(num)) return num > 1e12 ? num : num * 1000;
  const d = Date.parse(t);
  return isNaN(d) ? null : d;
}

function beirutHourDate(ms: number): { date: string; hour: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  });
  const o: Record<string, string> = {};
  fmt.formatToParts(new Date(ms)).forEach((p) => { o[p.type] = p.value; });
  return { date: `${o.year}-${o.month}-${o.day}`, hour: +o.hour };
}

function computeAsianFromIntraday(points: IntradayPoint[] | null | undefined, nowMs = Date.now()) {
  const today = beirutHourDate(nowMs).date;
  const vals: number[] = [];
  (points || []).forEach((pt) => {
    const ms = parsePointTime(pt.t);
    if (ms == null) return;
    const bd = beirutHourDate(ms);
    if (bd.date === today && bd.hour >= 1 && bd.hour < 10) vals.push(pt.p);
  });
  if (!vals.length) return null;
  return { high: Math.max(...vals), low: Math.min(...vals), n: vals.length };
}

function computeATR14(points: HistoryPoint[] | null | undefined): number | null {
  const pts = (points || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1));
  if (pts.length < 2) return null;
  const trs: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const cur = pts[i], prev = pts[i - 1];
    trs.push(Math.max(cur.h - cur.l, Math.abs(cur.h - prev.c), Math.abs(cur.l - prev.c)));
  }
  const last14 = trs.slice(-14);
  return last14.length ? last14.reduce((s, x) => s + x, 0) / last14.length : null;
}

const LIVE_BASE = 'https://xaus.com/api/v1/';

export interface XausReading {
  spotPrice: number | null;
  asianHigh: number | null;
  asianLow: number | null;
  asianSampleCount: number | null;
  atr14: number | null;
}

// Fetches all three endpoints, tolerating any single one failing (a spot
// hiccup shouldn't lose the Asian range / ATR reading, and vice versa).
export async function fetchXausReading(): Promise<XausReading> {
  const [spot, asian, atr] = await Promise.allSettled([
    fetch(LIVE_BASE + 'spot').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`spot ${r.status}`)))),
    fetch(LIVE_BASE + 'intraday?symbol=xau&hours=24').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`intraday ${r.status}`)))),
    fetch(LIVE_BASE + 'history').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`history ${r.status}`)))),
  ]);

  const spotPrice = spot.status === 'fulfilled' && typeof spot.value?.spot_usd_oz === 'number' ? spot.value.spot_usd_oz : null;
  const asianEst = asian.status === 'fulfilled' && Array.isArray(asian.value?.points)
    ? computeAsianFromIntraday(asian.value.points) : null;
  const atr14 = atr.status === 'fulfilled' && Array.isArray(atr.value?.points)
    ? computeATR14(atr.value.points) : null;

  return {
    spotPrice,
    asianHigh: asianEst?.high ?? null,
    asianLow: asianEst?.low ?? null,
    asianSampleCount: asianEst?.n ?? null,
    atr14,
  };
}
