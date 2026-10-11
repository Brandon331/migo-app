import { Router } from 'express';
import { query } from '../db/pool.js';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();

export const CHARACTERS = ['rat', 'cat', 'dog', 'fox', 'panda', 'owl'];

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

// GET /auth/me -> datos propios (incluye el personaje elegido)
authRouter.get('/me', requireAuth, async (req, res) => {
  const result = await query('SELECT id, email, character FROM users WHERE id = $1', [req.userId]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

// PATCH /auth/me -> elegir/cambiar personaje (rata, gato, perro, zorro, panda, búho)
authRouter.patch('/me', requireAuth, async (req, res) => {
  const { character } = req.body;
  if (!CHARACTERS.includes(character)) {
    return res.status(400).json({ error: `character debe ser uno de: ${CHARACTERS.join(', ')}` });
  }
  const result = await query(
    'UPDATE users SET character = $1 WHERE id = $2 RETURNING id, email, character',
    [character, req.userId]
  );
  res.json(result.rows[0]);
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
