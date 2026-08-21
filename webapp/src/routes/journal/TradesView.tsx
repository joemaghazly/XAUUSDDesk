import type { Trade } from '../../lib/db/trades';
import { cls, fmt, has, n, pts, R, sorted } from '../../lib/analytics';
import { NoData } from './pieces';

interface Props {
  trades: Trade[];
  onPick: () => void;
  onGoData: () => void;
}

export function TradesView({ trades, onPick, onGoData }: Props) {
  if (!trades.length) return <NoData onPick={onPick} onGoData={onGoData} />;

  const rows = sorted(trades).slice().reverse();

  return (
    <section className="sect">
      <div className="eye">Record</div>
      <h2>All trades</h2>
      <p className="lede">Every row from the Trade Log, newest first. Hover a row to read its notes below.</p>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Date</th><th className="right">#</th><th>Session</th><th>Day type</th><th>Character</th>
              <th>Setup</th><th>Dir</th><th className="right">RSI</th><th className="right">Entry</th>
              <th className="right">SL</th><th className="right">B1</th><th className="right">B2</th>
              <th className="right">Total</th><th className="right">R</th><th>Rule</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const tot = pts(t);
              const broke = String(t.ruleBroken || '').toUpperCase().indexOf('Y') === 0;
              return (
                <tr key={t.id} title={String(t.notes || '').slice(0, 300)}>
                  <td className="mono">{t.date}</td>
                  <td className="mono right">{t.tradeNo}</td>
                  <td>{has(t.session) ? <span className="jtag">{t.session}</span> : <span className="dimc">—</span>}</td>
                  <td style={{ fontSize: 12 }}>{t.dayType}</td>
                  <td style={{ fontSize: 12 }}>{t.dayChar || '—'}</td>
                  <td style={{ fontSize: 12 }}>{t.setup}</td>
                  <td style={{ fontSize: 12 }}>{t.direction}</td>
                  <td className="mono right">{has(t.rsi) ? n(t.rsi).toFixed(0) : '—'}</td>
                  <td className="mono right">{has(t.entry1) ? n(t.entry1).toFixed(2) : '—'}</td>
                  <td className="mono right">{has(t.sl) ? n(t.sl).toFixed(2) : '—'}</td>
                  <td className={`mono right ${cls(n(t.res1))}`}>{fmt(n(t.res1), 2)}</td>
                  <td className={`mono right ${cls(n(t.res2))}`}>{fmt(n(t.res2), 2)}</td>
                  <td className={`mono right ${cls(tot)}`}>{fmt(tot, 2)}</td>
                  <td className={`mono right ${cls(R(t))}`}>{fmt(R(t), 2)}</td>
                  <td>{broke ? <span className="jtag bad">broken</span> : <span className="dimc">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
