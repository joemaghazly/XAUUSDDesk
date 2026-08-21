// New feature (not part of the original static site) -- a plain position-
// size calculator. Not tied to the trading framework's entry/exit rules,
// just standard risk-based sizing math: how many ounces/lots to take so
// that a stop-out costs exactly the risk you set.
export interface RiskCalcInput {
  accountBalance: number;
  riskPct: number; // e.g. 1 for 1%
  entry: number;
  stop: number;
  // Ounces per lot. 100 is the common XAUUSD CFD convention, but this
  // varies by broker -- surfaced as an input rather than hardcoded.
  ozPerLot: number;
}

export interface RiskCalcResult {
  riskAmount: number;
  stopDistance: number;
  positionSizeOz: number | null;
  lots: number | null;
}

export function calcPositionSize(input: RiskCalcInput): RiskCalcResult {
  const riskAmount = input.accountBalance * (input.riskPct / 100);
  const stopDistance = Math.abs(input.entry - input.stop);
  const positionSizeOz = stopDistance > 0 ? riskAmount / stopDistance : null;
  const lots = positionSizeOz != null && input.ozPerLot > 0 ? positionSizeOz / input.ozPerLot : null;
  return { riskAmount, stopDistance, positionSizeOz, lots };
}
