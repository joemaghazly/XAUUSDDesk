import { generateConfluenceRead, type ConfluenceReadLabel } from '../../lib/confluence/engine';
import type { DayTypeLabel } from './sessionBoardMath';
import { useCurrentPhase } from './useCurrentPhase';

const LABEL_TEXT: Record<ConfluenceReadLabel, string> = {
  FLAT_FOR_DAY: 'Flat for the day',
  BUDGET_EXHAUSTED: 'Budget exhausted',
  READING_SESSION: 'Reading session',
  LONDON_EXPERIMENT_ELIGIBLE: 'London experiment eligible',
  SETUP_FORMING: 'Setup forming',
  SETUP_DEVELOPING: 'Setup developing',
  CONDITIONS_ALIGNED: 'Conditions aligned',
};

const LABEL_TONE: Record<ConfluenceReadLabel, 'steel' | 'clay' | 'jade' | 'brass'> = {
  FLAT_FOR_DAY: 'steel',
  BUDGET_EXHAUSTED: 'clay',
  READING_SESSION: 'steel',
  LONDON_EXPERIMENT_ELIGIBLE: 'jade',
  SETUP_FORMING: 'brass',
  SETUP_DEVELOPING: 'brass',
  CONDITIONS_ALIGNED: 'jade',
};

interface Props {
  dayType: DayTypeLabel | null;
  hasAsianRange: boolean;
  checks: Record<string, boolean>;
  tradesTaken: number;
  losses: number;
}

export function ConfluenceRead({ dayType, hasAsianRange, checks, tradesTaken, losses }: Props) {
  const phase = useCurrentPhase();
  const read = generateConfluenceRead({ phase: phase.id, dayType, hasAsianRange, checks, tradesTaken, losses });
  const tone = LABEL_TONE[read.label];

  return (
    <section className="sect">
      <div className="eye">Confluence read · descriptive only</div>
      <h2>Where things stand</h2>
      <div className="card">
        <div className={`confluence-badge ${tone}`}>{LABEL_TEXT[read.label]}</div>
        <p className="lede" style={{ marginTop: 10 }}>{read.detail}</p>
        {read.totalExecChecks > 0 && (read.label === 'SETUP_FORMING' || read.label === 'SETUP_DEVELOPING' || read.label === 'CONDITIONS_ALIGNED') && (
          <div className="progress" style={{ marginTop: 4 }}>{read.checkedCount} / {read.totalExecChecks} execution-window filters confirmed</div>
        )}
        <div className="hint" style={{ marginTop: 12 }}>{read.disclaimer}</div>
      </div>
    </section>
  );
}
