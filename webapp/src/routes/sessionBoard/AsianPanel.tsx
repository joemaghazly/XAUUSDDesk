import type { SessionBoardDay, SessionBoardPatch } from '../../lib/db/sessionBoard';
import { classifyDayType } from './sessionBoardMath';
import { NumberInput } from './NumberInput';

interface Props {
  day: SessionBoardDay;
  resetKey: string;
  onPatch: (p: SessionBoardPatch) => void;
}

export function AsianPanel({ day, resetKey, onPatch }: Props) {
  const { asianHigh: h, asianLow: l, atr: a } = day;
  const hasRange = h != null && l != null;
  const range = hasRange ? h - l : null;
  const pct = hasRange && a ? (range! / a) * 100 : null;
  const dayType = pct != null ? classifyDayType(range!, a!) : null;

  return (
    <section className="sect">
      <div className="eye">Pre-session · 01:00–10:00</div>
      <h2>Asian range</h2>
      <p className="lede">
        Enter the Asian high and low once the range is set, plus today&rsquo;s Daily ATR. This is a first read off the
        Asian range alone — the day can still reclassify once it extends, same as it has before.
      </p>
      <div className="card">
        <div className="readgrid">
          <NumberInput label="Asian high" placeholder="4079.18" value={h} resetKey={resetKey} onCommit={(v) => onPatch({ asianHigh: v })} />
          <NumberInput label="Asian low" placeholder="4047.34" value={l} resetKey={resetKey} onCommit={(v) => onPatch({ asianLow: v })} />
          <NumberInput label="Daily ATR" placeholder="83.96" value={a} resetKey={resetKey} onCommit={(v) => onPatch({ atr: v })} />
        </div>
        <div className="readout">
          {hasRange && (
            <div><div className="ro-k">Range</div><div className="ro-v">{range!.toFixed(1)} pts</div></div>
          )}
          {hasRange && a != null && (
            <>
              <div><div className="ro-k">% of Daily ATR</div><div className="ro-v">{pct!.toFixed(1)}%</div></div>
              <div><div className="ro-k">First read</div><div className="readtag set">{dayType}</div></div>
            </>
          )}
        </div>
        <div className="hint">
          {!hasRange
            ? 'Enter the Asian high and low once the 01:00–10:00 range is in.'
            : a == null
              ? 'Add Daily ATR to get a Compression/Normal/Stretched/Extended read.'
              : 'Rough boundaries only (<50 / 50–75 / 75–120 / >120% of ATR) — your own judgment leads, and the day can reclassify intraday.'}
        </div>
      </div>
    </section>
  );
}
