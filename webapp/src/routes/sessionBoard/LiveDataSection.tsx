import { useState } from 'react';
import type { SessionBoardPatch } from '../../lib/db/sessionBoard';
import { useMarketData } from '../../lib/marketdata/useMarketData';
import { getMarketQuote } from '../../lib/db/marketQuotes';

interface Props {
  onPatch: (p: SessionBoardPatch) => void;
}

// Replaces the original's "Fetch live" buttons, which called xaus.com
// directly from the browser. Now poll-market-data (a Supabase Edge
// Function) does the polling server-side and this just reads the cache
// it keeps updated -- see MarketDataProvider in lib/marketdata/types.ts
// for why the provider abstraction lives there, not here. Same caution as
// before: a computed Asian range or ATR is a suggestion with an explicit
// Apply button, never written into the day's fields automatically.
export function LiveDataSection({ onPatch }: Props) {
  const { quote, loading, error } = useMarketData('XAUUSD');
  const [refreshing, setRefreshing] = useState(false);

  async function refreshNow() {
    setRefreshing(true);
    try { await getMarketQuote('XAUUSD'); } finally { setRefreshing(false); }
  }

  if (loading) return null;

  return (
    <section className="sect">
      <div className="eye">Live · xaus.com</div>
      <h2>Live read</h2>
      <p className="lede">
        Indicative mid-market, not a tradable quote — polled server-side every 30–60s. Nothing here writes into the
        fields above automatically; use Apply once you&rsquo;ve checked it against the chart.
      </p>
      <div className="card">
        {error && <div className="note bad">Live read unavailable: {error}</div>}
        {!error && !quote && <div className="hint">No live read cached yet — the polling function may not be deployed.</div>}
        {quote && (
          <>
            <div className="hint">
              Source: {quote.provider} · last updated {new Date(quote.updatedAt).toLocaleTimeString()}
            </div>
            <div className="acts" style={{ marginTop: 10, justifyContent: 'flex-start' }}>
              {quote.spotPrice != null && (
                <button className="btn g" onClick={() => onPatch({ price: quote.spotPrice })}>
                  Use live price {quote.spotPrice.toFixed(2)}
                </button>
              )}
              {quote.asianHigh != null && quote.asianLow != null && (
                <button className="btn g" onClick={() => onPatch({ asianHigh: quote.asianHigh, asianLow: quote.asianLow })}>
                  Use Asian {quote.asianLow.toFixed(2)}–{quote.asianHigh.toFixed(2)} (n={quote.asianSampleCount})
                </button>
              )}
              {quote.atr14 != null && (
                <button className="btn g" onClick={() => onPatch({ atr: quote.atr14 })}>
                  Use ATR {quote.atr14.toFixed(2)}
                </button>
              )}
              <button className="btn g" onClick={refreshNow} disabled={refreshing}>
                {refreshing ? 'Refreshing…' : 'Refresh now'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
