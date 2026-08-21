import { useEffect, useState } from 'react';
import { listTrades, type Trade } from '../../lib/db/trades';

// Suggestion cards need the trade history but nothing else Journal's
// useJournalData carries (import, day log, export) -- shares the same
// underlying trades table, just a leaner read.
export function useSessionBoardTrades(symbol: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listTrades(symbol)
      .then((t) => { if (!cancelled) setTrades(t); })
      .catch(() => { /* suggestion cards just show as empty; the Journal tab surfaces the real error */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [symbol]);

  return { trades, loaded };
}
