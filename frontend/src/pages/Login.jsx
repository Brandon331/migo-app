import { useState } from 'react';
import { loginAndPersist, registerAndPersist } from '../api.js';

export function Login({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!navigator.onLine) {
      setError('Necesitas conexión a internet para iniciar sesión la primera vez.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginAndPersist(email, password);
      } else {
        await registerAndPersist(email, password);
      }
      onAuthenticated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div>
        <span className="eyebrow">Tu compañero de metas</span>
        <h1>Migo</h1>
        <p className="lede">Escribe una meta. Migo te traza el camino y te desglosa cada etapa en pasos chicos, una a la vez.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Un momento...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <button
        className="secondary"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'No tengo cuenta todavía' : 'Ya tengo cuenta'}
      </button>
    </div>
  );
}
