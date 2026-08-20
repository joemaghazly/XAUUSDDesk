-- Initial schema: replaces the three localStorage keys the static site used
-- (xauusd-desk:trades:<symbol> -> trades/day_log, session-board:<date> ->
-- session_board_days). Column sets mirror SHEET_COLS / DAY_COLS from
-- journal.html and session-board.html exactly, so xlsx import/export keeps
-- working unchanged in Phase 3. Single-user app, but every table still
-- carries user_id + RLS since the anon key is public by design.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- trades: one row per logged trade. Matches SHEET_COLS in journal.html.
-- ---------------------------------------------------------------------
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  symbol text not null default 'XAUUSD',

  date date not null,
  trade_no integer,
  session text,             -- 'London' | 'NY' | null
  day_type text,             -- 'Compression' | 'Normal' | 'Stretched' | 'Extended' | null (first-read label, can be revised)
  day_char text,             -- 'Trending Bullish Day' | 'Trending Bearish Day' | 'Choppy Day' | 'Reversal Day' | null
  asian_high numeric,
  asian_low numeric,
  atr numeric,
  asian_range numeric,       -- pts
  asian_pct_atr numeric,     -- Asian range as % of Daily ATR
  day_pct_atr numeric,       -- Day range % ATR at entry
  setup text,                -- 'Continuation' | 'Reversal' | other free text
  direction text,            -- 'Long' | 'Short'
  rsi numeric,
  entry1 numeric,
  entry2 numeric,
  sl numeric,
  risk1r numeric,            -- Risk 1R (Bullet 1, pts)
  tp1 numeric,
  tp2 numeric,
  exit1 numeric,
  exit2 numeric,
  res1 numeric,               -- Result Bullet 1 (pts)
  res2 numeric,               -- Result Bullet 2 (pts)
  total_pts numeric,          -- Total Result (pts)
  res_r numeric,              -- Result (R)
  rule_broken text,           -- kept as raw text (e.g. "Y"/"N") for exact xlsx round-trip, not a boolean
  confluence text,
  notes text,
  h1_state text,              -- 1H State at Entry

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trades_user_symbol_date_idx on public.trades (user_id, symbol, date);

-- Explicit, rather than relying on the default privileges a Supabase
-- project normally grants new public tables -- makes this migration
-- correct standalone. RLS still gates row visibility either way.
grant select, insert, update, delete on public.trades to authenticated;

create trigger trades_set_updated_at
  before update on public.trades
  for each row execute function public.set_updated_at();

alter table public.trades enable row level security;

create policy "trades_owner_all" on public.trades
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- day_log: one row per trading day. Matches DAY_COLS in journal.html.
-- ---------------------------------------------------------------------
create table public.day_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  symbol text not null default 'XAUUSD',

  date date not null,
  day_no integer,
  asian_high numeric,
  asian_low numeric,
  atr numeric,
  asian_pct_atr numeric,
  day_type text,
  day_char text,
  trades_taken integer,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, symbol, date)
);

grant select, insert, update, delete on public.day_log to authenticated;

create trigger day_log_set_updated_at
  before update on public.day_log
  for each row execute function public.set_updated_at();

alter table public.day_log enable row level security;

create policy "day_log_owner_all" on public.day_log
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Atomic "replace all rows for this symbol" RPCs. The old app's xlsx
-- import replaced state.trades/state.days wholesale in one JS assignment;
-- a plain delete-then-insert from the browser would not be atomic across
-- two separate PostgREST requests (a dropped connection between them would
-- leave the table empty), so this does both in one transaction instead.
-- security definer is required to bypass RLS for the bulk delete/insert;
-- both statements explicitly scope to auth.uid() themselves rather than
-- relying on the RLS policy, since that policy doesn't apply here.
-- ---------------------------------------------------------------------
create or replace function public.replace_trades(p_symbol text, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.trades where user_id = auth.uid() and symbol = p_symbol;

  if p_rows is not null and jsonb_array_length(p_rows) > 0 then
    insert into public.trades (
      user_id, symbol, date, trade_no, session, day_type, day_char,
      asian_high, asian_low, atr, asian_range, asian_pct_atr, day_pct_atr,
      setup, direction, rsi, entry1, entry2, sl, risk1r, tp1, tp2,
      exit1, exit2, res1, res2, total_pts, res_r, rule_broken,
      confluence, notes, h1_state
    )
    select
      auth.uid(), p_symbol,
      (r->>'date')::date,
      (r->>'trade_no')::integer,
      r->>'session', r->>'day_type', r->>'day_char',
      (r->>'asian_high')::numeric, (r->>'asian_low')::numeric, (r->>'atr')::numeric,
      (r->>'asian_range')::numeric, (r->>'asian_pct_atr')::numeric, (r->>'day_pct_atr')::numeric,
      r->>'setup', r->>'direction', (r->>'rsi')::numeric,
      (r->>'entry1')::numeric, (r->>'entry2')::numeric, (r->>'sl')::numeric, (r->>'risk1r')::numeric,
      (r->>'tp1')::numeric, (r->>'tp2')::numeric, (r->>'exit1')::numeric, (r->>'exit2')::numeric,
      (r->>'res1')::numeric, (r->>'res2')::numeric, (r->>'total_pts')::numeric, (r->>'res_r')::numeric,
      r->>'rule_broken', r->>'confluence', r->>'notes', r->>'h1_state'
    from jsonb_array_elements(p_rows) as r;
  end if;
end;
$$;

grant execute on function public.replace_trades(text, jsonb) to authenticated;

create or replace function public.replace_day_log(p_symbol text, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.day_log where user_id = auth.uid() and symbol = p_symbol;

  if p_rows is not null and jsonb_array_length(p_rows) > 0 then
    insert into public.day_log (
      user_id, symbol, date, day_no, asian_high, asian_low, atr,
      asian_pct_atr, day_type, day_char, trades_taken, notes
    )
    select
      auth.uid(), p_symbol,
      (r->>'date')::date,
      (r->>'day_no')::integer,
      (r->>'asian_high')::numeric, (r->>'asian_low')::numeric, (r->>'atr')::numeric,
      (r->>'asian_pct_atr')::numeric, r->>'day_type', r->>'day_char',
      (r->>'trades_taken')::integer, r->>'notes'
    from jsonb_array_elements(p_rows) as r;
  end if;
end;
$$;

grant execute on function public.replace_day_log(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- session_board_days: replaces the session-board:<date> localStorage key.
-- One row per (user, symbol, date) -- resets are just a new row on the
-- next Beirut date, same as the old key rollover.
-- ---------------------------------------------------------------------
create table public.session_board_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  symbol text not null default 'XAUUSD',

  date date not null,
  asian_high numeric,
  asian_low numeric,
  atr numeric,
  london_high numeric,
  london_low numeric,
  vwap numeric,
  price numeric,
  day_char text,
  checks jsonb not null default '{}'::jsonb,  -- { [checklistItemId]: boolean }
  trades integer not null default 0,
  losses integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, symbol, date)
);

grant select, insert, update, delete on public.session_board_days to authenticated;

create trigger session_board_days_set_updated_at
  before update on public.session_board_days
  for each row execute function public.set_updated_at();

alter table public.session_board_days enable row level security;

create policy "session_board_days_owner_all" on public.session_board_days
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
