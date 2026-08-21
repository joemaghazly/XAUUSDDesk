// Free fallback provider, ported from session-board.html's fetchLive/
// fetchVwapPrice -- same endpoints, same "indicative mid-market, not a
// tradable quote" caveat. No API key needed. This module is meant to run
// server-side now (inside the poll-market-data Edge Function), not from
// the browser -- see MarketDataProvider in ./types.ts for why.
import type { MarketDataProvider, Quote, AsianRangeEstimate } from './types';
import { computeAsianFromIntraday, computeATR14, type HistoryPoint, type IntradayPoint } from './xausMath';

const LIVE_BASE = 'https://xaus.com/api/v1/';

// Symbol is currently ignored (xaus.com's intraday endpoint always wants
// "xau") -- kept as a parameter so the interface doesn't need to change
// when a real multi-symbol provider replaces this one.
export function createXausComProvider(fetchImpl: typeof fetch = fetch): MarketDataProvider {
  return {
    id: 'xaus.com',

    async fetchSpot(): Promise<Quote | null> {
      const res = await fetchImpl(LIVE_BASE + 'spot');
      if (!res.ok) throw new Error(`xaus.com spot returned ${res.status}`);
      const spot = await res.json();
      if (!spot || typeof spot.spot_usd_oz !== 'number') return null;
      return { price: spot.spot_usd_oz, asOfMs: Date.now() };
    },

    async fetchAsianRange(): Promise<AsianRangeEstimate | null> {
      const res = await fetchImpl(LIVE_BASE + 'intraday?symbol=xau&hours=24');
      if (!res.ok) throw new Error(`xaus.com intraday returned ${res.status}`);
      const body = await res.json();
      const points: IntradayPoint[] | undefined = Array.isArray(body?.points) ? body.points : undefined;
      const est = computeAsianFromIntraday(points);
      return est ? { high: est.high, low: est.low, sampleCount: est.n } : null;
    },

    async fetchDailyATR(): Promise<number | null> {
      const res = await fetchImpl(LIVE_BASE + 'history');
      if (!res.ok) throw new Error(`xaus.com history returned ${res.status}`);
      const body = await res.json();
      const points: HistoryPoint[] | undefined = Array.isArray(body?.points) ? body.points : undefined;
      return computeATR14(points);
    },
  };
}
