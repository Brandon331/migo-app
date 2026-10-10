import { useEffect, useState } from 'react';
import { getSession, clearSession } from './db.js';
import { Login } from './pages/Login.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { GoalsList } from './pages/GoalsList.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { ChatPage } from './pages/ChatPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { useSync } from './hooks/useSync.js';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('home');
  const [chatGoalId, setChatGoalId] = useState(null);
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

  function goToChatForGoal(goalId) {
    setChatGoalId(goalId);
    setTab('chat');
  }

  function handleTabChange(nextTab) {
    if (nextTab === 'chat') setChatGoalId(null);
    setTab(nextTab);
  }

  return (
    <div className="app-shell">
      <div className="app-content">
        {tab === 'home' && <HomePage onGoToMetas={() => setTab('metas')} />}
        {tab === 'metas' && (
          <GoalsList isOnline={isOnline} isSyncing={isSyncing} onChatAboutGoal={goToChatForGoal} />
        )}
        {tab === 'progress' && <ProgressPage />}
        {tab === 'chat' && (
          <ChatPage isOnline={isOnline} goalId={chatGoalId} onSelectGoal={setChatGoalId} />
        )}
        {tab === 'profile' && <ProfilePage session={session} onLogout={handleLogout} />}
      </div>
      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  );
}
