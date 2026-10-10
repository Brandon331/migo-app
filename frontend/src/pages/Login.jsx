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
      setError('Para la primera entrada necesito internet — ya después sí podemos trabajar sin conexión.');
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
        <span className="eyebrow">El compañero que sí te sigue el paso</span>
        <h1>Migo</h1>
        <p className="lede">Dime qué quieres lograr. Yo le busco la vuelta, lo parto en pasos chicos y te voy picando hasta que lo hagas.</p>
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
          {loading ? 'Dame un segundo...' : mode === 'login' ? 'Entrar' : 'Vamos a esto'}
        </button>
      </form>

      <button
        className="secondary"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Todavía no tengo cuenta' : 'Ya nos conocemos'}
      </button>
    </div>
  );
}
