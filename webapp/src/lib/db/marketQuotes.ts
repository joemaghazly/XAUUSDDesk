import { supabase } from '../supabase';
import type { MarketQuote } from '../marketdata/types';

export interface MarketQuoteRow {
  symbol: string;
  provider: string;
  spot_price: number | null;
  spot_as_of: string | null;
  asian_high: number | null;
  asian_low: number | null;
  asian_sample_count: number | null;
  atr14: number | null;
  updated_at: string;
}

function fromRow(r: MarketQuoteRow): MarketQuote {
  return {
    symbol: r.symbol,
    provider: r.provider,
    spotPrice: r.spot_price,
    spotAsOf: r.spot_as_of,
    asianHigh: r.asian_high,
    asianLow: r.asian_low,
    asianSampleCount: r.asian_sample_count,
    atr14: r.atr14,
    updatedAt: r.updated_at,
  };
}

export async function getMarketQuote(symbol: string): Promise<MarketQuote | null> {
  const { data, error } = await supabase.from('market_quotes').select('*').eq('symbol', symbol).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as MarketQuoteRow) : null;
}

export function subscribeMarketQuote(symbol: string, onChange: (q: MarketQuote) => void) {
  const channel = supabase
    .channel(`market_quotes:${symbol}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'market_quotes', filter: `symbol=eq.${symbol}` },
      (payload) => {
        if (payload.new && 'symbol' in payload.new) onChange(fromRow(payload.new as MarketQuoteRow));
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
