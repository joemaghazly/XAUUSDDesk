interface Item {
  name: string;
  p: string;
  use: React.ReactNode;
}

const ITEMS: Item[] = [
  {
    name: 'Asian Range Box',
    p: 'Draws the 01:00–10:00 Beirut high and low as a box on the chart.',
    use: (
      <>
        Used for: the pre-session read (range vs. Daily ATR → Compression / Normal / Stretched / Extended), and as
        the boundary that both the London-experiment trigger and the execution-window entries need an actual break
        or reclaim of — <b>not</b> a plain EMA/VWAP cross.
      </>
    ),
  },
  {
    name: 'EMA 21 / 45 / 100',
    p: 'Three exponential moving averages on the working timeframe.',
    use: 'Used for: the 1H-close filter before entering (candle closes above/below EMA21 confirms direction) and as one of the pullback references during the execution window.',
  },
  {
    name: 'VWAP — Session Anchored',
    p: 'VWAP re-anchored at 15:00 Beirut, when the execution window opens.',
    use: "Used for: the reversal-entry distance filter — price sitting roughly 35–50% of Daily ATR away from the anchor. Continuation entries don't use this check.",
  },
  {
    name: 'RSI (14)',
    p: 'Standard 14-period RSI.',
    use: 'Used for: the Bullet 2 exhaustion exit at 71 (long) / 29 (short) — an exit signal on the runner, not an entry filter.',
  },
  {
    name: 'Bollinger Bands (20, 2)',
    p: '20-period, 2 standard deviations, read on the 5-minute chart.',
    use: "Used for: the last check before entering during the execution window — part of the pre-entry checklist, alongside the pullback and boundary confirmations.",
  },
];

export function Indicators() {
  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <header className="top">
        <div className="eye">XAUUSD · already built</div>
        <h2>Indicators</h2>
        <p className="lede">
          This is documentation, not a live tool — these run on your TradingView chart, not in a browser here. Each
          entry is what it&rsquo;s for in the actual framework, not a generic description.
        </p>
      </header>

      <div className="ind-list">
        {ITEMS.map((item, i) => (
          <div className="ind-item" key={item.name}>
            <div className="ind-item-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="ind-item-body">
              <div className="ind-item-h">
                <span className="ind-item-name">{item.name}</span>
                <span className="ind-tag">Live on chart</span>
              </div>
              <p className="ind-item-p">{item.p}</p>
              <p className="ind-item-use">{item.use}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="note">
        These already exist and are running — this page is a reference for what each one is doing and why, not a
        build. If any of them need adjusting (alerts, visual tweaks, an additional plot), say which one and that&rsquo;s
        a normal edit, not a rebuild.
      </div>

      <div className="foot">
        Nothing on this page reads your chart or any live price — it&rsquo;s a written reference, kept next to the
        Journal and Session Board so the reasoning behind each indicator lives in the same place as the rules that
        use it.
      </div>
    </div>
  );
}
