import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';
import { api } from '../api.js';
import { Mascot } from '../components/Mascot.jsx';

export function ChatPage({ isOnline }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const messages = useLiveQuery(() => db.chatMessages.orderBy('createdAt').toArray(), []);
  const loading = !messages;

  useEffect(() => {
    if (!isOnline) return;
    api
      .fetchChatHistory()
      .then(async (rows) => {
        await db.chatMessages.bulkPut(
          rows.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at }))
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

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
      createdAt: new Date().toISOString(),
    });

    try {
      const { userMessage, reply } = await api.sendChatMessage(text);
      await db.transaction('rw', db.chatMessages, async () => {
        await db.chatMessages.delete(tempId);
        await db.chatMessages.put({
          id: userMessage.id,
          role: 'user',
          content: userMessage.content,
          createdAt: userMessage.created_at,
        });
        await db.chatMessages.put({
          id: reply.id,
          role: 'assistant',
          content: reply.content,
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
    <div className="chat-page">
      <div className="chat-header">
        <h1>Migo</h1>
        <p className="counts">Pregúntame lo que sea sobre tus metas</p>
      </div>

      <div className="chat-thread">
        {loading && (
          <div aria-hidden="true">
            <div className="skeleton skeleton-goal" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="chat-empty">
            <Mascot message="¿Qué traes? Puedo ayudarte a ajustar una meta, pensar por qué algo no avanza, o lo que se te ocurra." />
          </div>
        )}

        {!loading &&
          messages.map((m) => (
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
  );
}
