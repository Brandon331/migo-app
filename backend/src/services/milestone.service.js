import { query } from '../db/pool.js';
import { generateMilestones, breakDownMilestone } from './ai.service.js';

/**
 * Le pide a la IA el camino completo y lo guarda. La primera etapa queda
 * "active" (y se le pide su desglose de una vez); el resto queda "locked".
 * Si la IA falla, igual deja la meta usable: el usuario puede reintentar.
 */
export async function createPathForGoal(goalId, goalTitle) {
  const milestonesData = await generateMilestones(goalTitle);

  const inserted = [];
  for (let i = 0; i < milestonesData.length; i++) {
    const m = milestonesData[i];
    const status = i === 0 ? 'active' : 'locked';
    const result = await query(
      `INSERT INTO milestones (goal_id, title, description, order_index, status, pending_ai_breakdown)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [goalId, m.title, m.description || null, i, status, i === 0]
    );
    inserted.push(result.rows[0]);
  }

  if (inserted.length > 0) {
    const first = inserted[0];
    const substeps = await breakdownAndSaveMilestone(first.id, goalTitle, first.title);
    first.substeps = substeps;
    first.pending_ai_breakdown = false;
  }

  for (let i = 1; i < inserted.length; i++) {
    inserted[i].substeps = [];
  }

  return inserted;
}

export async function breakdownAndSaveMilestone(milestoneId, goalTitle, milestoneTitle) {
  const stepsData = await breakDownMilestone(goalTitle, milestoneTitle);

  const inserted = [];
  for (let i = 0; i < stepsData.length; i++) {
    const s = stepsData[i];
    const result = await query(
      `INSERT INTO substeps (milestone_id, title, description, order_index)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [milestoneId, s.title, s.description || null, i]
    );
    inserted.push(result.rows[0]);
  }

  await query('UPDATE milestones SET pending_ai_breakdown = false, updated_at = now() WHERE id = $1', [
    milestoneId,
  ]);

  return inserted;
}

/**
 * Se llama cuando se detecta que todos los substeps de la etapa activa
 * quedaron completos: la cierra, activa la siguiente y le pide su desglose.
 * Si no hay siguiente etapa, la meta completa queda "completed".
 */
export async function advanceMilestoneIfComplete(milestoneId) {
  const milestoneResult = await query('SELECT * FROM milestones WHERE id = $1', [milestoneId]);
  const milestone = milestoneResult.rows[0];
  if (!milestone || milestone.status !== 'active') return null;

  const pending = await query(
    'SELECT COUNT(*)::int AS n FROM substeps WHERE milestone_id = $1 AND completed = false',
    [milestoneId]
  );
  const total = await query('SELECT COUNT(*)::int AS n FROM substeps WHERE milestone_id = $1', [
    milestoneId,
  ]);
  if (total.rows[0].n === 0 || pending.rows[0].n > 0) return null;

  await query(
    "UPDATE milestones SET status = 'completed', updated_at = now() WHERE id = $1",
    [milestoneId]
  );

  const goalResult = await query('SELECT * FROM goals WHERE id = $1', [milestone.goal_id]);
  const goal = goalResult.rows[0];

  const nextResult = await query(
    'SELECT * FROM milestones WHERE goal_id = $1 AND order_index = $2',
    [milestone.goal_id, milestone.order_index + 1]
  );
  const next = nextResult.rows[0];

  if (!next) {
    await query("UPDATE goals SET status = 'completed', updated_at = now() WHERE id = $1", [
      goal.id,
    ]);
    return { goalCompleted: true };
  }

  await query(
    "UPDATE milestones SET status = 'active', pending_ai_breakdown = true, updated_at = now() WHERE id = $1",
    [next.id]
  );

  try {
    await breakdownAndSaveMilestone(next.id, goal.title, next.title);
  } catch (err) {
    console.error('Error desglosando siguiente etapa:', err.message);
    // pending_ai_breakdown se queda en true; el cliente puede reintentar
  }

  return { nextMilestoneId: next.id };
}
