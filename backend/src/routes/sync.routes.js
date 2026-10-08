import { Router } from 'express';
import { query } from '../db/pool.js';
import { advanceMilestoneIfComplete } from '../services/milestone.service.js';

export const syncRouter = Router();

syncRouter.post('/push', async (req, res) => {
  const { changes } = req.body;
  const results = [];

  for (const change of changes || []) {
    try {
      if (change.entity_type === 'substep' && change.action === 'update') {
        results.push(await applySubstepUpdate(change, req.userId));
      } else if (change.entity_type === 'goal' && change.action === 'update') {
        results.push(await applyGoalUpdate(change, req.userId));
      } else if (change.entity_type === 'goal' && change.action === 'delete') {
        results.push(await applyGoalDelete(change, req.userId));
      } else {
        results.push({ id: change.entity_id, status: 'ignored' });
      }
    } catch (err) {
      results.push({ id: change.entity_id, status: 'error', message: err.message });
    }
  }

  res.json({ results });
});

async function applySubstepUpdate(change, userId) {
  // Verificamos dueño vía join, para que un usuario no pueda tocar substeps ajenos
  const current = await query(
    `SELECT s.updated_at, s.milestone_id, g.user_id
     FROM substeps s
     JOIN milestones m ON m.id = s.milestone_id
     JOIN goals g ON g.id = m.goal_id
     WHERE s.id = $1`,
    [change.entity_id]
  );
  const row = current.rows[0];
  if (!row || row.user_id !== userId) {
    return { id: change.entity_id, status: 'not_found' };
  }

  const clientUpdatedAt = new Date(change.client_updated_at);
  if (row.updated_at && new Date(row.updated_at) > clientUpdatedAt) {
    return { id: change.entity_id, status: 'conflict_server_wins' };
  }

  await query(
    `UPDATE substeps
     SET completed = $1, completed_at = $2, updated_at = now(), client_updated_at = $3
     WHERE id = $4`,
    [
      change.payload.completed,
      change.payload.completed ? clientUpdatedAt : null,
      clientUpdatedAt,
      change.entity_id,
    ]
  );

  if (change.payload.completed) {
    await advanceMilestoneIfComplete(row.milestone_id);
  }

  return { id: change.entity_id, status: 'applied' };
}

async function applyGoalUpdate(change, userId) {
  const current = await query('SELECT updated_at FROM goals WHERE id = $1 AND user_id = $2', [
    change.entity_id,
    userId,
  ]);
  if (!current.rows[0]) return { id: change.entity_id, status: 'not_found' };

  const clientUpdatedAt = new Date(change.client_updated_at);
  if (current.rows[0].updated_at && new Date(current.rows[0].updated_at) > clientUpdatedAt) {
    return { id: change.entity_id, status: 'conflict_server_wins' };
  }

  if (change.payload.status) {
    await query('UPDATE goals SET status = $1, updated_at = now() WHERE id = $2 AND user_id = $3', [
      change.payload.status,
      change.entity_id,
      userId,
    ]);
  }
  return { id: change.entity_id, status: 'applied' };
}

async function applyGoalDelete(change, userId) {
  await query(
    `UPDATE goals SET deleted_at = now(), updated_at = now()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [change.entity_id, userId]
  );
  return { id: change.entity_id, status: 'applied' };
}

/**
 * GET /sync/pull?since=ISO_DATE
 * Trae metas, etapas y pasos chicos modificados después de esa fecha.
 */
syncRouter.get('/pull', async (req, res) => {
  const since = req.query.since || '1970-01-01';

  const goals = await query('SELECT * FROM goals WHERE user_id = $1 AND updated_at > $2', [
    req.userId,
    since,
  ]);

  const milestones = await query(
    `SELECT m.* FROM milestones m
     JOIN goals g ON g.id = m.goal_id
     WHERE g.user_id = $1 AND m.updated_at > $2`,
    [req.userId, since]
  );

  const substeps = await query(
    `SELECT s.* FROM substeps s
     JOIN milestones m ON m.id = s.milestone_id
     JOIN goals g ON g.id = m.goal_id
     WHERE g.user_id = $1 AND s.updated_at > $2`,
    [req.userId, since]
  );

  res.json({
    goals: goals.rows.map((g) => ({ ...g, deleted: g.deleted_at !== null })),
    milestones: milestones.rows,
    substeps: substeps.rows,
    syncedAt: new Date().toISOString(),
  });
});
