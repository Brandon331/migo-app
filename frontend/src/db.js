import Dexie from 'dexie';

export const db = new Dexie('migoAppDB');

db.version(1).stores({
  goals: 'id, status, updatedAt',
  milestones: 'id, goalId, status, orderIndex, updatedAt',
  substeps: 'id, milestoneId, completed, completedAt, updatedAt',
  pendingChanges: '++localId, entityType, entityId, action, createdAt',
  session: 'key',
});

db.version(2).stores({
  goals: 'id, status, updatedAt',
  milestones: 'id, goalId, status, orderIndex, updatedAt',
  substeps: 'id, milestoneId, completed, completedAt, updatedAt',
  pendingChanges: '++localId, entityType, entityId, action, createdAt',
  session: 'key',
  chatMessages: 'id, createdAt',
});

export async function getSession() {
  const rows = await db.session.toArray();
  return rows[0] || null;
}

export async function setSession(session) {
  await db.session.clear();
  await db.session.put({ key: 'current', ...session });
}

export async function clearSession() {
  await db.session.clear();
}

export async function getLastSyncedAt() {
  const session = await getSession();
  return session?.lastSyncedAt || null;
}

export async function setLastSyncedAt(isoDate) {
  const session = await getSession();
  if (session) {
    await db.session.put({ ...session, lastSyncedAt: isoDate });
  }
}
