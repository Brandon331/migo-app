import { useCallback, useEffect, useRef, useState } from 'react';
import { db, getLastSyncedAt, setLastSyncedAt } from '../db.js';
import { api } from '../api.js';
import { useOnlineStatus } from './useOnlineStatus.js';

const SYNC_INTERVAL_MS = 30_000;

export function useSync() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const sync = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      await pushCreatedGoals();
      await pushUpdates();
      await pullFromServer();
    } catch (err) {
      console.error('Error en sincronización:', err.message);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, SYNC_INTERVAL_MS);
    window.addEventListener('online', sync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', sync);
    };
  }, [sync]);

  return { isOnline, isSyncing, syncNow: sync };
}

// --- Guarda en Dexie una meta tal como la regresa el backend (con camino anidado) ---
async function saveGoalWithPath(goal) {
  await db.goals.put({
    id: goal.id,
    user_id: goal.user_id,
    title: goal.title,
    status: goal.status,
    durationLabel: goal.duration_label,
    weeklyCommitment: goal.weekly_commitment,
    targetDate: goal.target_date,
    createdAt: goal.created_at,
    updatedAt: goal.updated_at,
  });

  for (const m of goal.milestones || []) {
    await db.milestones.put({
      id: m.id,
      goalId: m.goal_id || goal.id,
      title: m.title,
      description: m.description,
      orderIndex: m.order_index,
      status: m.status,
      pending_ai_breakdown: m.pending_ai_breakdown,
      dueDate: m.due_date,
      updatedAt: m.updated_at,
    });

    for (const s of m.substeps || []) {
      await db.substeps.put({
        id: s.id,
        milestoneId: s.milestone_id || m.id,
        title: s.title,
        description: s.description,
        orderIndex: s.order_index,
        completed: s.completed,
        completedAt: s.completed_at,
        updatedAt: s.updated_at,
      });
    }
  }
}

async function pushCreatedGoals() {
  const pendingCreates = await db.pendingChanges
    .where('entityType')
    .equals('goal')
    .and((c) => c.action === 'create')
    .toArray();

  for (const change of pendingCreates) {
    const tempId = change.entityId;
    const { title, durationLabel, weeklyCommitment } = change.payload;

    const created = await api.createGoal(title, durationLabel, weeklyCommitment);

    await db.transaction('rw', db.goals, db.milestones, db.substeps, db.pendingChanges, async () => {
      await db.goals.delete(tempId);
      const oldMilestones = await db.milestones.where('goalId').equals(tempId).toArray();
      for (const m of oldMilestones) {
        await db.substeps.where('milestoneId').equals(m.id).delete();
      }
      await db.milestones.where('goalId').equals(tempId).delete();

      await saveGoalWithPath(created);
      await db.pendingChanges.delete(change.localId);
    });
  }
}

async function pushUpdates() {
  const pending = await db.pendingChanges
    .filter((c) => !(c.entityType === 'goal' && c.action === 'create'))
    .toArray();

  if (pending.length === 0) return;

  const changesPayload = pending.map((c) => ({
    entity_type: c.entityType,
    entity_id: c.entityId,
    action: c.action,
    payload: c.payload,
    client_updated_at: c.clientUpdatedAt,
  }));

  const { results } = await api.pushChanges(changesPayload);

  const appliedIds = new Set(results.filter((r) => r.status === 'applied').map((r) => r.id));
  const toRemove = pending.filter((c) => appliedIds.has(c.entityId)).map((c) => c.localId);
  await db.pendingChanges.bulkDelete(toRemove);
}

async function pullFromServer() {
  const since = await getLastSyncedAt();
  const { goals, milestones, substeps, syncedAt } = await api.pullChanges(since);

  await db.transaction('rw', db.goals, db.milestones, db.substeps, async () => {
    for (const goal of goals) {
      if (goal.deleted) {
        await db.goals.delete(goal.id);
        const localMilestones = await db.milestones.where('goalId').equals(goal.id).toArray();
        for (const m of localMilestones) {
          await db.substeps.where('milestoneId').equals(m.id).delete();
        }
        await db.milestones.where('goalId').equals(goal.id).delete();
        continue;
      }

      await db.goals.put({
        id: goal.id,
        user_id: goal.user_id,
        title: goal.title,
        status: goal.status,
        durationLabel: goal.duration_label,
        weeklyCommitment: goal.weekly_commitment,
        targetDate: goal.target_date,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
      });
    }

    for (const m of milestones) {
      await db.milestones.put({
        id: m.id,
        goalId: m.goal_id,
        title: m.title,
        description: m.description,
        orderIndex: m.order_index,
        status: m.status,
        pending_ai_breakdown: m.pending_ai_breakdown,
        dueDate: m.due_date,
        updatedAt: m.updated_at,
      });
    }

    for (const s of substeps) {
      await db.substeps.put({
        id: s.id,
        milestoneId: s.milestone_id,
        title: s.title,
        description: s.description,
        orderIndex: s.order_index,
        completed: s.completed,
        completedAt: s.completed_at,
        updatedAt: s.updated_at,
      });
    }
  });

  await setLastSyncedAt(syncedAt);
}

export { saveGoalWithPath };
