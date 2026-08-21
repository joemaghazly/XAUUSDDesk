import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { DeskNav } from './components/DeskNav';
import { Home } from './routes/Home';
import { Lab } from './routes/Lab';
import { Indicators } from './routes/Indicators';
import { JournalPage } from './routes/journal/JournalPage';
import { SessionBoardPage } from './routes/sessionBoard/SessionBoardPage';

function DeskLayout() {
  return (
    <>
      <DeskNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/indicators" element={<Indicators />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/session-board" element={<SessionBoardPage />} />
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
