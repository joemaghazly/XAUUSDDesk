import type { PhaseDot, PhaseId } from '../../lib/beirut';
import type { SessionBoardPatch } from '../../lib/db/sessionBoard';

interface CheckItem { id: string; phase: PhaseId; label: string }

const CHECK_ITEMS: CheckItem[] = [
  { id: 'markAsian', phase: 'asian', label: 'Asian high and low marked' },
  { id: 'atrNoted', phase: 'asian', label: 'Daily ATR noted, range read against it' },
  { id: 'h1Filter', phase: 'london', label: '1H candle close checked vs EMA21 / VWAP' },
  { id: 'dayChar', phase: 'london', label: 'Day character forming assessed — trend, choppy, or reversal' },
  { id: 'londonRule', phase: 'london', label: 'If taking the London trade: real break/reclaim confirmed, day is Normal or Compression' },
  { id: 'pullback', phase: 'exec', label: 'Waited for a pullback — not chasing an un-retraced leg' },
  { id: 'bb5m', phase: 'exec', label: '5-min Bollinger Bands checked before entering' },
  { id: 'boundary', phase: 'exec', label: 'Actual boundary break/reclaim confirmed — not just an EMA21/VWAP cross' },
  { id: 'vwapDist', phase: 'exec', label: 'Reversal entries only: VWAP distance in the 35–50% of ATR zone' },
  { id: 'stopSet', phase: 'exec', label: 'Stop set with the 15m ATR buffer; any tightening capped at 2x' },
  { id: 'bullets', phase: 'exec', label: 'Bullet 1 ~1R partial planned; Bullet 2 target set with the RSI 71/29 exit in mind' },
  { id: 'flat', phase: 'eod', label: 'Flat for the day — no unmanaged holds' },
];

const PHASE_LABEL: Record<PhaseId, string> = {
  asian: 'Asian range · 01:00–10:00', london: 'London · 10:00–15:00',
  exec: 'Execution window · 15:00–00:00', eod: 'End of day',
};
const PHASE_DOT: Record<PhaseId, PhaseDot> = { asian: 'steel', london: 'brass', exec: 'jade', eod: 'off' };
const PHASE_ORDER: PhaseId[] = ['asian', 'london', 'exec', 'eod'];

interface Props {
  checks: Record<string, boolean>;
  onPatchNow: (p: SessionBoardPatch) => void;
}

export function Checklist({ checks, onPatchNow }: Props) {
  return (
    <section className="sect">
      <div className="eye">Checklist</div>
      <h2>Pre-entry, by phase</h2>
      <p className="lede">Ticks reset with the Beirut date. Nothing here fires an alert — it&rsquo;s a read you check yourself, not an automated gate.</p>
      <div className="card">
        {PHASE_ORDER.map((ph) => {
          const items = CHECK_ITEMS.filter((it) => it.phase === ph);
          const doneCt = items.filter((it) => checks[it.id]).length;
          return (
            <div className="phasegroup" key={ph}>
              <div className="phasegroup-h"><span className={`dot ${PHASE_DOT[ph]}`} />{PHASE_LABEL[ph]}</div>
              {items.map((it) => {
                const on = !!checks[it.id];
                return (
                  <label className={`check${on ? ' done' : ''}`} key={it.id}>
                    <input type="checkbox" checked={on} onChange={(e) => onPatchNow({ checks: { ...checks, [it.id]: e.target.checked } })} />
                    <span>{it.label}</span>
                  </label>
                );
              })}
              <div className="progress">{doneCt} / {items.length} checked</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
