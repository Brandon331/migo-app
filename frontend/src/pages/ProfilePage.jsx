import { Mascot } from '../components/Mascot.jsx';

export function ProfilePage({ session, onLogout }) {
  return (
    <div>
      <h1>Perfil</h1>
      <Mascot message="Aquí puedes ver tu cuenta y cerrar sesión." />

      <div className="profile-card">
        <span className="profile-label">Cuenta</span>
        <span className="profile-email">{session?.email || 'Sesión activa'}</span>
      </div>

      <button className="secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={onLogout}>
        Cerrar sesión
      </button>

      <p className="profile-footnote">
        Migo sigue el tema claro u oscuro de tu dispositivo. Tus metas se guardan en este
        dispositivo y se sincronizan solas cuando hay conexión.
      </p>
    </div>
  );
}
