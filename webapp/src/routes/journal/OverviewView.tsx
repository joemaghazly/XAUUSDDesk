import type { Trade } from '../../lib/db/trades';
import type { DayLogEntry } from '../../lib/db/dayLog';
import {
  agg, buckets, cleanPct, cls, comparisons, fmt, modeOf, perfStats, windowOf, type ViewMode,
} from '../../lib/analytics';
import { DvSide, Hf, NoData, Sparkline, GroupCard, OrderedCard } from './pieces';

const VIEWS: Array<[ViewMode, string]> = [
  ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'],
  ['yearly', 'Yearly'], ['ytd', 'YTD'], ['all', 'All time'],
];

const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TRADE_SEQ_ORDER = ['Trade 1', 'Trade 2', 'Trade 3', 'Trade 4', 'Trade 5', 'Trade 6'];

interface Props {
  trades: Trade[];
  days: DayLogEntry[];
  view: ViewMode;
  offset: number;
  onViewChange: (v: ViewMode) => void;
  onOlder: () => void;
  onNewer: () => void;
  onPick: () => void;
  onGoData: () => void;
}

function heroChips(v: ViewMode, win: NonNullable<ReturnType<typeof windowOf>>, a: ReturnType<typeof agg>, dayRec: DayLogEntry | undefined) {
  if (v === 'daily') {
    const chips: React.ReactNode[] = [];
    if (dayRec?.dayType) chips.push(<span className="chip" key="dt"><b>{dayRec.dayType}</b></span>);
    if (dayRec?.dayChar) chips.push(<span className="chip" key="dc"><b>{dayRec.dayChar}</b></span>);
    chips.push(<span className="chip" key="wl">W/L <b>{a.wins}/{a.losses}</b></span>);
    const br = win.list.filter((t) => String(t.ruleBroken || '').toUpperCase().indexOf('Y') === 0).length;
    chips.push(br
      ? <span className="chip" key="rb"><b className="neg">{br} rule break{br > 1 ? 's' : ''}</b></span>
      : <span className="chip" key="rb">Rules <b>clean</b></span>);
    return chips;
  }
  const chips: React.ReactNode[] = [];
  const cp = cleanPct(win.list);
  if (cp) chips.push(
    <span className="chip" key="cp">Clean rules <b className={cp.pct >= 80 ? 'pos' : cp.pct >= 60 ? '' : 'neg'}>{cp.pct.toFixed(0)}%</b> ({cp.clean}/{win.list.length})</span>,
  );
  const ch = modeOf(win.list, 'dayChar');
  if (ch) chips.push(<span className="chip" key="ch">Mostly <b>{ch.name}</b> ({ch.n} of {win.list.length})</span>);
  const dt = modeOf(win.list, 'dayType');
  if (dt) chips.push(<span className="chip" key="dt2">Day type <b>{dt.name}</b> ({dt.n})</span>);
  chips.push(<span className="chip" key="wl2">W/L <b>{a.wins}/{a.losses}</b></span>);
  return chips;
}

