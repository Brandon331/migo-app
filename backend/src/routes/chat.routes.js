import { Router } from 'express';
import { query } from '../db/pool.js';
import { chatWithMigo } from '../services/ai.service.js';

export const chatRouter = Router();

const HISTORY_LIMIT = 20;

async function buildGeneralGoalsContext(userId) {
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

  return `Esta es la vista general de TODAS las metas de la persona:\n${lines.join('\n')}`;
}

async function buildGoalScopedContext(userId, goalId) {
  const goalResult = await query(
    `SELECT * FROM goals WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [goalId, userId]
  );
  const goal = goalResult.rows[0];
  if (!goal) return null;

  const milestonesResult = await query(
    `SELECT * FROM milestones WHERE goal_id = $1 ORDER BY order_index ASC`,
    [goalId]
  );
  const milestones = milestonesResult.rows;
  const milestoneIds = milestones.map((m) => m.id);

  let substeps = [];
  if (milestoneIds.length > 0) {
    const substepsResult = await query(
      `SELECT * FROM substeps WHERE milestone_id = ANY($1) ORDER BY order_index ASC`,
      [milestoneIds]
    );
    substeps = substepsResult.rows;
  }

  const milestoneLines = milestones.map((m) => {
    const ms = substeps.filter((s) => s.milestone_id === m.id);
    const doneCount = ms.filter((s) => s.completed).length;
    const stepsText = m.status === 'active' && ms.length > 0
      ? ` — pasos: ${ms.map((s) => `${s.completed ? '✓' : '○'} ${s.title}`).join('; ')}`
      : '';
    return `  ${m.order_index + 1}. [${m.status}] ${m.title} (${doneCount}/${ms.length} pasos)${stepsText}`;
  });

  return (
    `Están hablando específicamente sobre esta meta — concéntrate en ella, no en las demás:\n` +
    `Meta: "${goal.title}" (${goal.status})\n` +
    (goal.target_date ? `Fecha objetivo: ${goal.target_date.toISOString().slice(0, 10)}\n` : '') +
    `Camino:\n${milestoneLines.join('\n')}`
  );
}

// GET /chat?goalId=<uuid opcional> -> historial reciente (general o de una meta)
chatRouter.get('/', async (req, res) => {
  const { goalId } = req.query;
  const result = await query(
    goalId
      ? `SELECT id, role, content, goal_id, created_at FROM chat_messages
         WHERE user_id = $1 AND goal_id = $2 ORDER BY created_at ASC LIMIT 200`
      : `SELECT id, role, content, goal_id, created_at FROM chat_messages
         WHERE user_id = $1 AND goal_id IS NULL ORDER BY created_at ASC LIMIT 200`,
    goalId ? [req.userId, goalId] : [req.userId]
  );
  res.json(result.rows);
});

// GET /chat/threads -> lista de metas que ya tienen al menos un mensaje, para armar el índice de chats
chatRouter.get('/threads', async (req, res) => {
  const result = await query(
    `SELECT g.id AS goal_id, g.title, MAX(c.created_at) AS last_message_at
     FROM chat_messages c
     JOIN goals g ON g.id = c.goal_id
     WHERE c.user_id = $1 AND c.goal_id IS NOT NULL
     GROUP BY g.id, g.title
     ORDER BY last_message_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
});

// POST /chat -> manda un mensaje, Migo responde. Body: { message, goalId? }
chatRouter.post('/', async (req, res) => {
  const { message, goalId } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message es requerido' });
  }

  let goalsContext;
  if (goalId) {
    goalsContext = await buildGoalScopedContext(req.userId, goalId);
    if (goalsContext === null) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }
  } else {
    goalsContext = await buildGeneralGoalsContext(req.userId);
  }

  const historyResult = await query(
    goalId
      ? `SELECT role, content FROM chat_messages WHERE user_id = $1 AND goal_id = $2
         ORDER BY created_at DESC LIMIT $3`
      : `SELECT role, content FROM chat_messages WHERE user_id = $1 AND goal_id IS NULL
         ORDER BY created_at DESC LIMIT $2`,
    goalId ? [req.userId, goalId, HISTORY_LIMIT] : [req.userId, HISTORY_LIMIT]
  );
  const history = historyResult.rows.reverse();

  const userMsgResult = await query(
    `INSERT INTO chat_messages (user_id, goal_id, role, content) VALUES ($1, $2, 'user', $3) RETURNING *`,
    [req.userId, goalId || null, message.trim()]
  );

  let replyText;
  try {
    replyText = await chatWithMigo(history, message.trim(), goalsContext);
  } catch (err) {
    console.error('Error en chat con IA:', err.message);
    return res.status(502).json({ error: 'No pude responder ahorita, intenta de nuevo en un momento.' });
  }

  const assistantMsgResult = await query(
    `INSERT INTO chat_messages (user_id, goal_id, role, content) VALUES ($1, $2, 'assistant', $3) RETURNING *`,
    [req.userId, goalId || null, replyText]
  );

  res.status(201).json({
    userMessage: userMsgResult.rows[0],
    reply: assistantMsgResult.rows[0],
  });
});

export default chatRouter;
