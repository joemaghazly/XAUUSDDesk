// Confluence engine v1. Deliberately reads the board's own entered/
// confirmed state (session phase, day classification, the pre-entry
// checklist, today's budget) rather than pretending to compute EMA21/
// VWAP/RSI/Bollinger Bands live -- there is no OHLC candle feed wired up
// anywhere in this app (MarketDataProvider gives spot price, today's
// intraday points, and daily bars for ATR only), so a "live indicator"
// read would mean fabricating numbers this app doesn't actually have.
// What it CAN honestly do is summarize how many of the framework's own
// entry-filter checks you've already confirmed by eye against your
// TradingView chart -- see the checklist item ids below, which are the
// same ids session-board.html's checklist has always used.
import type { PhaseId } from '../beirut';
import type { DayTypeLabel } from '../../routes/sessionBoard/sessionBoardMath';
import { CONFLUENCE_DISCLAIMER, CONFLUENCE_MODE } from './config';

// No direction, no action, nowhere in this union -- see config.ts.
export type ConfluenceReadLabel =
  | 'FLAT_FOR_DAY'
  | 'BUDGET_EXHAUSTED'
  | 'READING_SESSION'
  | 'LONDON_EXPERIMENT_ELIGIBLE'
  | 'SETUP_FORMING'
  | 'SETUP_DEVELOPING'
  | 'CONDITIONS_ALIGNED';

export interface ConfluenceRead {
  label: ConfluenceReadLabel;
  headline: string;
  detail: string;
  checkedCount: number;
  totalExecChecks: number;
  disclaimer: string;
}

export interface ConfluenceInput {
  phase: PhaseId;
  dayType: DayTypeLabel | null;
  hasAsianRange: boolean;
  checks: Record<string, boolean>;
  tradesTaken: number;
  losses: number;
}

// Same 6 execution-window items session-board.html's checklist has always
// had (excludes markAsian/atrNoted/h1Filter/dayChar/londonRule, which
// belong to earlier phases, and flat, which belongs to end of day).
// vwapDist is framework-conditional on reversal entries only; this v1
// doesn't yet track setup type (reversal vs continuation) on the board
// itself, so it's weighted the same as the others -- a known
// simplification, not an oversight.
const EXEC_CHECK_IDS = ['pullback', 'bb5m', 'boundary', 'vwapDist', 'stopSet', 'bullets'];

function countChecked(checks: Record<string, boolean>, ids: string[]): number {
  return ids.filter((id) => checks[id]).length;
}

export function generateConfluenceRead(input: ConfluenceInput): ConfluenceRead {
  if ((CONFLUENCE_MODE as string) !== 'descriptive-only') {
    throw new Error('Confluence engine must run in descriptive-only mode');
  }

  const budgetExhausted = input.losses >= 2 || input.tradesTaken >= 3;

  if (input.phase === 'eod') {
    return {
      label: 'FLAT_FOR_DAY',
      headline: 'Flat for the day',
      detail: "Outside the framework's hours — nothing to read, nothing to trade.",
      checkedCount: 0, totalExecChecks: EXEC_CHECK_IDS.length, disclaimer: CONFLUENCE_DISCLAIMER,
    };
  }

  if (input.phase === 'asian') {
    return {
      label: 'READING_SESSION',
      headline: 'Reading the Asian session',
      detail: input.hasAsianRange
        ? 'Asian range is set — this is the reference for everything that follows, but the execution window hasn\'t opened yet.'
        : "Marking today's high and low. Nothing to read until the 01:00–10:00 range is in.",
      checkedCount: 0, totalExecChecks: EXEC_CHECK_IDS.length, disclaimer: CONFLUENCE_DISCLAIMER,
    };
  }

  if (input.phase === 'london') {
    if (budgetExhausted) {
      return {
        label: 'BUDGET_EXHAUSTED',
        headline: 'Budget exhausted',
        detail: "Today's trade/loss budget is spent — the tracked London experiment counts against it too, so it's off the table for today.",
        checkedCount: 0, totalExecChecks: EXEC_CHECK_IDS.length, disclaimer: CONFLUENCE_DISCLAIMER,
      };
    }
    const eligible = (input.dayType === 'Compression' || input.dayType === 'Normal') && !!input.checks.londonRule;
    if (eligible) {
      return {
        label: 'LONDON_EXPERIMENT_ELIGIBLE',
        headline: 'London experiment conditions met',
        detail: `Day read as ${input.dayType} and the checklist's break/reclaim confirmation is ticked — the tracked London trade is in scope today, still subject to every other rule.`,
        checkedCount: 0, totalExecChecks: EXEC_CHECK_IDS.length, disclaimer: CONFLUENCE_DISCLAIMER,
      };
    }
    return {
      label: 'READING_SESSION',
      headline: 'London — read-only',
      detail: 'No trades unless the London experiment\'s own conditions are met: a real Asian-range break/reclaim, and a Normal or Compression day.',
      checkedCount: 0, totalExecChecks: EXEC_CHECK_IDS.length, disclaimer: CONFLUENCE_DISCLAIMER,
    };
  }

  // exec
  if (budgetExhausted) {
    return {
      label: 'BUDGET_EXHAUSTED',
      headline: 'Budget exhausted',
      detail: "Today's trade or loss cap is hit — no further entries today unless there's a specific reason.",
      checkedCount: countChecked(input.checks, EXEC_CHECK_IDS), totalExecChecks: EXEC_CHECK_IDS.length,
      disclaimer: CONFLUENCE_DISCLAIMER,
    };
  }
  const checkedCount = countChecked(input.checks, EXEC_CHECK_IDS);
  if (checkedCount === 0) {
    return {
      label: 'SETUP_FORMING',
      headline: 'Setup forming',
      detail: 'Execution window is open, but none of the entry-filter checks below are confirmed yet.',
      checkedCount, totalExecChecks: EXEC_CHECK_IDS.length, disclaimer: CONFLUENCE_DISCLAIMER,
    };
  }
  if (checkedCount === EXEC_CHECK_IDS.length) {
    return {
      label: 'CONDITIONS_ALIGNED',
      headline: 'Conditions aligned',
      detail: 'Every filter on the pre-entry checklist is confirmed. That describes where things stand — it is not an instruction to enter.',
      checkedCount, totalExecChecks: EXEC_CHECK_IDS.length, disclaimer: CONFLUENCE_DISCLAIMER,
    };
  }
  return {
    label: 'SETUP_DEVELOPING',
    headline: 'Setup developing',
    detail: `${checkedCount} of ${EXEC_CHECK_IDS.length} execution-window filters confirmed so far.`,
    checkedCount, totalExecChecks: EXEC_CHECK_IDS.length, disclaimer: CONFLUENCE_DISCLAIMER,
  };
}
