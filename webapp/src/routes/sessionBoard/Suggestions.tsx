import type { Trade } from '../../lib/db/trades';
import { agg, cls, fmt, n } from '../../lib/analytics';

interface StatCardProps { title: string; list: Trade[]; note: string }

function StatCard({ title, list, note }: StatCardProps) {
  const a = agg(list);
  const badge = a.n === 0 ? <span className="badge none">No trades</span>
    : a.n < 5 ? <span className="badge thin">Thin · n={a.n}</span>
      : <span className="badge">n={a.n}</span>;
  return (
    <div className="scard">
      <div className="scard-h"><span className="scard-t">{title}</span>{badge}</div>
      {a.n > 0 && (
        <div className="sstats">
          <div><div className="sstat-k">Avg pts</div><div className={`sstat-v ${cls(a.avg)}`}>{fmt(a.avg)}</div></div>
          <div><div className="sstat-k">Avg R</div><div className={`sstat-v ${cls(a.avgR)}`}>{fmt(a.avgR, 2)}</div></div>
          <div><div className="sstat-k">Win rate</div><div className="sstat-v">{a.wr.toFixed(0)}%</div></div>
        </div>
      )}
      {note && <div className="snote">{note}</div>}
    </div>
  );
}

interface Props {
  trades: Trade[];
  loaded: boolean;
  dayTypeLabel: string | null;
  dayChar: string | null;
  tradesTakenToday: number;
}

export function Suggestions({ trades, loaded, dayTypeLabel, dayChar, tradesTakenToday }: Props) {
  const nextNo = tradesTakenToday + 1;

  return (
    <section className="sect">
      <div className="eye">From your own log</div>
      <h2>Suggestions</h2>
      <p className="lede">
        Descriptive, not predictive: these are stats pulled from your actual trade history, matched against what&rsquo;s
        entered above. Small samples stay marked thin — a pattern, not a forecast for today.
      </p>

      <div className="card">
        <h3 style={{ marginBottom: 6 }}>Trade history</h3>
        <p className="lede" style={{ marginTop: 6 }}>
          {loaded && trades.length
            ? `${trades.length} trades on file — shared with the Journal.`
            : 'No history loaded yet — import your journal workbook from the Journal\'s Data tab to power these cards.'}
        </p>
      </div>

      {loaded && trades.length > 0 && (
        <div className="sgrid">
          {dayTypeLabel ? (
            <StatCard
              title={`Today's read: ${dayTypeLabel}`}
              list={trades.filter((t) => t.dayType === dayTypeLabel)}
              note={`How ${dayTypeLabel}-classified days have gone before, by trade.`}
            />
          ) : (
            <StatCard title="Today's read" list={[]} note="Enter the Asian high/low/ATR above to match against this day type." />
          )}

          {dayChar ? (
            <StatCard
              title={dayChar}
              list={trades.filter((t) => t.dayChar === dayChar)}
              note={`Trades logged on days you later tagged ${dayChar}.`}
            />
          ) : (
            <StatCard title="Day character" list={[]} note="Tag it above once London or NY gives you a read." />
          )}

          <StatCard
            title={`If this is trade #${nextNo} today`}
            list={trades.filter((t) => n(t.tradeNo) === nextNo)}
            note={`How your historical trade #${nextNo} of the day has performed — the back end of the budget is often the weakest slot.`}
          />

          <StatCard title="London session" list={trades.filter((t) => t.session === 'London')} note="Compare against New York alongside it." />
          <StatCard title="New York session" list={trades.filter((t) => t.session === 'NY')} note="" />
        </div>
      )}
    </section>
  );
}
