import type { SessionBoardPatch } from '../../lib/db/sessionBoard';

interface Props {
  trades: number;
  losses: number;
  onPatchNow: (p: SessionBoardPatch) => void;
}

export function Budget({ trades, losses, onPatchNow }: Props) {
  const step = (field: 'trades' | 'losses', current: number, d: number) => {
    onPatchNow({ [field]: Math.max(0, current + d) });
  };

  return (
    <section className="sect">
      <div className="eye">Discipline</div>
      <h2>Today&rsquo;s budget</h2>
      <p className="lede">2–3 trades, 2 losses maximum. Step these as the day goes — the board flags it once either cap is hit.</p>
      <div className="card">
        <div className="budgetrow">
          <div className="bud">
            <div className="bud-k">Trades taken</div>
            <div className="bud-vrow">
              <button className="stepbtn" onClick={() => step('trades', trades, -1)}>–</button>
              <div className="bud-v">{trades}</div>
              <button className="stepbtn" onClick={() => step('trades', trades, 1)}>+</button>
            </div>
            <div className="bud-cap">Target 2–3 / day</div>
          </div>
          <div className="bud">
            <div className="bud-k">Losses</div>
            <div className="bud-vrow">
              <button className="stepbtn" onClick={() => step('losses', losses, -1)}>–</button>
              <div className="bud-v">{losses}</div>
              <button className="stepbtn" onClick={() => step('losses', losses, 1)}>+</button>
            </div>
            <div className="bud-cap">Cap at 2 / day</div>
          </div>
        </div>
        {losses >= 2 ? (
          <div className="budgetlock">Loss cap hit — today&rsquo;s trading is done.</div>
        ) : trades >= 3 ? (
          <div className="budgetlock">Trade count hit — no more trades today unless there&rsquo;s a specific reason.</div>
        ) : null}
      </div>
    </section>
  );
}
