// Agrupa las etapas (milestones) ya generadas por semana o por mes, usando su
// due_date relativo a cuándo se creó la meta. Metas cortas (1 semana / 1 mes)
// se agrupan por semana; metas largas (3 meses / 6 meses o más) por mes.
export function groupMilestonesByTime(goal, milestones) {
  if (!goal?.createdAt || milestones.length === 0) {
    return [{ key: 'all', label: 'Tu camino', milestones }];
  }

  const start = new Date(goal.createdAt);
  start.setHours(0, 0, 0, 0);

  const useMonths = goal.durationLabel === '3_months' || goal.durationLabel === '6_months_plus';
  const bucketSizeDays = useMonths ? 30 : 7;

  const buckets = new Map();
  const noDate = [];

  for (const m of milestones) {
    if (!m.dueDate) {
      noDate.push(m);
      continue;
    }
    const due = new Date(m.dueDate);
    const diffDays = Math.max(0, Math.round((due - start) / (1000 * 60 * 60 * 24)));
    const bucketIndex = Math.floor(diffDays / bucketSizeDays);
    if (!buckets.has(bucketIndex)) buckets.set(bucketIndex, []);
    buckets.get(bucketIndex).push(m);
  }

  const sortedKeys = [...buckets.keys()].sort((a, b) => a - b);
  const groups = sortedKeys.map((k) => ({
    key: `bucket-${k}`,
    label: useMonths ? `Mes ${k + 1}` : `Semana ${k + 1}`,
    milestones: buckets.get(k),
  }));

  if (noDate.length > 0) {
    groups.push({ key: 'no-date', label: 'Sin fecha todavía', milestones: noDate });
  }

  return groups;
}