export function OverviewView({ trades, days, view, offset, onViewChange, onOlder, onNewer, onPick, onGoData }: Props) {
  if (!trades.length) return <NoData onPick={onPick} onGoData={onGoData} />;

  const win = windowOf(trades, view, offset);
  if (!win) return <NoData onPick={onPick} onGoData={onGoData} />;

  const a = agg(win.list);
  const o = agg(trades);
  const ps = perfStats(trades);
  const bk = buckets(win);
  const curve = bk.reduce<number[]>((acc, b) => {
    acc.push((acc.length ? acc[acc.length - 1] : 0) + b.pts);
    return acc;
  }, []);
  const stroke = a.pts >= 0 ? '#7FA981' : '#C06B54';
  const dayRec = view === 'daily' ? days.find((d) => d.date === win.key) : undefined;
  const daysIn = new Set(win.list.map((t) => t.date)).size;

  return (
    <>
      <div className="pills" style={{ marginTop: 22 }}>
        {VIEWS.map(([id, label]) => (
          <button key={id} className="pill" data-on={view === id ? '1' : '0'} onClick={() => onViewChange(id)}>{label}</button>
        ))}
      </div>

      <section className="j-hero">
        <div className="j-hero-in">
          <div className="winnav">
            {win.single ? <span /> : <button className="arrow" onClick={onOlder} disabled={win.idx <= 0}>&#8249;</button>}
            <div className="hero-eye" style={{ textAlign: 'center' }}>{win.label}</div>
            {win.single ? <span /> : <button className="arrow" onClick={onNewer} disabled={win.idx >= win.count - 1}>&#8250;</button>}
          </div>
          <div className={`j-hero-big ${cls(a.pts)}`} style={{ textAlign: 'center' }}>{fmt(a.pts)}</div>
          <div className="j-hero-unit" style={{ textAlign: 'center' }}>
            points · {fmt(a.R, 2)}R · {a.n}{a.n === 1 ? ' trade' : ' trades'}
            {view !== 'daily' ? ` across ${daysIn}${daysIn === 1 ? ' day' : ' days'}` : ''}
          </div>
          <div className="j-hero-meta" style={{ justifyContent: 'center' }}>{heroChips(view, win, a, dayRec)}</div>
          <Sparkline vals={curve} w={600} h={96} stroke={stroke} />
          {bk.length > 1 && (
            <div className="axis"><span>{bk[0].label}</span><span>{bk[bk.length - 1].label}</span></div>
          )}
        </div>
        <div className="j-hero-foot">
          <Hf k="Net points" v={fmt(a.pts)} c={cls(a.pts)} />
          <Hf k="Net R" v={fmt(a.R, 2)} c={cls(a.R)} />
          <Hf k="Trades" v={String(a.n)} />
          <Hf k="Win rate" v={a.n ? `${a.wr.toFixed(0)}%` : '—'} />
          <Hf k="Avg / trade" v={a.n ? fmt(a.avg) : '—'} c={cls(a.avg)} />
          <Hf
            k={view === 'daily' ? 'Best trade' : 'Days traded'}
            v={view === 'daily' ? (a.n ? fmt(Math.max(...win.list.map((t) => t.totalPts ?? 0))) : '—') : String(daysIn)}
          />
        </div>
      </section>

      <section className="sect">
        <div className="eye">Career stats · full log</div>
        <h2>Performance</h2>
        <p className="lede">
          Always the complete {trades.length} trades on file, not the window above — profit factor and drawdown need the
          full run to mean anything. Profit factor is gross points won ÷ gross points lost; expectancy is the average R per trade.
        </p>
        <div className="j-hero-foot" style={{ border: '1px solid var(--rule2)', borderRadius: 6, marginTop: 14, background: 'var(--panel)' }}>
          <Hf k="Win rate" v={o.n ? `${o.wr.toFixed(0)}%` : '—'} />
          <Hf k="Profit factor" v={ps.pf === Infinity ? '∞' : ps.pf == null ? '—' : ps.pf.toFixed(2)} />
          <Hf k="Expectancy (R)" v={o.n ? fmt(o.avgR, 2) : '—'} c={cls(o.avgR)} />
          <Hf k="Avg winner" v={ps.avgWinner != null ? fmt(ps.avgWinner) : '—'} c={ps.avgWinner != null ? 'pos' : 'dimc'} />
          <Hf k="Avg loser" v={ps.avgLoser != null ? fmt(ps.avgLoser) : '—'} c={ps.avgLoser != null ? 'neg' : 'dimc'} />
          <Hf k="Max drawdown" v={ps.maxDD > 0 ? fmt(-ps.maxDD) : '—'} c={ps.maxDD > 0 ? 'neg' : 'dimc'} />
          <Hf k="Best trade" v={ps.best != null ? fmt(ps.best) : '—'} c={ps.best != null ? 'pos' : 'dimc'} />
          <Hf k="Worst trade" v={ps.worst != null ? fmt(ps.worst) : '—'} c={cls(ps.worst || 0)} />
        </div>
      </section>

      <section className="sect">
        <div className="eye">The open questions</div>
        <h2>What&rsquo;s paying</h2>
        <p className="lede">
          These splits always use the <b>full log</b> — all {trades.length} trades — not the window above, because a
          comparison needs sample size to mean anything. Points per trade, with R underneath. Under five trades a side
          is marked thin: a hint, not a result.
        </p>
        <ComparisonRows trades={trades} />
      </section>

      <section className="sect">
        <div className="eye">Within {win.single ? win.label.split(' ·')[0] : win.label}</div>
        <h2>Breakdowns</h2>
        <p className="lede">These follow the window above, so they change with the period selector.</p>
      </section>
      <div className="grid2" style={{ marginTop: 14 }}>
        <GroupCard eye="Classification" title="Points by day type" field="dayType" list={win.list} />
        <GroupCard eye="Character" title="Points by day character" field="dayChar" list={win.list} />
      </div>
      <div className="grid2 sect">
        <GroupCard eye="Setup" title="Points by setup type" field="setup" list={win.list} />
        <GroupCard eye="Session" title="Points by session" field="session" list={win.list} />
      </div>
      <div className="grid2 sect">
        <OrderedCard
          eye="Calendar" title="Points by weekday" list={win.list} order={WEEKDAY_ORDER}
          keyFn={(t) => WEEKDAY_NAMES[new Date(t.date + 'T00:00:00Z').getUTCDay()]}
        />
        <OrderedCard
          eye="Sequence" title="Points by trade number in the day" list={win.list} order={TRADE_SEQ_ORDER}
          keyFn={(t) => (t.tradeNo != null ? `Trade ${t.tradeNo}` : null)}
        />
      </div>
    </>
  );
}

function ComparisonRows({ trades }: { trades: Trade[] }) {
  const rows = comparisons(trades);
  return (
    <div className="score">
      {rows.map((c) => {
        const scale = Math.max(Math.abs(c.a.avg), Math.abs(c.b.avg), 1);
        const thin = Math.min(c.a.n, c.b.n) < 5;
        const gap = c.a.avg - c.b.avg;
        const lead = gap >= 0 ? c.a : c.b;
        return (
          <div className="row" key={c.label}>
            <div className="row-head">
              <span className="row-name">{c.label}</span>
              {!c.a.n || !c.b.n
                ? <span className="badge">No comparison yet</span>
                : thin
                  ? <span className="badge" data-v="thin">Thin · {c.a.n} v {c.b.n}</span>
                  : <span className="badge" data-v="lead">{lead.name} by {Math.abs(gap).toFixed(1)} pts</span>}
            </div>
            <div className="dv">
              <DvSide s={c.b} scale={scale} side="l" />
              <div className="dv-axis" />
              <DvSide s={c.a} scale={scale} side="r" />
            </div>
            {c.note && <div className="row-note">{c.note}</div>}
          </div>
        );
      })}
    </div>
  );
}
