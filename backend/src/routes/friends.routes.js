import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db/pool.js';

export const friendsRouter = Router();

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I, menos confusión

function generateCode(length = 6) {
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

async function friendshipExists(userId, friendId) {
  const result = await query(
    'SELECT 1 FROM friendships WHERE user_id = $1 AND friend_id = $2',
    [userId, friendId]
  );
  return result.rows.length > 0;
}

async function buildGoalsSummary(userId) {
  const goalsResult = await query(
    `SELECT id, title, status, target_date FROM goals
     WHERE user_id = $1 AND deleted_at IS NULL AND status != 'archived'
     ORDER BY created_at DESC`,
    [userId]
  );
  const goals = goalsResult.rows;
  if (goals.length === 0) return { goals: [], didSomethingToday: false };

  const goalIds = goals.map((g) => g.id);
  const milestonesResult = await query(
    'SELECT * FROM milestones WHERE goal_id = ANY($1)',
    [goalIds]
  );
  const milestones = milestonesResult.rows;
  const milestoneIds = milestones.map((m) => m.id);

  let substeps = [];
  if (milestoneIds.length > 0) {
    const substepsResult = await query(
      'SELECT * FROM substeps WHERE milestone_id = ANY($1)',
      [milestoneIds]
    );
    substeps = substepsResult.rows;
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const didSomethingToday = substeps.some(
    (s) => s.completed && s.completed_at && s.completed_at.toISOString().slice(0, 10) === todayKey
  );

  const goalsWithPct = goals.map((g) => {
    const goalMilestones = milestones.filter((m) => m.goal_id === g.id);
    const total = goalMilestones.length;
    const done = goalMilestones.filter((m) => m.status === 'completed').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { id: g.id, title: g.title, status: g.status, targetDate: g.target_date, pct };
  });

  return { goals: goalsWithPct, didSomethingToday };
}

// POST /friends/invite -> genera un código para compartir (link o código a mano)
friendsRouter.post('/invite', async (req, res) => {
  let code;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode();
    const existing = await query('SELECT 1 FROM friend_invites WHERE code = $1', [code]);
    if (existing.rows.length === 0) break;
    code = null;
  }
  if (!code) return res.status(500).json({ error: 'No se pudo generar un código, intenta de nuevo' });

  await query('INSERT INTO friend_invites (code, created_by) VALUES ($1, $2)', [code, req.userId]);
  res.status(201).json({ code });
});

// POST /friends/accept -> { code } conecta con quien generó el código
friendsRouter.post('/accept', async (req, res) => {
  const { code } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'code es requerido' });
  }

  const inviteResult = await query(
    'SELECT * FROM friend_invites WHERE code = $1 AND used_by IS NULL',
    [code.trim().toUpperCase()]
  );
  const invite = inviteResult.rows[0];
  if (!invite) {
    return res.status(404).json({ error: 'Código inválido o ya usado' });
  }
  if (invite.created_by === req.userId) {
    return res.status(400).json({ error: 'Ese es tu propio código' });
  }

  const already = await friendshipExists(req.userId, invite.created_by);
  if (already) {
    return res.status(409).json({ error: 'Ya son amigos' });
  }

  // La inserción de ambas direcciones va en un solo INSERT multi-fila, así
  // que ya es atómica sin necesitar una transacción aparte sobre el pool
  // compartido (cada query() puede tomar una conexión distinta del pool).
  await query(
    'INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
    [req.userId, invite.created_by]
  );
  await query('UPDATE friend_invites SET used_by = $1, used_at = now() WHERE id = $2', [
    req.userId,
    invite.id,
  ]);

  const friendResult = await query('SELECT id, email, character FROM users WHERE id = $1', [
    invite.created_by,
  ]);
  res.status(201).json({ friend: friendResult.rows[0] });
});

// GET /friends -> lista de amigos con su personaje y resumen de progreso
friendsRouter.get('/', async (req, res) => {
  const friendsResult = await query(
    `SELECT u.id, u.email, u.character
     FROM friendships f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = $1
     ORDER BY u.email ASC`,
    [req.userId]
  );

  const friends = [];
  for (const friend of friendsResult.rows) {
    const summary = await buildGoalsSummary(friend.id);
    friends.push({ ...friend, ...summary });
  }

  res.json(friends);
});

// GET /friends/:friendId/goals -> camino completo de un amigo, de solo lectura
friendsRouter.get('/:friendId/goals', async (req, res) => {
  const { friendId } = req.params;

  const isFriend = await friendshipExists(req.userId, friendId);
  if (!isFriend) {
    return res.status(403).json({ error: 'No son amigos' });
  }

  const goalsResult = await query(
    `SELECT * FROM goals WHERE user_id = $1 AND deleted_at IS NULL AND status != 'archived'
     ORDER BY created_at DESC`,
    [friendId]
  );
  const goals = goalsResult.rows;
  const goalIds = goals.map((g) => g.id);

  let milestones = [];
  let substeps = [];
  if (goalIds.length > 0) {
    const milestonesResult = await query(
      'SELECT * FROM milestones WHERE goal_id = ANY($1) ORDER BY order_index ASC',
      [goalIds]
    );
    milestones = milestonesResult.rows;

    const milestoneIds = milestones.map((m) => m.id);
    if (milestoneIds.length > 0) {
      const substepsResult = await query(
        'SELECT * FROM substeps WHERE milestone_id = ANY($1) ORDER BY order_index ASC',
        [milestoneIds]
      );
      substeps = substepsResult.rows;
    }
  }

  const goalsWithPath = goals.map((goal) => ({
    ...goal,
    milestones: milestones
      .filter((m) => m.goal_id === goal.id)
      .map((m) => ({ ...m, substeps: substeps.filter((s) => s.milestone_id === m.id) })),
  }));

  res.json(goalsWithPath);
});

export default friendsRouter;
