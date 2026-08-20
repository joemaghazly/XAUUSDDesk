import { supabase } from '../supabase';
import type { TradeRow } from './rows';

// camelCase field names match SHEET_COLS keys in the original journal.html
// exactly, so the Phase 3 port of the analytics functions (agg, comparisons,
// periods, perfStats) can read these objects the same way the old code read
// its localStorage-sourced trade array.
export interface Trade {
  id: string;
  symbol: string;
  date: string; // YYYY-MM-DD
  tradeNo: number | null;
  session: string | null;
  dayType: string | null;
  dayChar: string | null;
  asianHigh: number | null;
  asianLow: number | null;
  atr: number | null;
  asianRange: number | null;
  asianPctATR: number | null;
  dayPctATR: number | null;
  setup: string | null;
  direction: string | null;
  rsi: number | null;
  entry1: number | null;
  entry2: number | null;
  sl: number | null;
  risk1R: number | null;
  tp1: number | null;
  tp2: number | null;
  exit1: number | null;
  exit2: number | null;
  res1: number | null;
  res2: number | null;
  totalPts: number | null;
  resR: number | null;
  ruleBroken: string | null;
  confluence: string | null;
  notes: string | null;
  h1State: string | null;
}

export type NewTrade = Omit<Trade, 'id'>;

function fromRow(r: TradeRow): Trade {
  return {
    id: r.id,
    symbol: r.symbol,
    date: r.date,
    tradeNo: r.trade_no,
    session: r.session,
    dayType: r.day_type,
    dayChar: r.day_char,
    asianHigh: r.asian_high,
    asianLow: r.asian_low,
    atr: r.atr,
    asianRange: r.asian_range,
    asianPctATR: r.asian_pct_atr,
    dayPctATR: r.day_pct_atr,
    setup: r.setup,
    direction: r.direction,
    rsi: r.rsi,
    entry1: r.entry1,
    entry2: r.entry2,
    sl: r.sl,
    risk1R: r.risk1r,
    tp1: r.tp1,
    tp2: r.tp2,
    exit1: r.exit1,
    exit2: r.exit2,
    res1: r.res1,
    res2: r.res2,
    totalPts: r.total_pts,
    resR: r.res_r,
    ruleBroken: r.rule_broken,
    confluence: r.confluence,
    notes: r.notes,
    h1State: r.h1_state,
  };
}

function toRpcRow(t: NewTrade) {
  return {
    date: t.date,
    trade_no: t.tradeNo,
    session: t.session,
    day_type: t.dayType,
    day_char: t.dayChar,
    asian_high: t.asianHigh,
    asian_low: t.asianLow,
    atr: t.atr,
    asian_range: t.asianRange,
    asian_pct_atr: t.asianPctATR,
    day_pct_atr: t.dayPctATR,
    setup: t.setup,
    direction: t.direction,
    rsi: t.rsi,
    entry1: t.entry1,
    entry2: t.entry2,
    sl: t.sl,
    risk1r: t.risk1R,
    tp1: t.tp1,
    tp2: t.tp2,
    exit1: t.exit1,
    exit2: t.exit2,
    res1: t.res1,
    res2: t.res2,
    total_pts: t.totalPts,
    res_r: t.resR,
    rule_broken: t.ruleBroken,
    confluence: t.confluence,
    notes: t.notes,
    h1_state: t.h1State,
  };
}

export async function listTrades(symbol: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('symbol', symbol)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data as TradeRow[]).map(fromRow);
}

// Mirrors the original app's import semantics exactly: importing a workbook
// replaced state.trades wholesale, it didn't merge with what was already
// there. Goes through the replace_trades RPC so the delete + bulk insert
// happen in one transaction -- two separate requests from the browser
// would leave the table empty if the connection dropped between them.
export async function replaceTrades(symbol: string, trades: NewTrade[]): Promise<void> {
  const { error } = await supabase.rpc('replace_trades', {
    p_symbol: symbol,
    p_rows: trades.map(toRpcRow),
  });
  if (error) throw error;
}

export async function clearTrades(symbol: string): Promise<void> {
  const { error } = await supabase.from('trades').delete().eq('symbol', symbol);
  if (error) throw error;
}
