// xlsx import/export, ported from journal.html. Column layout, sheet
// lookup and date parsing all match the original exactly -- the point is
// that an existing XAUUSD_Trading_Journal.xlsx workbook still imports the
// same way it always did. Uses the `xlsx` npm package (same 0.18.5 SheetJS
// build the static pages loaded from a CDN) instead of a <script> tag.
import * as XLSX from 'xlsx';
import type { WorkBook, WorkSheet } from 'xlsx';
import type { NewTrade, Trade } from './db/trades';
import type { NewDayLogEntry, DayLogEntry } from './db/dayLog';
import { has, n } from './analytics';

type ColKind = 'text' | 'numeric';
type ColSpec<K extends string> = { key: K; header: string; kind: ColKind };

function col<K extends string>(key: K, header: string, kind: ColKind): ColSpec<K> {
  return { key, header, kind };
}

// Matches SHEET_COLS in journal.html exactly (key, spreadsheet header).
const SHEET_COLS: ColSpec<keyof NewTrade>[] = [
  col('tradeNo', 'Trade #\n(of day)', 'numeric'),
  col('session', 'Session', 'text'),
  col('dayType', 'Day Type', 'text'),
  col('dayChar', 'Day\nCharacter', 'text'),
  col('asianHigh', 'Asian High', 'numeric'),
  col('asianLow', 'Asian Low', 'numeric'),
  col('atr', 'Daily ATR', 'numeric'),
  col('asianRange', 'Asian Range\n(pts)', 'numeric'),
  col('asianPctATR', 'Asian Range\n% of ATR', 'numeric'),
  col('dayPctATR', 'Day Range\n% ATR\n(at entry)', 'numeric'),
  col('setup', 'Setup Type', 'text'),
  col('direction', 'Direction', 'text'),
  col('rsi', 'RSI\nat Entry', 'numeric'),
  col('entry1', 'Entry\nBullet 1', 'numeric'),
  col('entry2', 'Entry\nBullet 2', 'numeric'),
  col('sl', 'Stop Loss', 'numeric'),
  col('risk1R', 'Risk 1R\n(Bullet 1, pts)', 'numeric'),
  col('tp1', 'TP1\n(Bullet 1)', 'numeric'),
  col('tp2', 'TP2\n(Bullet 2)', 'numeric'),
  col('exit1', 'Exit\nBullet 1', 'numeric'),
  col('exit2', 'Exit\nBullet 2', 'numeric'),
  col('res1', 'Result\nBullet 1 (pts)', 'numeric'),
  col('res2', 'Result\nBullet 2 (pts)', 'numeric'),
  col('totalPts', 'Total Result\n(pts)', 'numeric'),
  col('resR', 'Result\n(R)', 'numeric'),
  col('ruleBroken', 'Rule\nBroken?', 'text'),
  col('confluence', 'Confluence / Setup Notes', 'text'),
  col('notes', 'Notes / Lessons', 'text'),
  col('h1State', '1H State\nat Entry', 'text'),
];

// Matches DAY_COLS in journal.html exactly.
const DAY_COLS: ColSpec<keyof NewDayLogEntry>[] = [
  col('dayNo', 'Day #', 'numeric'),
  col('asianHigh', 'Asian High', 'numeric'),
  col('asianLow', 'Asian Low', 'numeric'),
  col('atr', 'Daily ATR', 'numeric'),
  col('asianPctATR', 'Asian Range\n% of ATR', 'numeric'),
  col('dayType', 'Day Type', 'text'),
  col('dayChar', 'Day\nCharacter', 'text'),
  col('tradesTaken', 'Trades\nTaken', 'numeric'),
  col('notes', 'Notes / What Happened', 'text'),
];

function norm(h: unknown): string {
  return String(h == null ? '' : h).replace(/\s+/g, ' ').trim().toLowerCase();
}

function toISO(v: unknown): string {
  if (!has(v)) return '';
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  const d2 = new Date(s);
  if (!isNaN(d2.getTime())) return d2.toISOString().slice(0, 10);
  return s;
}

function findSheet(wb: WorkBook, wanted: string): WorkSheet | null {
  for (const name of wb.SheetNames) {
    if (norm(name) === norm(wanted)) return wb.Sheets[name];
  }
  return null;
}
function gridOf(ws: WorkSheet | null): unknown[][] {
  return ws ? (XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }) as unknown[][]) : [];
}
function headerIndex(grid: unknown[][]): number {
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const row = grid[i] || [];
    for (let j = 0; j < Math.min(row.length, 4); j++) {
      if (norm(row[j]) === 'date') return i;
    }
  }
  return -1;
}
function mapRow<K extends string>(row: unknown[], hdr: string[], spec: ColSpec<K>[]): Record<K, unknown> {
  const out = {} as Record<K, unknown>;
  spec.forEach((c) => {
    const idx = hdr.indexOf(norm(c.header));
    const raw = idx > -1 ? row[idx] : null;
    if (!has(raw)) { out[c.key] = null; return; }
    out[c.key] = c.kind === 'numeric' ? n(raw) : raw;
  });
  return out;
}

