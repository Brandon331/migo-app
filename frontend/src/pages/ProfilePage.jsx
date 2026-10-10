import { useState } from 'react';
import { Mascot } from '../components/Mascot.jsx';
import { MigoStoryScreen } from './MigoStoryScreen.jsx';

export function ProfilePage({ session, onLogout }) {
  const [storyOpen, setStoryOpen] = useState(false);

  if (storyOpen) {
    return <MigoStoryScreen onBack={() => setStoryOpen(false)} />;
  }

  return (
    <div>
      <h1>Perfil</h1>
      <Mascot message="Aquí está lo tuyo. Sin sorpresas." />

      <div className="profile-card">
        <span className="profile-label">Cuenta</span>
        <span className="profile-email">{session?.email || 'Sesión activa'}</span>
      </div>

      <button className="secondary profile-story-button" onClick={() => setStoryOpen(true)}>
        📖 Ver la historia de Migo
      </button>

      <button className="secondary" style={{ width: '100%', marginTop: '0.6rem' }} onClick={onLogout}>
        Cerrar sesión
      </button>

      <p className="profile-footnote">
        Uso el tema claro u oscuro de tu dispositivo, sin preguntarte. Tus metas viven aquí
        primero y se sincronizan solas en cuanto hay señal.
      </p>
    </div>
  );
}
