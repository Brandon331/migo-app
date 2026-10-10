import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';
import { computeStreaks } from '../streak.js';
import { daysUntil } from '../dateHelpers.js';

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function last14Days(completedSubsteps) {
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
}

function GoalProgressCard({ goal, goalMilestones, goalSubsteps }) {
  const total = goalMilestones.length;
  const done = goalMilestones.filter((m) => m.status === 'completed').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const daysLeft = daysUntil(goal.targetDate);

  const completed = goalSubsteps.filter((s) => s.completed && s.completedAt);
  const days = useMemo(() => last14Days(completed), [completed]);
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="goal-progress-row">
      <div className="goal-progress-top">
        <span className="goal-progress-title">{goal.title}</span>
        <span className="goal-progress-pct">{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="mini-bar-chart">
        {days.map((d) => (
          <div
            key={d.key}
            className={`mini-bar ${d.count > 0 ? 'has-activity' : ''} ${d.isToday ? 'is-today' : ''}`}
            style={{ height: `${6 + (d.count / maxCount) * 26}px` }}
            title={`${d.count} pasos`}
          />
        ))}
      </div>

      {daysLeft !== null && (
        <span className={`goal-progress-days ${daysLeft < 0 ? 'is-overdue' : ''}`}>
          {daysLeft < 0
            ? `${Math.abs(daysLeft)} días tarde`
            : daysLeft === 0
            ? 'Meta hoy'
            : `${daysLeft} días restantes`}
        </span>
      )}
    </div>
  );
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

  const activeGoals = useMemo(() => {
    if (loading) return [];
    return goals.filter((g) => g.status !== 'archived');
  }, [loading, goals]);

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

      <h2 className="section-heading">Progreso por meta</h2>
      {activeGoals.length === 0 && (
        <div className="empty-state">
          <span className="glyph">📈</span>
          <p>Aquí no hay nada todavía porque no tienes metas activas. Empecemos por una.</p>
        </div>
      )}
      {activeGoals.length > 0 && (
        <div className="goal-progress-list">
          {activeGoals.map((g) => {
            const goalMilestones = milestones.filter((m) => m.goalId === g.id);
            const milestoneIds = new Set(goalMilestones.map((m) => m.id));
            const goalSubsteps = substeps.filter((s) => milestoneIds.has(s.milestoneId));
            return (
              <GoalProgressCard key={g.id} goal={g} goalMilestones={goalMilestones} goalSubsteps={goalSubsteps} />
            );
          })}
        </div>
      )}
    </div>
  );
}
