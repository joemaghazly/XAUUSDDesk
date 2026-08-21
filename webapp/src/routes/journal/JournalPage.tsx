import { useEffect, useRef, useState } from 'react';
import type { PeriodMode, ViewMode } from '../../lib/analytics';
import { useJournalData } from './useJournalData';
import { OverviewView } from './OverviewView';
import { PeriodsView } from './PeriodsView';
import { DaysView } from './DaysView';
import { TradesView } from './TradesView';
import { DataView } from './DataView';

type Tab = 'home' | 'periods' | 'days' | 'trades' | 'data';
const TABS: Array<[Tab, string]> = [
  ['home', 'Overview'], ['periods', 'Periods'], ['days', 'Day log'], ['trades', 'Trades'], ['data', 'Import / export'],
];

export function JournalPage() {
  const { trades, days, loading, error, imported, importFile, clearStored } = useJournalData();
  const [tab, setTab] = useState<Tab>('home');
  const [view, setView] = useState<ViewMode>('daily');
  const [offset, setOffset] = useState(0);
  const [period, setPeriod] = useState<PeriodMode>('daily');
  const clock = trades.length ? `Beirut UTC+3 · ${trades.length} trades · ${days.length} days` : 'Beirut UTC+3 · no journal loaded';

  // Land on Import/export when there's nothing loaded yet, same as the
  // original -- but only on the initial load, not every time trades
  // happens to be empty (e.g. right after clearing the stored copy).
  const decidedInitialTab = useRef(false);
  useEffect(() => {
    if (loading || decidedInitialTab.current) return;
    decidedInitialTab.current = true;
    if (!trades.length) setTab('data');
  }, [loading, trades.length]);

  function goData() { setTab('data'); }
  function pickFile() {
    setTab('data');
    // DataView owns the actual <input type=file>; switching tabs is enough
    // to surface the drop zone the same way the original "Choose workbook"
    // button on the empty state did.
  }

  return (
    <div className="wrap journal-page">
      <header className="journal-top">
        <div className="journal-toprow">
          <div className="journal-mark"><span className="ingot" />XAU/USD Journal</div>
          <div className="journal-clock">{clock}</div>
        </div>
        <nav className="journal-nav">
          {TABS.map(([id, label]) => (
            <button key={id} data-on={tab === id ? '1' : '0'} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
      </header>

      {loading && <p className="lede" style={{ marginTop: 20 }}>Loading your trade history…</p>}
      {error && (
        <div className="note bad" style={{ marginTop: 20 }}>
          Couldn&rsquo;t load your journal: {error}
        </div>
      )}

      {!loading && !error && (
        <main>
          {tab === 'home' && (
            <OverviewView
              trades={trades} days={days} view={view} offset={offset}
              onViewChange={(v) => { setView(v); setOffset(0); }}
              onOlder={() => setOffset((o) => o + 1)}
              onNewer={() => setOffset((o) => Math.max(0, o - 1))}
              onPick={pickFile} onGoData={goData}
            />
          )}
          {tab === 'periods' && (
            <PeriodsView trades={trades} mode={period} onModeChange={setPeriod} onPick={pickFile} onGoData={goData} />
          )}
          {tab === 'days' && <DaysView trades={trades} days={days} onPick={pickFile} onGoData={goData} />}
          {tab === 'trades' && <TradesView trades={trades} onPick={pickFile} onGoData={goData} />}
          {tab === 'data' && (
            <DataView trades={trades} days={days} imported={imported} onImportFile={importFile} onClear={clearStored} />
          )}
        </main>
      )}

      <div className="journal-foot">
        Reads your workbook in the browser — nothing is uploaded. Your trade history is stored in your account and synced across devices.<br />
        Splits and period tables describe what has already happened. They do not forecast the next trade.
      </div>
    </div>
  );
}
