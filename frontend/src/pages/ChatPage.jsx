import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';
import { api } from '../api.js';
import { Mascot } from '../components/Mascot.jsx';

export function ChatPage({ isOnline, goalId, onSelectGoal }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  const goals = useLiveQuery(() => db.goals.orderBy('updatedAt').reverse().toArray(), []);
  const activeGoals = (goals || []).filter((g) => g.status !== 'archived');
  const currentGoal = goalId ? (goals || []).find((g) => g.id === goalId) : null;

  // Para que la barra lateral muestre un vistazo del último mensaje de cada hilo.
  const allMessages = useLiveQuery(() => db.chatMessages.toArray(), []);
  const lastMessageByGoal = {};
  let lastGeneralMessage = null;
  for (const m of allMessages || []) {
    const key = m.goalId || '__general__';
    const bucket = key === '__general__' ? null : key;
    const current = bucket ? lastMessageByGoal[bucket] : lastGeneralMessage;
    if (!current || new Date(m.createdAt) > new Date(current.createdAt)) {
      if (bucket) lastMessageByGoal[bucket] = m;
      else lastGeneralMessage = m;
    }
  }

  // Filtramos en memoria (en vez de where().equals en el índice) porque el chat
  // general tiene goalId undefined, que Dexie no indexa de forma consistente.
  const threadMessages = useLiveQuery(async () => {
    const all = await db.chatMessages.toArray();
    return all
      .filter((m) => (goalId ? m.goalId === goalId : !m.goalId))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [goalId]);

  const loading = !threadMessages;

  useEffect(() => {
    if (!isOnline) return;
    api
      .fetchChatHistory(goalId)
      .then(async (rows) => {
        await db.chatMessages.bulkPut(
          rows.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            goalId: m.goal_id || undefined,
            createdAt: m.created_at,
          }))
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, goalId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages?.length]);

  function selectThread(id) {
    onSelectGoal(id);
    setSidebarOpen(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setDraft('');
    setError(null);
    setSending(true);

    const tempId = `local-${crypto.randomUUID()}`;
    await db.chatMessages.put({
      id: tempId,
      role: 'user',
      content: text,
      goalId: goalId || undefined,
      createdAt: new Date().toISOString(),
    });

    try {
      const { userMessage, reply } = await api.sendChatMessage(text, goalId);
      await db.transaction('rw', db.chatMessages, async () => {
        await db.chatMessages.delete(tempId);
        await db.chatMessages.put({
          id: userMessage.id,
          role: 'user',
          content: userMessage.content,
          goalId: userMessage.goal_id || undefined,
          createdAt: userMessage.created_at,
        });
        await db.chatMessages.put({
          id: reply.id,
          role: 'assistant',
          content: reply.content,
          goalId: reply.goal_id || undefined,
          createdAt: reply.created_at,
        });
      });
    } catch (err) {
      setError(err.message || 'No pude mandar el mensaje. Intenta otra vez.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-layout">
      {sidebarOpen && <div className="chat-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`chat-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="chat-sidebar-head">
          <span>Tus chats</span>
          <button className="chat-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <button
          className={`chat-thread-item ${!goalId ? 'is-active' : ''}`}
          onClick={() => selectThread(null)}
        >
          <span className="chat-thread-icon">🔮</span>
          <span className="chat-thread-info">
            <span className="chat-thread-title">Migo</span>
            <span className="chat-thread-preview">
              {lastGeneralMessage ? lastGeneralMessage.content : 'Chat general'}
            </span>
          </span>
        </button>

        {activeGoals.length > 0 && <div className="chat-sidebar-divider">Por meta</div>}

        {activeGoals.map((g) => (
          <button
            key={g.id}
            className={`chat-thread-item ${goalId === g.id ? 'is-active' : ''}`}
            onClick={() => selectThread(g.id)}
          >
            <span className="chat-thread-icon">🧭</span>
            <span className="chat-thread-info">
              <span className="chat-thread-title">{g.title}</span>
              <span className="chat-thread-preview">
                {lastMessageByGoal[g.id] ? lastMessageByGoal[g.id].content : 'Sin mensajes todavía'}
              </span>
            </span>
          </button>
        ))}
      </aside>

      <div className="chat-page">
        <div className="chat-header">
          <button className="chat-sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Ver chats">
            ☰
          </button>
          <div className="chat-header-text">
            {currentGoal ? (
              <h1 className="chat-title-goal">{currentGoal.title}</h1>
            ) : (
              <>
                <h1>Migo</h1>
                <p className="counts">Pregúntame lo que sea sobre tus metas</p>
              </>
            )}
          </div>
        </div>

        <div className="chat-thread">
          {loading && (
            <div aria-hidden="true">
              <div className="skeleton skeleton-goal" />
            </div>
          )}

          {!loading && threadMessages.length === 0 && (
            <div className="chat-empty">
              <Mascot
                message={
                  currentGoal
                    ? `Dime qué necesitas sobre "${currentGoal.title}" — consejo, ajustar el plan, lo que sea.`
                    : '¿Qué traes? Puedo ayudarte a ajustar una meta, pensar por qué algo no avanza, o lo que se te ocurra.'
                }
              />
            </div>
          )}

          {!loading &&
            threadMessages.map((m) => (
              <div key={m.id} className={`chat-bubble-row ${m.role === 'user' ? 'is-user' : 'is-assistant'}`}>
                <div className="chat-bubble">{m.content}</div>
              </div>
            ))}

          {sending && (
            <div className="chat-bubble-row is-assistant">
              <div className="chat-bubble chat-bubble-typing">
                <span className="spinner" aria-hidden="true" />
                Migo está pensando…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {!isOnline && (
          <p className="chat-offline-note">
            Sin conexión no puedo pensar bien — conéctate y seguimos platicando.
          </p>
        )}

        {error && <p className="error-text">{error}</p>}

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            placeholder={isOnline ? 'Escríbele a Migo…' : 'Necesitas conexión para chatear'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!isOnline || sending}
          />
          <button type="submit" disabled={!isOnline || sending || !draft.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
