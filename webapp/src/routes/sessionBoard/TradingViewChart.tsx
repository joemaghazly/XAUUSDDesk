import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView?: { widget: new (config: Record<string, unknown>) => unknown };
  }
}

// Read-only, free, no account needed -- doesn't feed the fields on this
// page. Ported from session-board.html's loadChart().
export function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      try {
        new window.TradingView!.widget({
          autosize: true,
          symbol: 'OANDA:XAUUSD',
          interval: '5',
          timezone: 'Asia/Beirut',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1E1B16',
          enable_publishing: false,
          hide_top_toolbar: false,
          allow_symbol_change: true,
          container_id: container.id,
        });
      } catch {
        container.innerHTML = '<div style="padding:20px;color:#948A78;font-family:IBM Plex Mono,monospace;font-size:12px">Chart failed to initialize.</div>';
      }
    };
    script.onerror = () => {
      container.innerHTML = '<div style="padding:20px;color:#948A78;font-family:IBM Plex Mono,monospace;font-size:12px">Could not load the TradingView widget — check your connection.</div>';
    };
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <section className="sect">
      <div className="eye">Live · TradingView</div>
      <h2>Chart</h2>
      <p className="lede">
        A real TradingView chart with live quotes — free, no account needed. It&rsquo;s view-only: it doesn&rsquo;t feed
        the fields below. Chart data and the numbers you enter are two separate things, on purpose.
      </p>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 480 }}>
          <div id="tv_chart" ref={containerRef} style={{ height: '100%' }} />
        </div>
      </div>
      <div className="hint" style={{ marginTop: 10 }}>
        Read-only chart. Nothing on this page auto-fills from it — the Asian range, VWAP, and price fields still need
        to be entered by hand or applied from the live read below.
      </div>
    </section>
  );
}
