import { Router } from 'express';
import { query } from '../db/pool.js';
import { breakdownAndSaveMilestone } from '../services/milestone.service.js';

export const milestonesRouter = Router();

// POST /milestones/:id/retry-breakdown -> reintenta pedirle a la IA los
// pasos chicos de esta etapa (solo tiene sentido si está activa y se quedó
// pending_ai_breakdown=true, por ejemplo porque falló la llamada anterior)
milestonesRouter.post('/:id/retry-breakdown', async (req, res) => {
  const { id } = req.params;

  const milestoneResult = await query(
    `SELECT m.*, g.title AS goal_title, g.user_id
     FROM milestones m JOIN goals g ON g.id = m.goal_id
     WHERE m.id = $1`,
    [id]
  );
  const milestone = milestoneResult.rows[0];

  if (!milestone || milestone.user_id !== req.userId) {
    return res.status(404).json({ error: 'Etapa no encontrada' });
  }

  const substeps = await breakdownAndSaveMilestone(milestone.id, milestone.goal_title, milestone.title);
  res.json({ ...milestone, substeps });
});
