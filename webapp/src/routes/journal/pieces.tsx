import type { Trade } from '../../lib/db/trades';
import { cls, fmt, groupByField, groupByOrdered, type Agg } from '../../lib/analytics';

export function Sparkline({ vals, w, h, stroke }: { vals: number[]; w: number; h: number; stroke: string }) {
  if (!vals.length) return null;
  const pad = 2;
  const mn = Math.min(0, ...vals);
  const mx = Math.max(0, ...vals);
  const span = mx - mn || 1;
  const X = (i: number) => pad + (i / Math.max(1, vals.length - 1)) * (w - pad * 2);
  const Y = (v: number) => h - pad - ((v - mn) / span) * (h - pad * 2);
  const line = vals.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  const gradId = 'sparkfill';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="j-hero-curve" role="img" aria-label="Cumulative points">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity=".22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${X(0)},${h} ${line} ${X(vals.length - 1)},${h}`} fill={`url(#${gradId})`} />
      <line x1={pad} x2={w - pad} y1={Y(0)} y2={Y(0)} stroke="#3A3229" vectorEffect="non-scaling-stroke" />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={X(vals.length - 1)} cy={Y(vals[vals.length - 1])} r={3.2} fill="#CF9B3F" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Hf({ k, v, c }: { k: string; v: string; c?: string }) {
  return (
    <div className="hf">
      <div className="hf-k">{k}</div>
      <div className={`hf-v ${c || ''}`}>{v}</div>
    </div>
  );
}

function barPct(v: number, scale: number): number {
  return scale ? Math.min(50, (Math.abs(v) / scale) * 50) : 0;
}

export function Bar({ v, scale }: { v: number; scale: number }) {
  return (
    <div className="btrack">
      <div className="bzero" />
      <div className={`bfill ${v >= 0 ? 'pos' : 'neg'}`} style={{ width: `${barPct(v, scale)}%` }} />
    </div>
  );
}

export function DvSide({ s, scale, side }: { s: Agg; scale: number; side: 'l' | 'r' }) {
  const pct = s.n ? Math.min(100, (Math.abs(s.avg) / scale) * 100) : 0;
  return (
    <div className={`dv-side ${side}`}>
      <div className="dv-lab">
        <div className="dv-nm">{s.name}</div>
        <div className="dv-n">n={s.n} · {s.wr.toFixed(0)}% win</div>
      </div>
      <div className={`dv-v ${cls(s.avg)}`}>
        {s.n ? fmt(s.avg) : '—'}
        <div className="dv-sub">{s.n ? `${fmt(s.avgR, 2)}R` : ''}</div>
      </div>
      <div className="dv-bar">
        <div className={`dv-fill ${s.avg >= 0 ? 'pos' : 'neg'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BreakdownRows({ rows }: { rows: Agg[] }) {
  const scale = Math.max(1, ...rows.map((x) => Math.abs(x.avg)));
  if (!rows.length) return <div className="mono dimc">No trades in this window.</div>;
  return (
    <>
      {rows.map((d) => (
        <div className="brow" key={d.name}>
          <div className="blab">{d.name} <span style={{ opacity: 0.55 }}>({d.n})</span></div>
          <Bar v={d.avg} scale={scale} />
          <div className={`bval ${cls(d.avg)}`}>{fmt(d.avg)}</div>
        </div>
      ))}
    </>
  );
}

export function GroupCard({ eye, title, field, list }: { eye: string; title: string; field: keyof Trade; list: Trade[] }) {
  const rows = groupByField(list, field);
  return (
    <div>
      <div className="eye">{eye}</div>
      <h3>{title}</h3>
      <div className="card"><BreakdownRows rows={rows} /></div>
    </div>
  );
}

export function OrderedCard({ eye, title, list, keyFn, order }: {
  eye: string; title: string; list: Trade[]; keyFn: (t: Trade) => string | null; order: string[];
}) {
  const rows = groupByOrdered(list, keyFn, order);
  return (
    <div>
      <div className="eye">{eye}</div>
      <h3>{title}</h3>
      <div className="card"><BreakdownRows rows={rows} /></div>
    </div>
  );
}

export function NoData({ onPick, onGoData }: { onPick: () => void; onGoData: () => void }) {
  return (
    <div className="empty">
      <h3>No journal loaded</h3>
      <p>Import your XAUUSD Trading Journal workbook and every tab fills in from the Trade Log and Day Log sheets.</p>
      <div className="acts">
        <button className="btn" onClick={onPick}>Choose workbook</button>
        <button className="btn g" onClick={onGoData}>How importing works</button>
      </div>
    </div>
  );
}
