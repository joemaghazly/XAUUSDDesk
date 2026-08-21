import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseWorkbook } from './xlsx';

// Builds a workbook the same shape the real XAUUSD_Trading_Journal.xlsx
// has (a "Trade Log" sheet with the header row a few rows down, like the
// real workbook's Dashboard/Framework tabs pushing it down), writes it to
// a real binary buffer, then parses it back through parseWorkbook -- this
// exercises the actual SheetJS read/write path, not just the TS types.
function buildFixtureWorkbook(): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const aoa = [
    ['XAUUSD Trading Journal'],
    [],
    ['Date', 'Trade #\n(of day)', 'Session', 'Day Type', 'Day\nCharacter', 'Asian High', 'Asian Low', 'Daily ATR',
      'Setup Type', 'Direction', 'RSI\nat Entry', 'Result\nBullet 1 (pts)', 'Result\nBullet 2 (pts)',
      'Total Result\n(pts)', 'Result\n(R)', 'Rule\nBroken?', 'Notes / Lessons'],
    ['2026-01-05', 1, 'London', 'Normal', 'Trending Bullish Day', 4079.18, 4047.34, 83.96,
      'Continuation', 'Long', 42, 8.4, 4.1, 12.5, 0.83, 'N', 'Clean entry off the reclaim'],
    ['2026-01-06', 1, 'NY', 'Compression', null, 4082.4, 4061.1, 79.2,
      'Reversal', 'Short', 71, -3.0, null, null, null, 'Y', 'Chased it'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Trade Log');

  const dayAoa = [
    ['Date', 'Day #', 'Asian High', 'Asian Low', 'Daily ATR', 'Asian Range\n% of ATR', 'Day Type', 'Day\nCharacter', 'Trades\nTaken', 'Notes / What Happened'],
    ['2026-01-05', 1, 4079.18, 4047.34, 83.96, 0.379, 'Normal', 'Trending Bullish Day', 1, 'Good day'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dayAoa), 'Day Log');

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return out;
}

describe('parseWorkbook', () => {
  it('reads trades and day log from a real xlsx buffer', () => {
    const buf = buildFixtureWorkbook();
    const res = parseWorkbook(buf, 'XAUUSD');

    expect(res.skipped).toBe(0);
    expect(res.trades).toHaveLength(2);
    expect(res.days).toHaveLength(1);

    const [t1, t2] = res.trades;
    expect(t1).toMatchObject({
      date: '2026-01-05', symbol: 'XAUUSD', tradeNo: 1, session: 'London', dayType: 'Normal',
      dayChar: 'Trending Bullish Day', asianHigh: 4079.18, asianLow: 4047.34, atr: 83.96,
      setup: 'Continuation', direction: 'Long', rsi: 42, res1: 8.4, res2: 4.1, totalPts: 12.5,
      resR: 0.83, ruleBroken: 'N', notes: 'Clean entry off the reclaim',
    });
    // totalPts was blank in the fixture -> recomputed from res1+res2 (here just res1, res2 blank).
    expect(t2).toMatchObject({
      date: '2026-01-06', tradeNo: 1, session: 'NY', dayType: 'Compression', dayChar: null,
      setup: 'Reversal', direction: 'Short', rsi: 71, res1: -3, res2: null, totalPts: -3, ruleBroken: 'Y',
    });

    expect(res.days[0]).toMatchObject({
      date: '2026-01-05', symbol: 'XAUUSD', dayNo: 1, asianHigh: 4079.18, asianLow: 4047.34, atr: 83.96,
      asianPctATR: 0.379, dayType: 'Normal', dayChar: 'Trending Bullish Day', tradesTaken: 1, notes: 'Good day',
    });
  });

  it('skips rows with an unparseable date and counts them', () => {
    const wb = XLSX.utils.book_new();
    const aoa = [
      ['Date', 'Trade #\n(of day)', 'Total Result\n(pts)'],
      ['2026-01-05', 1, 10],
      ['not a date', 2, 5],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Trade Log');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const res = parseWorkbook(buf, 'XAUUSD');
    expect(res.trades).toHaveLength(1);
    expect(res.skipped).toBe(1);
  });
});
