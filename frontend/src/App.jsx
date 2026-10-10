import { useEffect, useState } from 'react';
import { getSession, clearSession } from './db.js';
import { Login } from './pages/Login.jsx';
import { GoalsList } from './pages/GoalsList.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { ChatPage } from './pages/ChatPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { useSync } from './hooks/useSync.js';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('goals');
  const { isOnline, isSyncing } = useSync();

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  if (session === undefined) return null;

  if (!session) {
    return <Login onAuthenticated={() => getSession().then(setSession)} />;
  }

  async function handleLogout() {
    await clearSession();
    setSession(null);
  }

  return (
    <div className="app-shell">
      <div className="app-content">
        {tab === 'goals' && <GoalsList isOnline={isOnline} isSyncing={isSyncing} />}
        {tab === 'progress' && <ProgressPage />}
        {tab === 'chat' && <ChatPage isOnline={isOnline} />}
        {tab === 'profile' && <ProfilePage session={session} onLogout={handleLogout} />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
