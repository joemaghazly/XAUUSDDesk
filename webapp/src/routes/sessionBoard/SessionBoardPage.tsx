import { useSessionBoardDay } from './useSessionBoardDay';
import { useSessionBoardTrades } from './useSessionBoardTrades';
import { PhaseHero } from './PhaseHero';
import { TradingViewChart } from './TradingViewChart';
import { AsianPanel } from './AsianPanel';
import { LondonPanel } from './LondonPanel';
import { VwapPanel } from './VwapPanel';
import { DayCharPills } from './DayCharPills';
import { Budget } from './Budget';
import { Checklist } from './Checklist';
import { LiveDataSection } from './LiveDataSection';
import { Suggestions } from './Suggestions';
import { RiskCalculator } from './RiskCalculator';
import { classifyDayType } from './sessionBoardMath';

const SYMBOL = 'XAUUSD';

export function SessionBoardPage() {
  const { date, day, loading, error, patch, patchNow, reset } = useSessionBoardDay(SYMBOL);
  const { trades, loaded } = useSessionBoardTrades(SYMBOL);

  const resetKey = `${date}:${day ? 'loaded' : 'loading'}`;
  const dayTypeLabel = day?.asianHigh != null && day.asianLow != null && day.atr
    ? classifyDayType(day.asianHigh - day.asianLow, day.atr)
    : null;

  return (
    <div className="wrap">
      <div className="sb-top">
        <div className="sb-toprow">
          <div className="sb-mark"><span className="ingot" />XAU/USD <span className="tagword">SESSION BOARD</span></div>
          <div className="sb-clock">Beirut UTC+3</div>
        </div>
      </div>

      <PhaseHero />

      {loading && <p className="lede" style={{ marginTop: 20 }}>Loading today&rsquo;s board…</p>}
      {error && <div className="note bad" style={{ marginTop: 20 }}>Couldn&rsquo;t load today&rsquo;s board: {error}</div>}

      {!loading && !error && day && (
        <>
          <TradingViewChart />
          <AsianPanel day={day} resetKey={resetKey} onPatch={patch} />
          <LiveDataSection onPatch={patch} />
          <LondonPanel day={day} resetKey={resetKey} onPatch={patch} />
          <VwapPanel day={day} resetKey={resetKey} onPatch={patch} />
          <DayCharPills dayChar={day.dayChar} onPatch={patchNow} />
          <Budget trades={day.trades} losses={day.losses} onPatchNow={patchNow} />
          <Checklist checks={day.checks} onPatchNow={patchNow} />
          <Suggestions
            trades={trades} loaded={loaded} dayTypeLabel={dayTypeLabel}
            dayChar={day.dayChar} tradesTakenToday={day.trades}
          />
          <RiskCalculator />

          <div className="acts">
            <button className="btn g" onClick={reset}>Clear today&rsquo;s board</button>
          </div>
        </>
      )}

      <div className="foot">
        Beirut time is the only thing this board reads on its own. Ranges, VWAP, the checklist and the trade/loss
        counters are entered by you and stored in your account, keyed to today&rsquo;s date, and reset at the date
        rollover. Trade history for the suggestion cards is shared with the Journal — import there to power both.
      </div>
    </div>
  );
}
