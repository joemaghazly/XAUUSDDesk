import type { Trade } from '../../lib/db/trades';
import type { DayLogEntry } from '../../lib/db/dayLog';
import { cls, fmt, has, n, periods } from '../../lib/analytics';
import { NoData } from './pieces';

interface Props {
  trades: Trade[];
  days: DayLogEntry[];
  onPick: () => void;
  onGoData: () => void;
}

export function DaysView({ trades, days, onPick, onGoData }: Props) {
  if (!days.length && !trades.length) return <NoData onPick={onPick} onGoData={onGoData} />;

  const P = Object.fromEntries(periods(trades, 'daily').map((p) => [p.key, p]));

  return (
    <section className="sect">
      <div className="eye">Sessions</div>
      <h2>Day log</h2>
      <p className="lede">Straight from the Day Log sheet, with the day&rsquo;s logged trade result added alongside what the sheet recorded.</p>

      {!days.length ? (
        <p className="lede">The workbook had no Day Log sheet.</p>
      ) : (
        days.slice().reverse().map((d) => {
          const p = P[d.date];
          return (
            <div className="card" key={d.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    {new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    {has(d.dayNo) && <span className="dimc" style={{ fontSize: 13 }}> · Day {d.dayNo}</span>}
                  </h3>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {has(d.dayType) && <span className="jtag">{d.dayType}</span>}
                    {has(d.dayChar) && <span className="jtag">{d.dayChar}</span>}
                    {has(d.atr) && <span className="jtag">ATR {n(d.atr).toFixed(2)}</span>}
                    {has(d.asianPctATR) && <span className="jtag">Asian {(n(d.asianPctATR) * 100).toFixed(0)}% ATR</span>}
                    <span className="jtag">{has(d.tradesTaken) ? d.tradesTaken : 0} trades</span>
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 24, textAlign: 'right' }}>
                  <span className={p ? cls(p.pts) : 'dimc'}>{p ? `${fmt(p.pts)} pts` : '—'}</span>
                  {p && <div className="dv-sub" style={{ textAlign: 'right' }}>{fmt(p.R, 2)}R</div>}
                </div>
              </div>
              {has(d.notes) && <div className="daynote">{d.notes}</div>}
            </div>
          );
        })
      )}
    </section>
  );
}
