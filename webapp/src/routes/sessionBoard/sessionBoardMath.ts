// Ported verbatim from session-board.html's renderAsian/renderLondon/
// renderVwap. Day classification thresholds confirmed against the live
// code (not the workbook's Framework tab, which uses different numbers --
// see the migration conversation): <50 Compression, 50-75 Normal,
// 75-120 Stretched, >120 Extended. This is a first read off the Asian
// range alone and can be revised intraday -- callers should treat it that
// way, not cache it as fixed for the day.
export type DayTypeLabel = 'Compression' | 'Normal' | 'Stretched' | 'Extended';

export function classifyDayType(rangePts: number, atr: number): DayTypeLabel {
  const pct = (rangePts / atr) * 100;
  if (pct < 50) return 'Compression';
  if (pct < 75) return 'Normal';
  if (pct < 120) return 'Stretched';
  return 'Extended';
}

export type LondonVsAsianTag =
  | 'Swept both sides of the Asian range'
  | 'Broke the Asian high'
  | 'Broke the Asian low'
  | 'Contained inside the Asian range';

export function londonVsAsianTag(londonHigh: number, londonLow: number, asianHigh: number, asianLow: number): LondonVsAsianTag {
  const brokeHigh = londonHigh > asianHigh;
  const brokeLow = londonLow < asianLow;
  if (brokeHigh && brokeLow) return 'Swept both sides of the Asian range';
  if (brokeHigh) return 'Broke the Asian high';
  if (brokeLow) return 'Broke the Asian low';
  return 'Contained inside the Asian range';
}

// The 35-50% VWAP-distance zone is the reversal-entry filter only --
// continuation entries don't use this check (see indicators.html /
// the checklist item vwapDist).
export type VwapZone = 'below' | 'in' | 'beyond';

export function vwapZoneFor(pctOfAtr: number): VwapZone {
  if (pctOfAtr >= 35 && pctOfAtr <= 50) return 'in';
  return pctOfAtr < 35 ? 'below' : 'beyond';
}
