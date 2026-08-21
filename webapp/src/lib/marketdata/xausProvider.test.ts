import { describe, expect, it, vi } from 'vitest';
import { createXausComProvider } from './xausProvider';
import { beirutHourDate } from './xausMath';

// See xausMath.test.ts for why this doesn't just add a fixed "+3" -- Beirut
// is only UTC+3 during DST (roughly March-October); January is UTC+2.
function beirutWallTimeToMs(dateStr: string, hour: number, minute: number): number {
  let guess = Date.parse(`${dateStr}T00:00:00Z`) + (hour - 2) * 3600_000 + minute * 60_000;
  for (let i = 0; i < 4; i++) {
    const got = beirutHourDate(guess);
    if (got.date === dateStr && got.hour === hour) return guess;
    const gotMs = Date.parse(`${got.date}T00:00:00Z`) + got.hour * 3600_000;
    const wantMs = Date.parse(`${dateStr}T00:00:00Z`) + hour * 3600_000;
    guess += wantMs - gotMs;
  }
  throw new Error(`could not resolve Beirut wall time ${dateStr} ${hour}:${minute}`);
}

function fakeFetch(responses: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    for (const [path, body] of Object.entries(responses)) {
      if (url.includes(path)) return { ok: true, status: 200, json: async () => body } as Response;
    }
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  });
}

describe('createXausComProvider', () => {
  it('fetchSpot reads spot_usd_oz from the spot endpoint', async () => {
    const fetchImpl = fakeFetch({ 'api/v1/spot': { spot_usd_oz: 4066.85 } });
    const provider = createXausComProvider(fetchImpl as unknown as typeof fetch);
    const quote = await provider.fetchSpot('XAUUSD');
    expect(quote?.price).toBe(4066.85);
    expect(fetchImpl).toHaveBeenCalledWith('https://xaus.com/api/v1/spot');
  });

  it('fetchSpot returns null when the field is missing or the wrong type', async () => {
    const fetchImpl = fakeFetch({ 'api/v1/spot': { spot_usd_oz: '4066.85' } });
    const provider = createXausComProvider(fetchImpl as unknown as typeof fetch);
    expect(await provider.fetchSpot('XAUUSD')).toBeNull();
  });

  it('fetchAsianRange computes today\'s Asian range from the intraday endpoint', async () => {
    const now = beirutWallTimeToMs('2026-01-06', 15, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const asianPoint = (h: number, m: number, p: number) => ({ t: beirutWallTimeToMs('2026-01-06', h, m), p });
    const fetchImpl = fakeFetch({
      'api/v1/intraday': { points: [asianPoint(2, 0, 4050), asianPoint(6, 0, 4090)] },
    });
    const provider = createXausComProvider(fetchImpl as unknown as typeof fetch);
    const est = await provider.fetchAsianRange('XAUUSD');
    expect(est).toEqual({ high: 4090, low: 4050, sampleCount: 2 });
    expect(fetchImpl).toHaveBeenCalledWith('https://xaus.com/api/v1/intraday?symbol=xau&hours=24');
    vi.useRealTimers();
  });

  it('fetchDailyATR computes ATR14 from the history endpoint', async () => {
    const fetchImpl = fakeFetch({
      'api/v1/history': {
        points: [
          { d: '2026-01-01', h: 105, l: 95, c: 100 },
          { d: '2026-01-02', h: 110, l: 90, c: 100 },
        ],
      },
    });
    const provider = createXausComProvider(fetchImpl as unknown as typeof fetch);
    expect(await provider.fetchDailyATR('XAUUSD')).toBe(20);
  });

  it('throws when the endpoint returns a non-ok status, rather than silently caching garbage', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) } as Response));
    const provider = createXausComProvider(fetchImpl as unknown as typeof fetch);
    await expect(provider.fetchSpot('XAUUSD')).rejects.toThrow('500');
  });
});
