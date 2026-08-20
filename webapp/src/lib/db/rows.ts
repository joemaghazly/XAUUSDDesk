// Raw row shapes exactly as they come back from Postgres (snake_case,
// matching supabase/migrations/20260820221630_initial_schema.sql). Not for
// app code to use directly -- see trades.ts / dayLog.ts / sessionBoard.ts
// for the camelCase types the rest of the app should import.

export interface TradeRow {
  id: string;
  user_id: string;
  symbol: string;
  date: string;
  trade_no: number | null;
  session: string | null;
  day_type: string | null;
  day_char: string | null;
  asian_high: number | null;
  asian_low: number | null;
  atr: number | null;
  asian_range: number | null;
  asian_pct_atr: number | null;
  day_pct_atr: number | null;
  setup: string | null;
  direction: string | null;
  rsi: number | null;
  entry1: number | null;
  entry2: number | null;
  sl: number | null;
  risk1r: number | null;
  tp1: number | null;
  tp2: number | null;
  exit1: number | null;
  exit2: number | null;
  res1: number | null;
  res2: number | null;
  total_pts: number | null;
  res_r: number | null;
  rule_broken: string | null;
  confluence: string | null;
  notes: string | null;
  h1_state: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayLogRow {
  id: string;
  user_id: string;
  symbol: string;
  date: string;
  day_no: number | null;
  asian_high: number | null;
  asian_low: number | null;
  atr: number | null;
  asian_pct_atr: number | null;
  day_type: string | null;
  day_char: string | null;
  trades_taken: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionBoardDayRow {
  id: string;
  user_id: string;
  symbol: string;
  date: string;
  asian_high: number | null;
  asian_low: number | null;
  atr: number | null;
  london_high: number | null;
  london_low: number | null;
  vwap: number | null;
  price: number | null;
  day_char: string | null;
  checks: Record<string, boolean>;
  trades: number;
  losses: number;
  created_at: string;
  updated_at: string;
}
