import type { SessionBoardDay, SessionBoardPatch } from '../../lib/db/sessionBoard';
import { vwapZoneFor } from './sessionBoardMath';
import { NumberInput } from './NumberInput';

interface Props {
  day: SessionBoardDay;
  resetKey: string;
  onPatch: (p: SessionBoardPatch) => void;
}

export function VwapPanel({ day, resetKey, onPatch }: Props) {
  const { vwap: v, price: p, atr: a } = day;
  const hasBoth = v != null && p != null;
  const dist = hasBoth ? p! - v! : null;
  const adist = dist != null ? Math.abs(dist) : null;
  const pct = adist != null && a != null ? (adist / a) * 100 : null;
  const zone = pct != null ? vwapZoneFor(pct) : null;

  return (
    <section className="sect">
      <div className="eye">From 15:00</div>
      <h2>VWAP &amp; anchored VWAP</h2>
      <p className="lede">
        Enter the VWAP value once it&rsquo;s anchored at 15:00, and price whenever you&rsquo;re checking the
        reversal-entry filter — distance from VWAP as a % of ATR, roughly the 35–50% zone.
      </p>
      <div className="card">
        <div className="readgrid two">
          <NumberInput label="Anchored VWAP" placeholder="4071.20" value={v} resetKey={resetKey} onCommit={(n) => onPatch({ vwap: n })} />
          <NumberInput label="Price now" placeholder="4066.85" value={p} resetKey={resetKey} onCommit={(n) => onPatch({ price: n })} />
        </div>
        <div className="readout">
          {hasBoth && (
            <>
              <div><div className="ro-k">Distance</div><div className={`ro-v ${dist! > 0 ? 'pos' : dist! < 0 ? 'neg' : 'dimc'}`}>{(dist! > 0 ? '+' : '') + dist!.toFixed(2)} pts</div></div>
              {pct != null && (
                <>
                  <div><div className="ro-k">% of Daily ATR</div><div className="ro-v">{pct.toFixed(1)}%</div></div>
                  <div><div className="ro-k">Reversal filter</div><div className={`readtag ${zone === 'in' ? 'jade' : ''}`}>{zone === 'in' ? 'In the 35–50% zone' : zone === 'below' ? 'Below the zone' : 'Beyond the zone'}</div></div>
                </>
              )}
            </>
          )}
        </div>
        <div className="hint">
          {!hasBoth
            ? 'Enter the anchored VWAP and a current price to check distance.'
            : a == null
              ? 'Add Daily ATR above to see this as a % and check the reversal-entry zone.'
              : "The 35–50% zone is your reversal-entry filter only — continuation entries don't use this check."}
        </div>
      </div>
    </section>
  );
}
