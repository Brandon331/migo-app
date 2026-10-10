import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';
import { computeStreaks } from '../streak.js';

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export function ProgressPage() {
  const goals = useLiveQuery(() => db.goals.toArray(), []);
  const milestones = useLiveQuery(() => db.milestones.toArray(), []);
  const substeps = useLiveQuery(() => db.substeps.toArray(), []);

  const loading = !goals || !milestones || !substeps;

  const completedSubsteps = loading ? [] : substeps.filter((s) => s.completed);
  const { current, longest, totalDaysActive } = useMemo(
    () => computeStreaks(completedSubsteps),
    [completedSubsteps]
  );

  const last14Days = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const count = completedSubsteps.filter((s) => dateKey(new Date(s.completedAt)) === key).length;
      days.push({ key, count, isToday: i === 0 });
    }
    return days;
  }, [completedSubsteps]);

  const maxCount = Math.max(1, ...last14Days.map((d) => d.count));

  const activeGoals = useMemo(() => {
    if (loading) return [];
    return goals
      .filter((g) => g.status !== 'archived')
      .map((g) => {
        const goalMilestones = milestones.filter((m) => m.goalId === g.id);
        const total = goalMilestones.length;
        const done = goalMilestones.filter((m) => m.status === 'completed').length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const active = goalMilestones.find((m) => m.status === 'active');
        return { ...g, pct, daysLeft: daysUntil(g.targetDate), activeDue: active?.dueDate };
      });
  }, [loading, goals, milestones]);

  if (loading) {
    return (
      <div>
        <h1>Progreso</h1>
        <div className="skeleton skeleton-goal" style={{ marginTop: '1rem' }} />
      </div>
    );
  }

  return (
    <div>
      <h1>Progreso</h1>
      <p className="counts" style={{ marginBottom: '1.5rem' }}>La prueba de que sí le has estado metiendo</p>

      <div className="stat-grid">
        <div className="stat-tile">
          <span className="stat-number">{current}</span>
          <span className="stat-label">Racha actual</span>
        </div>
        <div className="stat-tile">
          <span className="stat-number">{longest}</span>
          <span className="stat-label">Racha más larga</span>
        </div>
        <div className="stat-tile">
          <span className="stat-number">{completedSubsteps.length}</span>
          <span className="stat-label">Pasos completados</span>
        </div>
        <div className="stat-tile">
          <span className="stat-number">{totalDaysActive}</span>
          <span className="stat-label">Días activo</span>
        </div>
      </div>

      <h2 className="section-heading">Últimos 14 días</h2>
      <div className="bar-chart">
        {last14Days.map((d) => (
          <div className="bar-col" key={d.key}>
            <div
              className={`bar ${d.count > 0 ? 'has-activity' : ''} ${d.isToday ? 'is-today' : ''}`}
              style={{ height: `${8 + (d.count / maxCount) * 48}px` }}
              title={`${d.count} pasos`}
            />
          </div>
        ))}
      </div>

      <h2 className="section-heading">Tus metas</h2>
      {activeGoals.length === 0 && (
        <div className="empty-state">
          <span className="glyph">📈</span>
          <p>Aquí no hay nada todavía porque no tienes metas activas. Empecemos por una.</p>
        </div>
      )}
      {activeGoals.length > 0 && (
        <div className="goal-progress-list">
          {activeGoals.map((g) => (
            <div className="goal-progress-row" key={g.id}>
              <div className="goal-progress-top">
                <span className="goal-progress-title">{g.title}</span>
                <span className="goal-progress-pct">{g.pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${g.pct}%` }} />
              </div>
              {g.daysLeft !== null && (
                <span className={`goal-progress-days ${g.daysLeft < 0 ? 'is-overdue' : ''}`}>
                  {g.daysLeft < 0
                    ? `${Math.abs(g.daysLeft)} días tarde`
                    : g.daysLeft === 0
                    ? 'Meta hoy'
                    : `${g.daysLeft} días restantes`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
