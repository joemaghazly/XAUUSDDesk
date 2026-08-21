// Deno Edge Function. Polls the active MarketDataProvider (xaus.com for
// now -- see xausProvider.ts) and upserts market_quotes. SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided automatically by the platform for
// every deployed function; no secret needs to be set for those two. The
// service role key is required here specifically because it bypasses RLS
// -- market_quotes intentionally has no INSERT/UPDATE policy for anyone
// but this function (see the migration).
//
// "30-60s polling" doesn't map onto pg_cron's schedule, whose floor is one
// minute -- so instead of a 30s cron (which doesn't exist), this loops
// internally for a bounded budget, sleeping POLL_INTERVAL_MS between
// iterations, and a 2-minute cron re-invokes it so the loop budget always
// gets refreshed before it would run out. Tune MAX_LOOP_MS down if your
// Supabase plan's function timeout is shorter than this assumes.
//
// UNEXECUTED: this sandbox has neither Docker nor a Deno runtime, so this
// function has not been run anywhere, only reviewed. Test with
// `supabase functions serve` before relying on it.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchXausReading } from './xausProvider.ts';

const SYMBOLS = ['XAUUSD']; // core loop only -- DXY/US10Y/NASDAQ etc. come later, separately
const POLL_INTERVAL_MS = 45_000;
const MAX_LOOP_MS = 100_000; // stay comfortably under a 150s function timeout

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set' }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const startedAt = Date.now();
  let iterations = 0;
  const errors: string[] = [];

  while (Date.now() - startedAt < MAX_LOOP_MS) {
    for (const symbol of SYMBOLS) {
      try {
        const reading = await fetchXausReading();
        const { error } = await supabase.from('market_quotes').upsert({
          symbol,
          provider: 'xaus.com',
          spot_price: reading.spotPrice,
          spot_as_of: reading.spotPrice != null ? new Date().toISOString() : null,
          asian_high: reading.asianHigh,
          asian_low: reading.asianLow,
          asian_sample_count: reading.asianSampleCount,
          atr14: reading.atr14,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'symbol' });
        if (error) errors.push(`${symbol}: ${error.message}`);
      } catch (err) {
        errors.push(`${symbol}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    iterations++;
    const remaining = MAX_LOOP_MS - (Date.now() - startedAt);
    if (remaining <= POLL_INTERVAL_MS) break;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return new Response(JSON.stringify({ iterations, errors, tookMs: Date.now() - startedAt }), {
    headers: { 'content-type': 'application/json' },
  });
});
