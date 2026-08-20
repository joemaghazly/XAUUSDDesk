import { Link, useLocation } from 'react-router-dom';

const ITEMS: Array<{ to: string; label: string }> = [
  { to: '/lab', label: 'Lab' },
  { to: '/indicators', label: 'Indicators' },
  { to: '/journal', label: 'Journal' },
  { to: '/session-board', label: 'Session Board' },
];

export function DeskNav() {
  const { pathname } = useLocation();
  return (
    <div className="desknav">
      <div className="desknav-in">
        <Link to="/" className="desknav-mark">
          <span className="ingot" />THE DESK
        </Link>
        {ITEMS.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="desknav-item"
            data-here={pathname === it.to ? '1' : '0'}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
