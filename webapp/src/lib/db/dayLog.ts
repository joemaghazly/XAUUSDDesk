import { supabase } from '../supabase';
import type { DayLogRow } from './rows';

// camelCase keys match DAY_COLS in the original journal.html.
export interface DayLogEntry {
  id: string;
  symbol: string;
  date: string;
  dayNo: number | null;
  asianHigh: number | null;
  asianLow: number | null;
  atr: number | null;
  asianPctATR: number | null;
  dayType: string | null;
  dayChar: string | null;
  tradesTaken: number | null;
  notes: string | null;
}

export type NewDayLogEntry = Omit<DayLogEntry, 'id'>;

function fromRow(r: DayLogRow): DayLogEntry {
  return {
    id: r.id,
    symbol: r.symbol,
    date: r.date,
    dayNo: r.day_no,
    asianHigh: r.asian_high,
    asianLow: r.asian_low,
    atr: r.atr,
    asianPctATR: r.asian_pct_atr,
    dayType: r.day_type,
    dayChar: r.day_char,
    tradesTaken: r.trades_taken,
    notes: r.notes,
  };
}

function toRpcRow(d: NewDayLogEntry) {
  return {
    date: d.date,
    day_no: d.dayNo,
    asian_high: d.asianHigh,
    asian_low: d.asianLow,
    atr: d.atr,
    asian_pct_atr: d.asianPctATR,
    day_type: d.dayType,
    day_char: d.dayChar,
    trades_taken: d.tradesTaken,
    notes: d.notes,
  };
}

export async function listDayLog(symbol: string): Promise<DayLogEntry[]> {
  const { data, error } = await supabase
    .from('day_log')
    .select('*')
    .eq('symbol', symbol)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data as DayLogRow[]).map(fromRow);
}

// Same wholesale-replace semantics as replaceTrades -- see the comment there.
export async function replaceDayLog(symbol: string, days: NewDayLogEntry[]): Promise<void> {
  const { error } = await supabase.rpc('replace_day_log', {
    p_symbol: symbol,
    p_rows: days.map(toRpcRow),
  });
  if (error) throw error;
}
