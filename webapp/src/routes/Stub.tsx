interface StubProps {
  eye: string;
  title: string;
  note: string;
}

// Placeholder pages for phase 1 — routing/nav/auth scaffold only. Real
// content lands in phases 3, 4 and 6 per the migration plan.
export function Stub({ eye, title, note }: StubProps) {
  return (
    <div className="wrap">
      <div className="top" style={{ padding: '26px 0 0' }}>
        <div className="eye">{eye}</div>
        <h2>{title}</h2>
        <p className="lede">{note}</p>
      </div>
    </div>
  );
}
