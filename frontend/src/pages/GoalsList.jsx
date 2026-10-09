import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';
import { OfflineBanner } from '../components/OfflineBanner.jsx';
import { PathView } from '../components/PathView.jsx';
import { Mascot } from '../components/Mascot.jsx';
import { StreakStrip } from '../components/StreakStrip.jsx';
import { GoalWizard } from '../components/GoalWizard.jsx';

export function GoalsList({ isOnline, isSyncing }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState(null);

  const goals = useLiveQuery(() => db.goals.orderBy('updatedAt').reverse().toArray(), []);
  const milestones = useLiveQuery(() => db.milestones.orderBy('orderIndex').toArray(), []);
  const substeps = useLiveQuery(() => db.substeps.toArray(), []);

  const loading = !goals || !milestones || !substeps;
  const visibleGoals = loading ? [] : goals.filter((g) => g.status !== 'archived');

  const activeCount = useMemo(() => {
    if (loading) return 0;
    return visibleGoals.filter((g) => {
      const goalMilestones = milestones.filter((m) => m.goalId === g.id);
      return !(goalMilestones.length > 0 && goalMilestones.every((m) => m.status === 'completed'));
    }).length;
  }, [loading, visibleGoals, milestones]);

  const mascotMessage = useMemo(() => {
    if (loading) return null;
    if (visibleGoals.length === 0) return '¡Hola! Toca "+ Nueva meta" y te armo el camino.';
    if (activeCount === 0) return '¡Wow, todo completado! Hora de una meta nueva 🎉';
    return 'Vas bien. Un paso chico a la vez.';
  }, [loading, visibleGoals, activeCount]);

  async function handleWizardComplete({ title, durationLabel, weeklyCommitment }) {
    if (!title) return;
    const tempId = `local-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await db.transaction('rw', db.goals, db.pendingChanges, async () => {
      await db.goals.put({
        id: tempId,
        title,
        status: 'active',
        durationLabel,
        weeklyCommitment,
        updatedAt: now,
      });

      await db.pendingChanges.add({
        entityType: 'goal',
        entityId: tempId,
        action: 'create',
        payload: { title, durationLabel, weeklyCommitment },
        clientUpdatedAt: now,
        createdAt: now,
      });
    });
  }

  async function handleToggleSubstep(step) {
    const completed = !step.completed;
    const now = new Date().toISOString();

    await db.transaction('rw', db.substeps, db.milestones, db.pendingChanges, async () => {
      await db.substeps.update(step.id, { completed, completedAt: completed ? now : null, updatedAt: now });

      await db.pendingChanges.add({
        entityType: 'substep',
        entityId: step.id,
        action: 'update',
        payload: { completed },
        clientUpdatedAt: now,
        createdAt: now,
      });

      if (completed) {
        const siblings = await db.substeps.where('milestoneId').equals(step.milestoneId).toArray();
        const allDone = siblings.every((s) => (s.id === step.id ? true : s.completed));
        if (allDone) {
          await db.milestones.update(step.milestoneId, { status: 'completed', updatedAt: now });
          setJustCompletedId(step.milestoneId);
          setTimeout(() => setJustCompletedId(null), 1200);
        }
      }
    });
  }

  async function handleDeleteGoal(goal) {
    const now = new Date().toISOString();
    const isLocalOnly = goal.id.startsWith('local-');

    await db.transaction('rw', db.goals, db.milestones, db.substeps, db.pendingChanges, async () => {
      const goalMilestones = await db.milestones.where('goalId').equals(goal.id).toArray();
      for (const m of goalMilestones) {
        await db.substeps.where('milestoneId').equals(m.id).delete();
      }
      await db.milestones.where('goalId').equals(goal.id).delete();
      await db.goals.delete(goal.id);

      if (isLocalOnly) {
        await db.pendingChanges.where({ entityType: 'goal', entityId: goal.id }).delete();
      } else {
        await db.pendingChanges.add({
          entityType: 'goal',
          entityId: goal.id,
          action: 'delete',
          payload: {},
          clientUpdatedAt: now,
          createdAt: now,
        });
      }
    });
  }

  async function handleArchiveGoal(goal) {
    const now = new Date().toISOString();

    await db.transaction('rw', db.goals, db.pendingChanges, async () => {
      await db.goals.update(goal.id, { status: 'archived', updatedAt: now });
      await db.pendingChanges.add({
        entityType: 'goal',
        entityId: goal.id,
        action: 'update',
        payload: { status: 'archived' },
        clientUpdatedAt: now,
        createdAt: now,
      });
    });
  }

  const completedSubsteps = loading ? [] : substeps.filter((s) => s.completed);

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1>Migo</h1>
          {!loading && (
            <p className="counts">
              {activeCount === 0 ? 'Todo al día' : `${activeCount} meta${activeCount === 1 ? '' : 's'} en curso`}
            </p>
          )}
        </div>
        {isSyncing && (
          <span className="sync-pill">
            <span className="sync-dot" />
            Sincronizando
          </span>
        )}
      </div>

      <Mascot message={mascotMessage} celebrating={!!justCompletedId} />

      {!loading && <StreakStrip completedSubsteps={completedSubsteps} />}

      {!isOnline && <OfflineBanner />}

      <button className="new-goal-button" onClick={() => setWizardOpen(true)}>
        + Nueva meta
      </button>

      {loading && (
        <div aria-hidden="true">
          <div className="skeleton skeleton-goal" />
          <div className="skeleton skeleton-goal" />
        </div>
      )}

      {!loading && visibleGoals.length === 0 && (
        <div className="empty-state">
          <span className="glyph">🧭</span>
          <p>Todavía no tienes metas. Toca "+ Nueva meta" y Migo te traza el camino.</p>
        </div>
      )}

      {!loading && visibleGoals.length > 0 && (
        <div className="goals-list">
          {visibleGoals.map((goal) => {
            const goalMilestones = milestones
              .filter((m) => m.goalId === goal.id)
              .sort((a, b) => a.orderIndex - b.orderIndex);

            const substepsByMilestone = {};
            for (const m of goalMilestones) {
              substepsByMilestone[m.id] = substeps
                .filter((s) => s.milestoneId === m.id)
                .sort((a, b) => a.orderIndex - b.orderIndex);
            }

            return (
              <PathView
                key={goal.id}
                goal={goal}
                milestones={goalMilestones}
                substepsByMilestone={substepsByMilestone}
                onToggleSubstep={handleToggleSubstep}
                onDeleteGoal={handleDeleteGoal}
                onArchiveGoal={handleArchiveGoal}
              />
            );
          })}
        </div>
      )}

      {wizardOpen && (
        <GoalWizard onComplete={handleWizardComplete} onCancel={() => setWizardOpen(false)} />
      )}
    </div>
  );
}
