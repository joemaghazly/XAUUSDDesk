import type { Trade } from '../../lib/db/trades';
import { cls, fmt, periods, type PeriodMode } from '../../lib/analytics';
import { Bar, Hf, NoData } from './pieces';

const MODES: Array<[PeriodMode, string]> = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']];

interface Props {
  trades: Trade[];
  mode: PeriodMode;
  onModeChange: (m: PeriodMode) => void;
  onPick: () => void;
  onGoData: () => void;
}

export function PeriodsView({ trades, mode, onModeChange, onPick, onGoData }: Props) {
  if (!trades.length) return <NoData onPick={onPick} onGoData={onGoData} />;

  const P = periods(trades, mode);
  const green = P.filter((p) => p.pts > 0).length;
  const ns = Math.max(1, ...P.map((p) => Math.abs(p.pts)));
  const best = P.slice().sort((a, b) => b.pts - a.pts)[0];
  const worst = P.slice().sort((a, b) => a.pts - b.pts)[0];
  const avgP = P.reduce((s, p) => s + p.pts, 0) / P.length;
  const noun = mode === 'daily' ? 'days' : mode === 'weekly' ? 'weeks' : 'months';

  return (
    <section className="sect">
      <div className="eye">Breakdown</div>
      <h2>By period</h2>
      <p className="lede">
        The same trades grouped three ways. Daily is a discipline check — one day of points is noise. Weekly is the
        honest unit for judging a change to the framework. Monthly is where variance starts washing out.
      </p>
      <div className="pills">
        {MODES.map(([id, label]) => (
          <button key={id} className="pill" data-on={mode === id ? '1' : '0'} onClick={() => onModeChange(id)}>{label}</button>
        ))}
      </div>

      <div className="j-hero-foot" style={{ border: '1px solid var(--rule2)', borderRadius: 6, marginTop: 18, background: 'var(--panel)' }}>
        <Hf k={`Green ${noun}`} v={`${green} / ${P.length}`} c={green * 2 >= P.length ? 'pos' : 'neg'} />
        <Hf k={`Avg per ${noun.slice(0, -1)}`} v={fmt(avgP)} c={cls(avgP)} />
        <Hf k="Best" v={fmt(best.pts)} c="pos" />
        <Hf k="Worst" v={fmt(worst.pts)} c={cls(worst.pts)} />
      </div>

      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>{mode === 'daily' ? 'Day' : mode === 'weekly' ? 'Week of' : 'Month'}</th>
              {mode !== 'daily' && <th className="right">Days</th>}
              <th className="right">Trades</th>
              <th className="right">W/L</th>
              <th className="right">Win%</th>
              <th>Net</th>
              <th className="right">Points</th>
              <th className="right">R</th>
              <th className="right">Avg pts</th>
              <th className="right">Best</th>
              <th className="right">Worst</th>
              <th className="right">Breaks</th>
              {mode === 'daily' && <th>Budget</th>}
            </tr>
          </thead>
          <tbody>
            {P.slice().reverse().map((p) => {
              const over = p.n > 3, overL = p.losses > 2;
              return (
                <tr key={p.key}>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>{p.label}</td>
                  {mode !== 'daily' && <td className="mono right">{p.days}</td>}
                  <td className="mono right">{p.n}</td>
                  <td className="mono right"><span className="pos">{p.wins}</span><span className="dimc">/</span><span className="neg">{p.losses}</span></td>
                  <td className="mono right">{p.wr.toFixed(0)}%</td>
                  <td style={{ minWidth: 110 }}><Bar v={p.pts} scale={ns} /></td>
                  <td className={`mono right ${cls(p.pts)}`}>{fmt(p.pts)}</td>
                  <td className={`mono right ${cls(p.R)}`}>{fmt(p.R, 2)}</td>
                  <td className={`mono right ${cls(p.avg)}`}>{fmt(p.avg)}</td>
                  <td className="mono right pos">{fmt(p.best)}</td>
                  <td className={`mono right ${cls(p.worst)}`}>{fmt(p.worst)}</td>
                  <td className={`mono right ${p.broken ? 'neg' : 'dimc'}`}>{p.broken}</td>
                  {mode === 'daily' && (
                    <td className="mono">
                      {over || overL
                        ? <span className="neg">{over ? 'over count' : ''}{over && overL ? ' · ' : ''}{overL ? 'over losses' : ''}</span>
                        : <span className="dimc">held</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {mode !== 'daily' && (
        <p className="lede">A {mode === 'weekly' ? 'week' : 'month'} with fewer than about ten trades tells you more about variance than about the framework.</p>
      )}
    </section>
  );
}
