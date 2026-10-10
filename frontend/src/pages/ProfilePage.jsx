import { Mascot } from '../components/Mascot.jsx';

export function ProfilePage({ session, onLogout }) {
  return (
    <div>
      <h1>Perfil</h1>
      <Mascot message="Aquí está lo tuyo. Sin sorpresas." />

      <div className="profile-card">
        <span className="profile-label">Cuenta</span>
        <span className="profile-email">{session?.email || 'Sesión activa'}</span>
      </div>

      <button className="secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={onLogout}>
        Cerrar sesión
      </button>

      <p className="profile-footnote">
        Uso el tema claro u oscuro de tu dispositivo, sin preguntarte. Tus metas viven aquí
        primero y se sincronizan solas en cuanto hay señal.
      </p>
    </div>
  );
}
