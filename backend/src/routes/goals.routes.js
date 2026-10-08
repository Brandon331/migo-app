import { Router } from 'express';
import { query } from '../db/pool.js';
import { createPathForGoal } from '../services/milestone.service.js';

export const goalsRouter = Router();

// GET /goals -> metas con sus etapas (milestones) y, dentro, sus substeps
goalsRouter.get('/', async (req, res) => {
  const goals = await query(
    'SELECT * FROM goals WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
    [req.userId]
  );

  const goalIds = goals.rows.map((g) => g.id);
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

  const goalsWithPath = goals.rows.map((goal) => ({
    ...goal,
    milestones: milestones
      .filter((m) => m.goal_id === goal.id)
      .map((m) => ({ ...m, substeps: substeps.filter((s) => s.milestone_id === m.id) })),
  }));

  res.json(goalsWithPath);
});

// POST /goals -> crea la meta, genera el camino completo con IA,
// y desglosa solo la primera etapa en pasos chicos
goalsRouter.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'title es requerido' });
  }

  const goalResult = await query(
    'INSERT INTO goals (user_id, title) VALUES ($1, $2) RETURNING *',
    [req.userId, title]
  );
  const goal = goalResult.rows[0];

  let milestones = [];
  try {
    milestones = await createPathForGoal(goal.id, title);
  } catch (err) {
    console.error('Error generando el camino con IA:', err.message);
    // la meta queda creada sin camino; el cliente puede reintentar
  }

  res.status(201).json({ ...goal, milestones });
});

// POST /goals/:id/retry-path -> reintenta generar el camino completo
// (solo tiene sentido si la meta no tiene ninguna etapa todavía)
goalsRouter.post('/:id/retry-path', async (req, res) => {
  const { id } = req.params;

  const goalResult = await query(
    'SELECT * FROM goals WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [id, req.userId]
  );
  const goal = goalResult.rows[0];
  if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });

  const existing = await query('SELECT id FROM milestones WHERE goal_id = $1 LIMIT 1', [id]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Esta meta ya tiene un camino generado' });
  }

  const milestones = await createPathForGoal(goal.id, goal.title);
  res.json({ ...goal, milestones });
});

// PATCH /goals/:id -> cambia status (ej. archivar)
goalsRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'completed', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'status inválido' });
  }

  const result = await query(
    `UPDATE goals SET status = $1, updated_at = now()
     WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [status, id, req.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Meta no encontrada' });

  res.json(result.rows[0]);
});

// DELETE /goals/:id -> borrado suave
goalsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `UPDATE goals SET deleted_at = now(), updated_at = now()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, req.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Meta no encontrada' });

  res.status(204).send();
});
