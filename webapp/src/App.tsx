import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { DeskNav } from './components/DeskNav';
import { Home } from './routes/Home';
import { Stub } from './routes/Stub';

function DeskLayout() {
  return (
    <>
      <DeskNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lab" element={<Stub eye="Symbol frameworks" title="The Lab" note="Coming in a later phase — session windows, indicator settings, entry rules per symbol." />} />
        <Route path="/indicators" element={<Stub eye="XAUUSD · already built" title="Indicators" note="Coming in a later phase — a written reference for what each chart indicator is for." />} />
        <Route path="/journal" element={<Stub eye="Trade log" title="Journal" note="Coming in a later phase — the full trade log, imports and analytics." />} />
        <Route path="/session-board" element={<Stub eye="Live · today" title="Session Board" note="Coming in a later phase — the live session desk." />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequireAuth>
        <BrowserRouter>
          <DeskLayout />
        </BrowserRouter>
      </RequireAuth>
    </AuthProvider>
  );
}
