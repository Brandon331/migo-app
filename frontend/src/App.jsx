import { useEffect, useState } from 'react';
import { getSession, clearSession } from './db.js';
import { Login } from './pages/Login.jsx';
import { GoalsList } from './pages/GoalsList.jsx';
import { useSync } from './hooks/useSync.js';

export default function App() {
  const [session, setSession] = useState(undefined);
  const { isOnline, isSyncing } = useSync();

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  if (session === undefined) return null;

  if (!session) {
    return <Login onAuthenticated={() => getSession().then(setSession)} />;
  }

  return (
    <div>
      <GoalsList isOnline={isOnline} isSyncing={isSyncing} />
      <div className="app-footer">
        <button
          className="secondary"
          onClick={async () => {
            await clearSession();
            setSession(null);
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
