import { useCallback, useEffect, useRef, useState } from 'react';
import { beirutDateParts } from '../../lib/beirut';
import {
  getSessionBoardDay, upsertSessionBoardDay, resetSessionBoardDay,
  type SessionBoardDay, type SessionBoardPatch,
} from '../../lib/db/sessionBoard';

const DEBOUNCE_MS = 500;

// Replaces the session-board:<date> localStorage key: one row per
// (symbol, Beirut date), same rollover behavior -- when the Beirut date
// changes while the page is open, this switches to (creating if needed)
// the new date's row, same as the original re-keying to a fresh `day`
// object at midnight Beirut time.
export function useSessionBoardDay(symbol: string) {
  const [date, setDate] = useState(() => beirutDateParts().date);
  const [day, setDay] = useState<SessionBoardDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);
  const pendingPatch = useRef<SessionBoardPatch>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (d: string) => {
    if (!hasLoadedOnce.current) setLoading(true);
    setError(null);
    try {
      let row = await getSessionBoardDay(symbol, d);
      if (!row) row = await upsertSessionBoardDay(symbol, d, {});
      setDay(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { load(date); }, [date, load]);

  // Check for the Beirut date rollover once a minute -- no need for
  // per-second precision here, the phase clock elsewhere handles that.
  useEffect(() => {
    const id = setInterval(() => {
      const today = beirutDateParts().date;
      setDate((prev) => (prev !== today ? today : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const flushPatch = useCallback(() => {
    if (debounceTimer.current) { clearTimeout(debounceTimer.current); debounceTimer.current = null; }
    const patch = pendingPatch.current;
    pendingPatch.current = {};
    if (Object.keys(patch).length === 0) return;
    upsertSessionBoardDay(symbol, date, patch).catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, [symbol, date]);

  // Optimistic + debounced: the UI updates immediately, the network write
  // waits for a pause in typing so free-text fields (Asian high/low/ATR,
  // VWAP, price) don't hit Supabase on every keystroke. Discrete actions
  // (checklist ticks, budget steppers, day-character pills) should call
  // patchNow instead.
  const patch = useCallback((p: SessionBoardPatch) => {
    setDay((prev) => (prev ? { ...prev, ...p } : prev));
    pendingPatch.current = { ...pendingPatch.current, ...p };
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flushPatch, DEBOUNCE_MS);
  }, [flushPatch]);

  const patchNow = useCallback(async (p: SessionBoardPatch) => {
    setDay((prev) => (prev ? { ...prev, ...p } : prev));
    pendingPatch.current = { ...pendingPatch.current, ...p };
    flushPatch();
  }, [flushPatch]);

  const reset = useCallback(async () => {
    if (debounceTimer.current) { clearTimeout(debounceTimer.current); debounceTimer.current = null; }
    pendingPatch.current = {};
    const updated = await resetSessionBoardDay(symbol, date);
    setDay(updated);
  }, [symbol, date]);

  // Flush any pending debounced write when the component unmounts (e.g.
  // navigating away right after typing) so it isn't silently dropped.
  useEffect(() => () => flushPatch(), [flushPatch]);

  return { date, day, loading, error, patch, patchNow, reset };
}
