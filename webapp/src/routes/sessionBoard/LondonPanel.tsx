import type { SessionBoardDay, SessionBoardPatch } from '../../lib/db/sessionBoard';
import { londonVsAsianTag } from './sessionBoardMath';
import { NumberInput } from './NumberInput';

interface Props {
  day: SessionBoardDay;
  resetKey: string;
  onPatch: (p: SessionBoardPatch) => void;
}

export function LondonPanel({ day, resetKey, onPatch }: Props) {
  const { londonHigh: h, londonLow: l, atr: a, asianHigh, asianLow } = day;
  const hasRange = h != null && l != null;
  const range = hasRange ? h - l : null;
  const tag = hasRange && asianHigh != null && asianLow != null
    ? londonVsAsianTag(h!, l!, asianHigh, asianLow)
    : null;

  return (
    <section className="sect">
      <div className="eye">Read-only · 10:00–15:00</div>
      <h2>London range</h2>
      <p className="lede">
        Reference only — the tracked London-experiment trade still needs a break or reclaim of the <b>Asian</b>
        high/low, not London&rsquo;s own range. This just shows how the range is behaving into the anchor.
      </p>
      <div className="card">
        <div className="readgrid two">
          <NumberInput label="London high" placeholder="4082.40" value={h} resetKey={resetKey} onCommit={(v) => onPatch({ londonHigh: v })} />
          <NumberInput label="London low" placeholder="4061.10" value={l} resetKey={resetKey} onCommit={(v) => onPatch({ londonLow: v })} />
        </div>
        <div className="readout">
          {hasRange && (
            <>
              <div><div className="ro-k">Range</div><div className="ro-v">{range!.toFixed(1)} pts</div></div>
              {a != null && <div><div className="ro-k">% of Daily ATR</div><div className="ro-v">{((range! / a) * 100).toFixed(1)}%</div></div>}
              {tag && (
                <div>
                  <div className="ro-k">Vs. Asian range</div>
                  <div className={`readtag ${tag !== 'Contained inside the Asian range' ? 'jade' : ''}`} style={{ marginTop: 8 }}>{tag}</div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="hint">
          {hasRange
            ? 'Reference only — the London-experiment trigger is still a break/reclaim of the Asian high or low.'
            : "Enter London's high and low once you have a read on it."}
        </div>
      </div>
    </section>
  );
}
