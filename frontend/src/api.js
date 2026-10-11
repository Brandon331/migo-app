import { getSession, setSession, clearLocalData } from './db.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const session = await getSession();
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: { email, password }, auth: false }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  fetchGoals: () => request('/goals'),

  createGoal: (title, durationLabel, weeklyCommitment) =>
    request('/goals', { method: 'POST', body: { title, durationLabel, weeklyCommitment } }),

  retryPath: (goalId) => request(`/goals/${goalId}/retry-path`, { method: 'POST' }),

  retryMilestoneBreakdown: (milestoneId) =>
    request(`/milestones/${milestoneId}/retry-breakdown`, { method: 'POST' }),

  pushChanges: (changes) => request('/sync/push', { method: 'POST', body: { changes } }),

  pullChanges: (since) => request(`/sync/pull?since=${encodeURIComponent(since || '1970-01-01')}`),

  fetchChatHistory: (goalId) =>
    request(`/chat${goalId ? `?goalId=${encodeURIComponent(goalId)}` : ''}`),

  sendChatMessage: (message, goalId) =>
    request('/chat', { method: 'POST', body: { message, goalId: goalId || undefined } }),

  fetchMe: () => request('/auth/me'),

  updateCharacter: (character) => request('/auth/me', { method: 'PATCH', body: { character } }),

  createFriendInvite: () => request('/friends/invite', { method: 'POST' }),

  acceptFriendInvite: (code) => request('/friends/accept', { method: 'POST', body: { code } }),

  fetchFriends: () => request('/friends'),

  fetchFriendGoals: (friendId) => request(`/friends/${friendId}/goals`),
};

// Por si el cierre de sesión anterior no se completó limpio (un refresh a
// medias, un crash), nos aseguramos de nunca arrancar una cuenta nueva con
// datos de otra cuenta todavía en IndexedDB.
async function startFreshSessionFor(userId) {
  const previous = await getSession();
  if (previous && previous.userId && previous.userId !== userId) {
    await clearLocalData();
  }
}

export async function loginAndPersist(email, password) {
  const data = await api.login(email, password);
  await startFreshSessionFor(data.user.id);
  await setSession({
    userId: data.user.id,
    email: data.user.email,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    lastSyncedAt: null,
  });
  return data;
}

export async function registerAndPersist(email, password) {
  const data = await api.register(email, password);
  await startFreshSessionFor(data.user.id);
  await setSession({
    userId: data.user.id,
    email: data.user.email,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    lastSyncedAt: null,
  });
  return data;
}
