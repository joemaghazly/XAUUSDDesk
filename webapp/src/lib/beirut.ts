// Session-clock logic, ported verbatim from index.html / session-board.html.
// Do not adjust the hour boundaries or labels without checking against the
// trading framework — see CLAUDE context in the migration conversation.

export interface BeirutTime {
  h: number;
  m: number;
  s: number;
}

export interface BeirutDateTime extends BeirutTime {
  date: string; // YYYY-MM-DD
}

export function beirutParts(): BeirutTime {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Beirut', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  let h = 0, m = 0, s = 0;
  fmt.formatToParts(new Date()).forEach((p) => {
    if (p.type === 'hour') h = +p.value;
    if (p.type === 'minute') m = +p.value;
    if (p.type === 'second') s = +p.value;
  });
  return { h, m, s };
}

export function beirutDateParts(): BeirutDateTime {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const o: Record<string, string> = {};
  fmt.formatToParts(new Date()).forEach((p) => { o[p.type] = p.value; });
  return { h: +o.hour, m: +o.minute, s: +o.second, date: `${o.year}-${o.month}-${o.day}` };
}

export function pad(n: number): string {
  return (n < 10 ? '0' : '') + n;
}

export type PhaseId = 'asian' | 'london' | 'exec' | 'eod';
export type PhaseDot = 'steel' | 'brass' | 'jade' | 'off';

export interface Phase {
  id: PhaseId;
  from: number;
  to: number;
  name: string;
  cls: PhaseDot;
  note: string;
}

// Asian range 01:00-10:00 = reference range. London 10:00-15:00 = read-only
// except the tracked London experiment. Execution opens 15:00 at the VWAP
// anchor. These hour boundaries are the trading framework, not a UI choice.
export const PHASES: Phase[] = [
  { id: 'asian', from: 1, to: 10, name: 'Asian range — watching', cls: 'steel',
    note: 'Marking today’s high and low — the range everything else reacts to.' },
  { id: 'london', from: 10, to: 15, name: 'London — reading', cls: 'brass',
    note: 'Watching how price responds to that range before anything is risked.' },
  { id: 'exec', from: 15, to: 24, name: 'Execution window', cls: 'jade',
    note: 'Anchor is set — this is the window the rules allow trading in.' },
  { id: 'eod', from: 0, to: 1, name: 'Off desk', cls: 'off',
    note: 'Outside the framework’s hours. Nothing to read, nothing to trade.' },
];

export function phaseFor(h: number): Phase {
  for (const p of PHASES) {
    if (h >= p.from && h < p.to) return p;
  }
  return PHASES[PHASES.length - 1];
}

export function nextBoundary(h: number, m: number): number {
  const order = [1, 10, 15, 24];
  const mins = h * 60 + m;
  for (const o of order) {
    const b = o * 60;
    if (mins < b) return b - mins;
  }
  return (24 * 60 - mins) + 60;
}
