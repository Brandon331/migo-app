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

db.version(3).stores({
  goals: 'id, status, updatedAt',
  milestones: 'id, goalId, status, orderIndex, updatedAt',
  substeps: 'id, milestoneId, completed, completedAt, updatedAt',
  pendingChanges: '++localId, entityType, entityId, action, createdAt',
  session: 'key',
  chatMessages: 'id, goalId, createdAt',
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

// Todo lo que vive en IndexedDB es de una sola cuenta a la vez — si no se
// limpia al salir, la siguiente cuenta que entre en este mismo dispositivo
// ve metas, progreso y chats de la cuenta anterior. Se llama al cerrar
// sesión y, por si acaso, también justo antes de guardar una sesión nueva.
export async function clearLocalData() {
  await db.transaction(
    'rw',
    db.goals,
    db.milestones,
    db.substeps,
    db.pendingChanges,
    db.chatMessages,
    async () => {
      await db.goals.clear();
      await db.milestones.clear();
      await db.substeps.clear();
      await db.pendingChanges.clear();
      await db.chatMessages.clear();
    }
  );
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

// Nombre que la persona elige para personalizar "la historia de Migo" — solo
// vive local, no hace falta mandarlo al servidor.
export async function getCompanionName() {
  const session = await getSession();
  return session?.companionName || null;
}

export async function setCompanionName(name) {
  const session = await getSession();
  if (session) {
    await db.session.put({ ...session, companionName: name });
  }
}
