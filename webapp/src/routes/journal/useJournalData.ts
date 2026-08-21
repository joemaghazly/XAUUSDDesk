import { useCallback, useEffect, useRef, useState } from 'react';
import { listTrades, replaceTrades, clearTrades, type Trade } from '../../lib/db/trades';
import { listDayLog, replaceDayLog, type DayLogEntry } from '../../lib/db/dayLog';
import { parseWorkbook } from '../../lib/xlsx';

const SYMBOL = 'XAUUSD';

export interface ImportedMeta {
  file: string; when: string; trades: number; days: number; skipped: number; sheets: string;
}

export function useJournalData() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [days, setDays] = useState<DayLogEntry[]>([]);
  // `loading` gates the page's initial "no data yet" state only. A refresh
  // triggered later (after import/clear) must not flip it back to true --
  // that would unmount <main> in JournalPage and, with it, DataView's own
  // local state (the just-set success message, an in-progress confirm
  // prompt), right when the user needs to see the result of what they did.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<ImportedMeta | null>(null);
  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    setError(null);
    try {
      const [t, d] = await Promise.all([listTrades(SYMBOL), listDayLog(SYMBOL)]);
      setTrades(t);
      setDays(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Matches the original app's import semantics: a workbook replaces the
  // whole stored set, it doesn't merge with what's already there.
  const importFile = useCallback(async (file: File): Promise<{ ok: boolean; message: string }> => {
    let parsed;
    try {
      const buf = await file.arrayBuffer();
      parsed = parseWorkbook(buf, SYMBOL);
    } catch (err) {
      return { ok: false, message: 'Import failed: ' + (err instanceof Error ? err.message : String(err)) };
    }
    if (!parsed.trades.length) {
      return { ok: false, message: 'No trade rows found. Expecting a sheet named Trade Log with a Date column in its header row.' };
    }
    try {
      await replaceTrades(SYMBOL, parsed.trades);
      await replaceDayLog(SYMBOL, parsed.days);
    } catch (err) {
      return { ok: false, message: 'Import failed while saving: ' + (err instanceof Error ? err.message : String(err)) };
    }
    setImported({
      file: file.name, when: new Date().toLocaleString(),
      trades: parsed.trades.length, days: parsed.days.length, skipped: parsed.skipped, sheets: parsed.sheets,
    });
    await refresh();
    return { ok: true, message: `Imported ${parsed.trades.length} trades and ${parsed.days.length} day records from ${file.name}.` };
  }, [refresh]);

  const clearStored = useCallback(async (): Promise<void> => {
    await clearTrades(SYMBOL);
    await replaceDayLog(SYMBOL, []);
    setImported(null);
    await refresh();
  }, [refresh]);

  return { trades, days, loading, error, imported, refresh, importFile, clearStored };
}
