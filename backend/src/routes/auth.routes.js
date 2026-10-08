import { Router } from 'express';
import { query } from '../db/pool.js';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../services/auth.service.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos' });
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Ese correo ya está registrado' });
  }

  const passwordHash = await hashPassword(password);

  const result = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );

  const user = result.rows[0];

  res.status(201).json({
    user,
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await query('SELECT id, email, password_hash FROM users WHERE email = $1', [
    email,
  ]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const validPassword = await comparePassword(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json({
    user: { id: user.id, email: user.email },
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  });
});

authRouter.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken requerido' });
  }

  try {
    const payload = verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    res.json({ accessToken: signAccessToken(payload.sub) });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
});
