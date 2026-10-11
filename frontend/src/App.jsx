import { useEffect, useState } from 'react';
import { getSession, clearSession, clearLocalData } from './db.js';
import { Login } from './pages/Login.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { GoalsList } from './pages/GoalsList.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { ChatPage } from './pages/ChatPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { FriendsPage } from './pages/FriendsPage.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { SideMenu } from './components/SideMenu.jsx';
import { useSync } from './hooks/useSync.js';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('home');
  const [chatGoalId, setChatGoalId] = useState(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const { isOnline, isSyncing } = useSync();

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  if (session === undefined) return null;

  if (!session) {
    return <Login onAuthenticated={() => getSession().then(setSession)} />;
  }

  async function handleLogout() {
    // Limpiamos los datos locales primero: si no, la próxima cuenta que
    // entre en este dispositivo ve las metas, el progreso y los chats de
    // esta cuenta.
    await clearLocalData();
    await clearSession();
    setTab('home');
    setChatGoalId(null);
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
      <button className="side-menu-trigger" onClick={() => setSideMenuOpen(true)} aria-label="Más secciones">
        ☰
      </button>

      <SideMenu
        open={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        active={tab}
        onNavigate={setTab}
      />

      <div className="app-content">
        {tab === 'home' && <HomePage onGoToMetas={() => setTab('metas')} />}
        {tab === 'metas' && (
          <GoalsList isOnline={isOnline} isSyncing={isSyncing} onChatAboutGoal={goToChatForGoal} />
        )}
        {tab === 'progress' && <ProgressPage />}
        {tab === 'chat' && (
          <ChatPage isOnline={isOnline} goalId={chatGoalId} onSelectGoal={setChatGoalId} />
        )}
        {tab === 'profile' && (
          <ProfilePage session={session} onLogout={handleLogout} isOnline={isOnline} />
        )}
        {tab === 'friends' && <FriendsPage isOnline={isOnline} />}
      </div>

      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  );
}
