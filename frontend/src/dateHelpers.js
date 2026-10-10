export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

// Compara cuánto tiempo ya pasó contra cuánto se ha avanzado realmente, para
// que el contador de días no sea solo una cuenta regresiva ciega: si vas
// atrasado respecto al plan, se nota aunque todavía falten días.
export function computePaceStatus(goal, milestones) {
  if (!goal?.createdAt || !goal?.targetDate || !milestones || milestones.length === 0) return null;

  const start = new Date(goal.createdAt);
  start.setHours(0, 0, 0, 0);
  const target = new Date(goal.targetDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, (target - start) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.min(totalDays, Math.max(0, (today - start) / (1000 * 60 * 60 * 24)));
  if (elapsedDays < 1) return 'on-track';

  const expectedFraction = elapsedDays / totalDays;
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const actualFraction = completed / milestones.length;
  const delta = actualFraction - expectedFraction;

  if (delta < -0.15) return 'behind';
  if (delta > 0.15) return 'ahead';
  return 'on-track';
}
