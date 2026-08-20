import { supabase } from '../supabase';
import type { SessionBoardDayRow } from './rows';

// Replaces the session-board:<date> localStorage key -- one row per
// (symbol, date), same 1:1 mapping the old key had.
export interface SessionBoardDay {
  id: string;
  symbol: string;
  date: string;
  asianHigh: number | null;
  asianLow: number | null;
  atr: number | null;
  londonHigh: number | null;
  londonLow: number | null;
  vwap: number | null;
  price: number | null;
  dayChar: string | null;
  checks: Record<string, boolean>;
  trades: number;
  losses: number;
}

export type SessionBoardPatch = Partial<Omit<SessionBoardDay, 'id' | 'symbol' | 'date'>>;

const DEFAULTS: SessionBoardPatch = {
  asianHigh: null, asianLow: null, atr: null,
  londonHigh: null, londonLow: null,
  vwap: null, price: null,
  dayChar: null, checks: {}, trades: 0, losses: 0,
};

function fromRow(r: SessionBoardDayRow): SessionBoardDay {
  return {
    id: r.id,
    symbol: r.symbol,
    date: r.date,
    asianHigh: r.asian_high,
    asianLow: r.asian_low,
    atr: r.atr,
    londonHigh: r.london_high,
    londonLow: r.london_low,
    vwap: r.vwap,
    price: r.price,
    dayChar: r.day_char,
    checks: r.checks ?? {},
    trades: r.trades,
    losses: r.losses,
  };
}

function toPatchRow(patch: SessionBoardPatch) {
  const row: Record<string, unknown> = {};
  if ('asianHigh' in patch) row.asian_high = patch.asianHigh;
  if ('asianLow' in patch) row.asian_low = patch.asianLow;
  if ('atr' in patch) row.atr = patch.atr;
  if ('londonHigh' in patch) row.london_high = patch.londonHigh;
  if ('londonLow' in patch) row.london_low = patch.londonLow;
  if ('vwap' in patch) row.vwap = patch.vwap;
  if ('price' in patch) row.price = patch.price;
  if ('dayChar' in patch) row.day_char = patch.dayChar;
  if ('checks' in patch) row.checks = patch.checks;
  if ('trades' in patch) row.trades = patch.trades;
  if ('losses' in patch) row.losses = patch.losses;
  return row;
}

export async function getSessionBoardDay(symbol: string, date: string): Promise<SessionBoardDay | null> {
  const { data, error } = await supabase
    .from('session_board_days')
    .select('*')
    .eq('symbol', symbol)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as SessionBoardDayRow) : null;
}

// Merge-upsert: columns not present in `patch` are left untouched on an
// existing row (matches PostgREST upsert semantics) and take their table
// default on first insert -- same effect as the old code's
// `day = Object.assign(day, JSON.parse(raw))` merge onto a default object.
export async function upsertSessionBoardDay(
  symbol: string,
  date: string,
  patch: SessionBoardPatch,
): Promise<SessionBoardDay> {
  const { data, error } = await supabase
    .from('session_board_days')
    .upsert({ symbol, date, ...toPatchRow(patch) }, { onConflict: 'user_id,symbol,date' })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data as SessionBoardDayRow);
}

// Matches the board's "Clear today's board" action: today's row goes back
// to blank/default values, it isn't deleted.
export async function resetSessionBoardDay(symbol: string, date: string): Promise<SessionBoardDay> {
  return upsertSessionBoardDay(symbol, date, DEFAULTS);
}
