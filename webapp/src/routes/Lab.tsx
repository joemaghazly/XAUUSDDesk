import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTrades } from '../lib/db/trades';

export function Lab() {
  const [tradeCount, setTradeCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTrades('XAUUSD').then((t) => { if (!cancelled) setTradeCount(t.length); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="wrap">
      <header className="top">
        <div className="eye">Symbol frameworks</div>
        <h2>The Lab</h2>
        <p className="lede">
          Each symbol gets its own session structure, indicator set and entry rules. XAUUSD&rsquo;s is built out —
          Journal and Session Board both run on it. SPX and USDJPY are queued: send over the session windows and the
          rules the way gold&rsquo;s were built, and the same toolkit gets built for each.
        </p>
      </header>

      <div className="lab-sgrid">
        <div className="lab-scard active">
          <div className="scard-top"><div className="sym">XAUUSD</div><span className="tag live">Live</span></div>
          <p>
            Gold. Asian range 01:00–10:00 Beirut, London read 10:00–15:00, execution from the 15:00 VWAP anchor. Full
            framework, journal history, and today&rsquo;s board.
          </p>
          {tradeCount ? (
            <p className="lede" style={{ marginTop: -4, fontSize: 12 }}>
              {tradeCount} trades on file, shared with the Journal and Session Board.
            </p>
          ) : null}
          <div className="scard-links">
            <Link className="mini" to="/journal">Journal</Link>
            <Link className="mini" to="/session-board">Session Board</Link>
          </div>
        </div>

        <div className="lab-scard">
          <div className="scard-top"><div className="sym">SPX</div><span className="tag queued">Not started</span></div>
          <p>S&amp;P 500. No session windows, indicators or entry rules defined yet — nothing to build against until those exist.</p>
          <div className="scard-links"><span className="mini dim">Framework not started</span></div>
        </div>

        <div className="lab-scard">
          <div className="scard-top"><div className="sym">USDJPY</div><span className="tag queued">Not started</span></div>
          <p>Same situation — a session read and a rule set come first, then the journal and board follow the same build as gold.</p>
          <div className="scard-links"><span className="mini dim">Framework not started</span></div>
        </div>
      </div>

      <section style={{ marginTop: 44 }}>
        <div className="eye">What a new symbol needs</div>
        <h2>Before SPX or USDJPY can get their own board</h2>
        <p className="lede">
          The gold toolkit isn&rsquo;t generic — it&rsquo;s built on gold&rsquo;s specific rules. A new symbol needs its
          own answers to the same handful of questions before the same journal and board can exist for it.
        </p>
        <div className="card">
          <div className="frow"><div className="frow-k">Session structure</div><div className="frow-v">Which hours are the reference range, which are read-only, when does execution open</div></div>
          <div className="frow"><div className="frow-k">Indicators</div><div className="frow-v">Which ones, on which timeframes, and what each is actually checking for</div></div>
          <div className="frow"><div className="frow-k">Entry logic</div><div className="frow-v">What confirms a real entry vs. a false read — the boundary/pullback/filter rules</div></div>
          <div className="frow"><div className="frow-k">Exit and sizing</div><div className="frow-v">Stop placement, partials, the daily trade/loss budget</div></div>
        </div>
      </section>

      <div className="foot">
        Gold&rsquo;s framework took a few weeks of live trading to settle — SPX and USDJPY don&rsquo;t need to start
        from a blank page, just from your read on each one. Whenever you&rsquo;re ready to define either, that&rsquo;s
        a normal conversation, not a rebuild.
      </div>
    </div>
  );
}
