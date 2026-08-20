import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { beirutParts, pad, phaseFor } from '../lib/beirut';

export function Home() {
  const [time, setTime] = useState('--:--:--');
  const [phase, setPhase] = useState(phaseFor(0));

  useEffect(() => {
    function tick() {
      const t = beirutParts();
      setTime(`${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`);
      setPhase(phaseFor(t.h));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="wrap">
      <section className="hero">
        <div className="hero-eye">On the desk right now</div>
        <div className="hero-time">{time}</div>
        <div className="hero-phase">
          <span className={`dot ${phase.cls}`} />
          <span>{phase.name}</span>
        </div>
        <div className="hero-note">{phase.note}</div>
        <Link to="/session-board" className="hero-link">Open the full board →</Link>
      </section>

      <section className="sect">
        <div className="eye">Four rooms</div>
        <h2>Everything lives here now</h2>
        <p className="lede">
          One place instead of four separate links. Lab holds every symbol&rsquo;s framework, Indicators
          documents what&rsquo;s already running on the chart, Journal is the trade log and the splits,
          Session Board is the live desk for whatever&rsquo;s trading today.
        </p>

        <div className="grid">
          <Link className="card" to="/lab">
            <div className="card-top">
              <svg className="card-icon" viewBox="0 0 44 44" style={{ color: 'var(--steel)' }} fill="none">
                <rect x="6" y="6" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <rect x="24" y="6" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" opacity=".85" />
                <rect x="6" y="24" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" opacity=".7" />
                <rect x="24" y="24" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3" opacity=".5" />
              </svg>
              <span className="tag">Symbols</span>
            </div>
            <h3>Lab</h3>
            <p>Every symbol&rsquo;s framework in one place — session windows, indicator settings, entry rules. XAUUSD is live; new symbols start from the same template.</p>
            <div className="status"><span>Symbols tracked</span><b>3</b></div>
          </Link>

          <Link className="card" to="/indicators">
            <div className="card-top">
              <svg className="card-icon" viewBox="0 0 44 44" style={{ color: 'var(--brass)' }} fill="none">
                <rect x="6" y="9" width="32" height="19" rx="2" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 3" />
                <line x1="14" y1="13" x2="14" y2="30" stroke="currentColor" strokeWidth="1.6" />
                <rect x="12" y="17" width="4" height="8" fill="currentColor" opacity=".85" />
                <line x1="22" y1="9" x2="22" y2="26" stroke="currentColor" strokeWidth="1.6" />
                <rect x="20" y="13" width="4" height="7" stroke="currentColor" strokeWidth="1.3" />
                <line x1="30" y1="12" x2="30" y2="32" stroke="currentColor" strokeWidth="1.6" />
                <rect x="28" y="19" width="4" height="9" fill="currentColor" opacity=".85" />
                <polyline points="8,24 16,20 24,18 32,15" stroke="currentColor" strokeWidth="1.3" opacity=".55" />
              </svg>
              <span className="tag">Reference</span>
            </div>
            <h3>Indicators</h3>
            <p>What&rsquo;s already running on your TradingView chart — Asian range box, EMAs, anchored VWAP, RSI, Bollinger Bands — and what each one is actually for.</p>
            <div className="status"><span>Documented</span><b>5</b></div>
          </Link>

          <Link className="card" to="/journal">
            <div className="card-top">
              <svg className="card-icon" viewBox="0 0 44 44" style={{ color: 'var(--text)' }} fill="none">
                <path d="M8 10 C8 9 9 8 12 8 L21 8 L21 34 L12 34 C9 34 8 33 8 32 Z" stroke="currentColor" strokeWidth="1.5" opacity=".8" />
                <path d="M36 10 C36 9 35 8 32 8 L23 8 L23 34 L32 34 C35 34 36 33 36 32 Z" stroke="currentColor" strokeWidth="1.5" opacity=".8" />
                <line x1="12" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
                <line x1="12" y1="19" x2="18" y2="19" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
                <line x1="26" y1="14" x2="32" y2="14" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
              </svg>
              <span className="tag">Trade log</span>
            </div>
            <h3>Journal</h3>
            <p>See what&rsquo;s paying by rule, day type, setup and session, broken down daily through all-time.</p>
            <div className="status"><span>Last import</span><b>—</b></div>
          </Link>

          <Link className="card" to="/session-board">
            <div className="card-top">
              <svg className="card-icon" viewBox="0 0 44 44" style={{ color: 'var(--jade)' }} fill="none">
                <circle cx="22" cy="22" r="15" stroke="currentColor" strokeWidth="1.6" />
                <path d="M22 22 L22 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M22 22 L30 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M22 7 A15 15 0 0 1 34 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
                <circle cx="22" cy="22" r="1.6" fill="currentColor" />
              </svg>
              <span className="tag">Live · today</span>
            </div>
            <h3>Session Board</h3>
            <p>Which phase you&rsquo;re in, the Asian and London range, VWAP distance, the pre-entry checklist, and today&rsquo;s trade/loss budget.</p>
            <div className="status"><span>Today&rsquo;s board</span><b>—</b></div>
          </Link>
        </div>
      </section>

      <div className="foot">
        All four pages share this look because they&rsquo;re meant to be used together — link between them with the strip at the top.
        Data now syncs through your account instead of one browser&rsquo;s local storage.
      </div>
    </div>
  );
}
