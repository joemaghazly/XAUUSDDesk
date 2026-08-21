import { useRef, useState, type DragEvent } from 'react';
import type { Trade } from '../../lib/db/trades';
import type { DayLogEntry } from '../../lib/db/dayLog';
import type { ImportedMeta } from './useJournalData';
import { csvText, downloadText, exportXlsx, copyText } from '../../lib/xlsx';

interface Props {
  trades: Trade[];
  days: DayLogEntry[];
  imported: ImportedMeta | null;
  onImportFile: (file: File) => Promise<{ ok: boolean; message: string }>;
  onClear: () => Promise<void>;
}

export function DataView({ trades, days, imported, onImportFile, onClear }: Props) {
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'bad' } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const res = await onImportFile(file);
    setMsg({ text: res.message, kind: res.ok ? 'ok' : 'bad' });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function xlsxExport() {
    try {
      exportXlsx(trades, days);
      setMsg({ text: 'Exported XAUUSD_Trading_Journal_export.xlsx to your downloads.', kind: 'ok' });
    } catch (err) {
      setMsg({ text: 'Export failed: ' + (err instanceof Error ? err.message : String(err)), kind: 'bad' });
    }
  }
  function csvExport() {
    downloadText('XAUUSD_Trade_Log.csv', csvText(trades), 'text/csv');
    setMsg({ text: 'Saved XAUUSD_Trade_Log.csv to your downloads.', kind: 'ok' });
  }
  async function csvCopy() {
    const ok = await copyText(csvText(trades));
    setMsg({ text: ok ? 'CSV copied.' : 'Copy blocked. Select the text and copy manually.', kind: ok ? 'ok' : 'bad' });
  }

  return (
    <section className="sect">
      <div className="eye">Workbook</div>
      <h2>Import and export</h2>
      <p className="lede">
        The spreadsheet is the source of truth. Import reads the <b>Trade Log</b> and <b>Day Log</b> sheets by their
        column headers, so added columns and reordered ones are both fine — only renamed headers would break the match.
      </p>

      {msg && (
        <div className={`note ${msg.kind === 'bad' ? 'bad' : 'ok'}`}>
          <span>{msg.text}</span>
          <button className="link" onClick={() => setMsg(null)}>Dismiss</button>
        </div>
      )}

      <div
        className={`drop${dragOver ? ' over' : ''}`}
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={onDrop}
      >
        <h3>Drop your workbook here</h3>
        <p>XAUUSD_Trading_Journal.xlsx, or any workbook with a Trade Log sheet. Nothing is uploaded anywhere — the file is read inside your browser.</p>
        <button className="btn" onClick={() => fileInputRef.current?.click()}>Choose file</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xlsm,.xls"
          style={{ position: 'fixed', left: -9999 }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {imported && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Last import</h3>
          <div className="mono" style={{ lineHeight: 2, marginTop: 8 }}>
            {imported.file}<br />
            {imported.trades} trades · {imported.days} day records
            {imported.skipped ? <> · <span className="neg">{imported.skipped} rows skipped (no valid date)</span></> : null}<br />
            <span className="dimc">Sheets seen: {imported.sheets}</span><br />
            <span className="dimc">{imported.when}</span>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Export</h3>
        <p className="lede">
          The Excel export writes a Trade Log sheet with your exact column order, plus the Day Log. It carries data
          only — your formulas, formatting and the Dashboard and Framework tabs are not reproduced, so treat it as
          rows to paste into your workbook rather than a replacement for it.
        </p>
        <div className="acts l">
          <button className="btn" onClick={xlsxExport}>Download Excel</button>
          <button className="btn g" onClick={csvExport}>Download CSV</button>
          <button className="btn g" onClick={csvCopy}>Copy CSV text</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Stored copy</h3>
        <p className="lede">Your account keeps the last import so the dashboard still loads when you come back. Re-import after each trading day to refresh it.</p>
        {trades.length ? (
          confirmClear ? (
            <div className="acts l">
              <button className="btn d" onClick={async () => { setConfirmClear(false); await onClear(); }}>Yes, clear it</button>
              <button className="btn g" onClick={() => setConfirmClear(false)}>Keep it</button>
            </div>
          ) : (
            <div className="acts l"><button className="btn d" onClick={() => setConfirmClear(true)}>Clear stored copy</button></div>
          )
        ) : (
          <p className="lede dimc">Nothing stored.</p>
        )}
      </div>
    </section>
  );
}