export interface ParsedWorkbook {
  trades: NewTrade[];
  days: NewDayLogEntry[];
  skipped: number;
  sheets: string;
}

export function parseWorkbook(buf: ArrayBuffer, symbol: string): ParsedWorkbook {
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });

  let tg = gridOf(findSheet(wb, 'Trade Log'));
  if (!tg.length) {
    for (const name of wb.SheetNames) {
      const g = gridOf(wb.Sheets[name]);
      if (headerIndex(g) > -1) { tg = g; break; }
    }
  }
  const trades: NewTrade[] = [];
  let skipped = 0;
  const hi = headerIndex(tg);
  if (hi > -1) {
    const hdr = (tg[hi] || []).map(norm);
    const dateCol = hdr.indexOf('date') > -1 ? hdr.indexOf('date') : 0;
    for (let r = hi + 1; r < tg.length; r++) {
      const row = tg[r] || [];
      if (!has(row[dateCol])) continue;
      const date = toISO(row[dateCol]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { skipped++; continue; }
      const rec = mapRow(row, hdr, SHEET_COLS) as unknown as NewTrade;
      rec.date = date;
      rec.symbol = symbol;
      if (!has(rec.totalPts) && (has(rec.res1) || has(rec.res2))) rec.totalPts = n(rec.res1) + n(rec.res2);
      trades.push(rec);
    }
  }

  const dg = gridOf(findSheet(wb, 'Day Log'));
  const days: NewDayLogEntry[] = [];
  const dhi = headerIndex(dg);
  if (dhi > -1) {
    const dhdr = (dg[dhi] || []).map(norm);
    for (let q = dhi + 1; q < dg.length; q++) {
      const drow = dg[q] || [];
      const dDateCol = dhdr.indexOf('date') > -1 ? dhdr.indexOf('date') : 0;
      const date = toISO(drow[dDateCol]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const d = mapRow(drow, dhdr, DAY_COLS) as unknown as NewDayLogEntry;
      d.date = date;
      d.symbol = symbol;
      days.push(d);
    }
  }

  return { trades, days, skipped, sheets: wb.SheetNames.join(', ') };
}

function sortedForExport(trades: Trade[]): Trade[] {
  return trades.slice().sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : n(a.tradeNo) - n(b.tradeNo)));
}

function tradeAOA(trades: Trade[]): unknown[][] {
  const rows: unknown[][] = [
    ['XAUUSD Day-Trading Journal'],
    ['Exported from the dashboard. Column order matches the Trade Log sheet.'],
    [],
    ['Date', ...SHEET_COLS.map((c) => c.header)],
    [],
  ];
  sortedForExport(trades).forEach((t) => {
    rows.push([t.date, ...SHEET_COLS.map((c) => {
      const v = t[c.key];
      return v === null || v === undefined ? '' : v;
    })]);
  });
  return rows;
}

export function exportXlsx(trades: Trade[], days: DayLogEntry[], filename = 'XAUUSD_Trading_Journal_export.xlsx'): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tradeAOA(trades)), 'Trade Log');
  if (days.length) {
    const d: unknown[][] = [['Date', ...DAY_COLS.map((c) => c.header)]];
    days.forEach((x) => {
      d.push([x.date, ...DAY_COLS.map((c) => {
        const v = x[c.key];
        return v === null || v === undefined ? '' : v;
      })]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d), 'Day Log');
  }
  XLSX.writeFile(wb, filename);
}

export function csvText(trades: Trade[]): string {
  const q = (v: unknown) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = [['Date', ...SHEET_COLS.map((c) => c.header.replace(/\n/g, ' '))].map(q).join(',')];
  sortedForExport(trades).forEach((t) => {
    rows.push([t.date, ...SHEET_COLS.map((c) => t[c.key])].map(q).join(','));
  });
  return rows.join('\r\n');
}

export function downloadText(name: string, text: string, mime: string): void {
  const blob = new Blob([mime.indexOf('csv') > -1 ? '﻿' + text : text], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export async function copyText(text: string): Promise<boolean> {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { /* fall through to clipboard API */ }
  ta.remove();
  if (ok) return true;
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }
  return false;
}
