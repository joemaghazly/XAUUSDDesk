import { useEffect, useRef, useState } from 'react';
import { getMarketQuote, subscribeMarketQuote } from '../db/marketQuotes';
import type { MarketQuote } from './types';

// Reads the market_quotes cache the poll-market-data Edge Function keeps
// updated, then subscribes to Realtime for live changes -- the frontend
// never calls xaus.com (or any provider) directly. Falls back to a plain
// refetch if Realtime isn't reachable; the subscription is best-effort.
export function useMarketData(symbol: string) {
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!hasLoadedOnce.current) setLoading(true);
    getMarketQuote(symbol)
      .then((q) => { if (!cancelled) setQuote(q); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (!cancelled) { hasLoadedOnce.current = true; setLoading(false); } });

    const unsubscribe = subscribeMarketQuote(symbol, (q) => setQuote(q));
    return () => { cancelled = true; unsubscribe(); };
  }, [symbol]);

  return { quote, loading, error };
}
