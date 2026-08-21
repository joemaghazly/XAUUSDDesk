-- Market data cache: one row per symbol, continuously overwritten by the
-- poll-market-data Edge Function (see supabase/functions/poll-market-data).
-- Unlike trades/day_log/session_board_days this is not per-user data --
-- it's the same shared market read for everyone, so there is no user_id
-- and no owner-scoped RLS policy. The frontend only ever reads this table;
-- only the Edge Function (running with the service_role key, which
-- bypasses RLS entirely) writes to it, so there is deliberately no
-- INSERT/UPDATE/DELETE policy for the authenticated role below.

create table public.market_quotes (
  symbol text primary key,
  provider text not null,
  spot_price numeric,
  spot_as_of timestamptz,
  asian_high numeric,
  asian_low numeric,
  asian_sample_count integer,
  atr14 numeric,
  updated_at timestamptz not null default now()
);

alter table public.market_quotes enable row level security;

create policy "market_quotes_read_all_authenticated" on public.market_quotes
  for select
  to authenticated
  using (true);

grant select on public.market_quotes to authenticated;

-- Realtime: lets useMarketData subscribe to live updates instead of
-- polling the REST endpoint itself from the browser.
alter publication supabase_realtime add table public.market_quotes;
