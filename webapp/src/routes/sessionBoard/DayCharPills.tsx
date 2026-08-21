import type { SessionBoardPatch } from '../../lib/db/sessionBoard';

const DAY_CHARS = ['Trending Bullish Day', 'Trending Bearish Day', 'Choppy Day', 'Reversal Day'];

interface Props {
  dayChar: string | null;
  onPatch: (p: SessionBoardPatch) => void;
}

export function DayCharPills({ dayChar, onPatch }: Props) {
  return (
    <section className="sect">
      <div className="eye">Once you can tell</div>
      <h2>Day character</h2>
      <p className="lede">Usually only clear once London or NY is moving. Setting it here feeds the suggestion cards below.</p>
      <div className="card">
        <div className="pills">
          <button className="sb-pill" data-on={dayChar ? '0' : '1'} onClick={() => onPatch({ dayChar: null })}>Not yet</button>
          {DAY_CHARS.map((c) => (
            <button key={c} className="sb-pill" data-on={dayChar === c ? '1' : '0'} onClick={() => onPatch({ dayChar: c })}>{c}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
