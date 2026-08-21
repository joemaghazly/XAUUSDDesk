// The provider abstraction lives on the polling side (a Supabase Edge
// Function -- see supabase/functions/poll-market-data/), not in the
// browser: the frontend only ever reads the cached row a provider last
// wrote, via useMarketData. That's what lets a future streaming or paid
// provider replace xaus.com later without the frontend or its read path
// changing at all -- only what writes into market_quotes changes.

export interface Quote {
  price: number;
  asOfMs: number;
}

export interface AsianRangeEstimate {
  high: number;
  low: number;
  sampleCount: number;
}

export interface MarketDataProvider {
  id: string;
  fetchSpot(symbol: string): Promise<Quote | null>;
  // Asian range 01:00-10:00 Beirut is the reference range the whole
  // trading framework keys off -- see PHASES in lib/beirut.ts. This is a
  // read of *today's* range, not a historical one.
  fetchAsianRange(symbol: string): Promise<AsianRangeEstimate | null>;
  fetchDailyATR(symbol: string, period?: number): Promise<number | null>;
}

// One row per symbol in the `market_quotes` cache table -- what the
// frontend actually reads. See supabase/migrations for the schema.
export interface MarketQuote {
  symbol: string;
  provider: string;
  spotPrice: number | null;
  spotAsOf: string | null; // ISO timestamp
  asianHigh: number | null;
  asianLow: number | null;
  asianSampleCount: number | null;
  atr14: number | null;
  updatedAt: string; // ISO timestamp
}
