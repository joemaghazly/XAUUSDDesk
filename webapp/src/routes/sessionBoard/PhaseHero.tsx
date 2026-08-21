import { useEffect, useState } from 'react';
import { beirutParts, nextBoundary, pad, phaseFor, type Phase } from '../../lib/beirut';

const COUNTDOWN_LABEL: Record<Phase['id'], string> = {
  asian: 'until London',
  london: 'until the VWAP anchor',
  exec: 'until Asian range resets',
  eod: 'until Asian range opens',
};

export function PhaseHero() {
  const [time, setTime] = useState('--:--:--');
  const [phase, setPhase] = useState<Phase>(phaseFor(0));
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    function tick() {
      const t = beirutParts();
      setTime(`${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`);
      const ph = phaseFor(t.h);
      setPhase(ph);
      const mins = nextBoundary(t.h, t.m);
      const secLeft = 60 - t.s;
      const hh = Math.floor((mins - 1) / 60);
      const mm = (mins - 1) % 60;
      setCountdown(`${pad(hh)}:${pad(mm)}:${pad(secLeft === 60 ? 0 : secLeft)}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero">
      <div className="hero-eye">On the desk right now</div>
      <div className="hero-time">{time}</div>
      <div className="hero-phase">
        <span className={`dot ${phase.cls}`} />
        <span>{phase.name}</span>
      </div>
      <div className="hero-note">{phase.note}</div>
      <div className="countdown"><b>{countdown}</b> {COUNTDOWN_LABEL[phase.id]}</div>
    </section>
  );
}
