import { useState } from 'react';
import { calcPositionSize } from './riskCalc';

// New feature -- there's no equivalent on the original static site. Plain
// client-side math, not persisted (reload resets it, same as any other
// scratch calculation).
export function RiskCalculator() {
  const [accountBalance, setAccountBalance] = useState('10000');
  const [riskPct, setRiskPct] = useState('1');
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [ozPerLot, setOzPerLot] = useState('100');

  const nums = {
    accountBalance: parseFloat(accountBalance),
    riskPct: parseFloat(riskPct),
    entry: parseFloat(entry),
    stop: parseFloat(stop),
    ozPerLot: parseFloat(ozPerLot),
  };
  const ready = Object.values(nums).every((v) => isFinite(v));
  const result = ready ? calcPositionSize(nums) : null;

  return (
    <section className="sect">
      <div className="eye">Sizing</div>
      <h2>Position size</h2>
      <p className="lede">
        Account risk % and stop distance → position size. Standard risk-based sizing math, not part of the entry/exit
        rules above — check the oz-per-lot convention against your own broker before trusting the lot figure.
      </p>
      <div className="card">
        <div className="readgrid">
          <div className="f"><label>Account balance ($)</label><input inputMode="decimal" value={accountBalance} onChange={(e) => setAccountBalance(e.target.value)} /></div>
          <div className="f"><label>Risk %</label><input inputMode="decimal" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} /></div>
          <div className="f"><label>Oz per lot</label><input inputMode="decimal" value={ozPerLot} onChange={(e) => setOzPerLot(e.target.value)} /></div>
        </div>
        <div className="readgrid two" style={{ marginTop: 14 }}>
          <div className="f"><label>Entry price</label><input inputMode="decimal" placeholder="4066.85" value={entry} onChange={(e) => setEntry(e.target.value)} /></div>
          <div className="f"><label>Stop price</label><input inputMode="decimal" placeholder="4059.40" value={stop} onChange={(e) => setStop(e.target.value)} /></div>
        </div>
        <div className="readout">
          {result ? (
            <>
              <div><div className="ro-k">Risk amount</div><div className="ro-v">${result.riskAmount.toFixed(2)}</div></div>
              <div><div className="ro-k">Stop distance</div><div className="ro-v">{result.stopDistance.toFixed(2)} pts</div></div>
              <div><div className="ro-k">Position size</div><div className="ro-v">{result.positionSizeOz != null ? `${result.positionSizeOz.toFixed(2)} oz` : '—'}</div></div>
              <div><div className="ro-k">Lots</div><div className="ro-v">{result.lots != null ? result.lots.toFixed(3) : '—'}</div></div>
            </>
          ) : (
            <div className="hint">Enter entry and stop to size the position.</div>
          )}
        </div>
      </div>
    </section>
  );
}
