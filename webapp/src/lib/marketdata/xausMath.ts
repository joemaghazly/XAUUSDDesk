// Ported from session-board.html's computeAsianFromIntraday / computeATR14
// / beirutHourDate / parsePointTime -- these compute the Asian range and
// Daily ATR from raw xaus.com points client-side, same as the original.
// Pure functions, no fetch -- so they're unit-testable independent of
// network access (this sandbox's egress policy blocks xaus.com, so that
// matters: these are verified against fixtures shaped like the documented
// API responses, not against a live call).

export interface IntradayPoint { t: number | string; p: number }
export interface HistoryPoint { d: string; h: number; l: number; c: number }

export function parsePointTime(t: number | string): number | null {
  if (typeof t === 'number') return t > 1e12 ? t : t * 1000;
  const num = Number(t);
  if (t !== '' && !isNaN(num)) return num > 1e12 ? num : num * 1000;
  const d = Date.parse(t);
  return isNaN(d) ? null : d;
}

export function beirutHourDate(ms: number): { date: string; hour: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  });
  const o: Record<string, string> = {};
  fmt.formatToParts(new Date(ms)).forEach((p) => { o[p.type] = p.value; });
  return { date: `${o.year}-${o.month}-${o.day}`, hour: +o.hour };
}

// Asian range = 01:00-10:00 Beirut, *today* -- matches PHASES in
// lib/beirut.ts. Returns null if there's no coverage yet (e.g. queried
// before 01:00, or the intraday feed has a gap).
export function computeAsianFromIntraday(points: IntradayPoint[] | null | undefined, nowMs = Date.now()): { high: number; low: number; n: number } | null {
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

export function computeATR14(points: HistoryPoint[] | null | undefined): number | null {
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
