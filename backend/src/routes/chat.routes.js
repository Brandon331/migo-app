import { Router } from 'express';
import { query } from '../db/pool.js';
import { chatWithMigo } from '../services/ai.service.js';

export const chatRouter = Router();

const HISTORY_LIMIT = 20;

async function buildGoalsContext(userId) {
  const goalsResult = await query(
    `SELECT id, title, status, duration_label, weekly_commitment, target_date
     FROM goals WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
    [userId]
  );
  const goals = goalsResult.rows;
  if (goals.length === 0) return '';

  const goalIds = goals.map((g) => g.id);
  const milestonesResult = await query(
    `SELECT * FROM milestones WHERE goal_id = ANY($1) ORDER BY order_index ASC`,
    [goalIds]
  );
  const milestones = milestonesResult.rows;

  const lines = goals.map((g) => {
    const goalMilestones = milestones.filter((m) => m.goal_id === g.id);
    const active = goalMilestones.find((m) => m.status === 'active');
    const done = goalMilestones.filter((m) => m.status === 'completed').length;
    const total = goalMilestones.length;
    return (
      `- "${g.title}" (${g.status}), ${done}/${total} etapas completadas` +
      (active ? `, etapa activa ahora: "${active.title}"` : '') +
      (g.target_date ? `, fecha objetivo: ${g.target_date.toISOString().slice(0, 10)}` : '')
    );
  });

  return lines.join('\n');
}

// GET /chat -> historial reciente
chatRouter.get('/', async (req, res) => {
  const result = await query(
    `SELECT id, role, content, created_at FROM chat_messages
     WHERE user_id = $1 ORDER BY created_at ASC LIMIT 200`,
    [req.userId]
  );
  res.json(result.rows);
});

// POST /chat -> manda un mensaje, Migo responde
chatRouter.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message es requerido' });
  }

  const historyResult = await query(
    `SELECT role, content FROM chat_messages WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [req.userId, HISTORY_LIMIT]
  );
  const history = historyResult.rows.reverse();

  const goalsContext = await buildGoalsContext(req.userId);

  const userMsgResult = await query(
    `INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'user', $2) RETURNING *`,
    [req.userId, message.trim()]
  );

  let replyText;
  try {
    replyText = await chatWithMigo(history, message.trim(), goalsContext);
  } catch (err) {
    console.error('Error en chat con IA:', err.message);
    return res.status(502).json({ error: 'No pude responder ahorita, intenta de nuevo en un momento.' });
  }

  const assistantMsgResult = await query(
    `INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'assistant', $2) RETURNING *`,
    [req.userId, replyText]
  );

  res.status(201).json({
    userMessage: userMsgResult.rows[0],
    reply: assistantMsgResult.rows[0],
  });
});

export default chatRouter;
