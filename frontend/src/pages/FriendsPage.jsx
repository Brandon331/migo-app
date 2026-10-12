import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { CharacterAvatar } from '../components/CharacterAvatar.jsx';
import { FriendDetailScreen } from './FriendDetailScreen.jsx';

export function FriendsPage({ isOnline }) {
  const [me, setMe] = useState(undefined);
  const [friends, setFriends] = useState(undefined);
  const [error, setError] = useState(null);

  const [inviteCode, setInviteCode] = useState(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  const [acceptDraft, setAcceptDraft] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendGoals, setFriendGoals] = useState(null);
  const [friendGoalsLoading, setFriendGoalsLoading] = useState(false);
  const [friendGoalsError, setFriendGoalsError] = useState(null);

  function loadAll() {
    if (!isOnline) return;
    api.fetchMe().then(setMe).catch(() => setMe(null));
    api
      .fetchFriends()
      .then(setFriends)
      .catch((err) => setError(err.message || 'No pude cargar tus amigos.'));
  }

  useEffect(loadAll, [isOnline]);

  async function handleGenerateInvite() {
    setGeneratingInvite(true);
    try {
      const { code } = await api.createFriendInvite();
      setInviteCode(code);
    } catch (err) {
      setError(err.message || 'No pude generar el código.');
    } finally {
      setGeneratingInvite(false);
    }
  }

  async function handleAccept(e) {
    e.preventDefault();
    const code = acceptDraft.trim();
    if (!code) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      await api.acceptFriendInvite(code);
      setAcceptDraft('');
      loadAll();
    } catch (err) {
      setAcceptError(err.message || 'Código inválido.');
    } finally {
      setAccepting(false);
    }
  }

  async function openFriend(friend) {
    setSelectedFriend(friend);
    setFriendGoals(null);
    setFriendGoalsError(null);
    setFriendGoalsLoading(true);
    try {
      const goals = await api.fetchFriendGoals(friend.id);
      setFriendGoals(goals);
    } catch (err) {
      setFriendGoalsError(err.message || 'No pude cargar su camino.');
    } finally {
      setFriendGoalsLoading(false);
    }
  }

  if (selectedFriend) {
    return (
      <FriendDetailScreen
        friend={selectedFriend}
        goals={friendGoals}
        loading={friendGoalsLoading}
        error={friendGoalsError}
        onBack={() => setSelectedFriend(null)}
      />
    );
  }

  return (
    <div>
      <h1>Amigos</h1>
      <p className="counts" style={{ marginBottom: '1.25rem' }}>
        Ve cómo van, sin meterte en su camino
      </p>

      {!isOnline && (
        <div className="empty-state">
          <span className="glyph">👥</span>
          <p>Necesitas conexión para ver y agregar amigos.</p>
        </div>
      )}

      {isOnline && (
        <>
          <div className="friends-connect-row">
            <div className="friends-connect-card">
              <span className="profile-label">Invita a alguien</span>
              {inviteCode ? (
                <div className="friends-code-display">
                  <span className="friends-code">{inviteCode}</span>
                  <span className="friends-code-hint">Pásale este código</span>
                </div>
              ) : (
                <button className="secondary" onClick={handleGenerateInvite} disabled={generatingInvite}>
                  {generatingInvite ? 'Generando…' : 'Generar código'}
                </button>
              )}
            </div>

            <form className="friends-connect-card" onSubmit={handleAccept}>
              <span className="profile-label">Tengo un código</span>
              <div className="friends-accept-row">
                <input
                  type="text"
                  placeholder="ABC123"
                  value={acceptDraft}
                  onChange={(e) => setAcceptDraft(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <button type="submit" disabled={accepting || !acceptDraft.trim()}>
                  {accepting ? '…' : 'Unir'}
                </button>
              </div>
              {acceptError && <p className="error-text">{acceptError}</p>}
            </form>
          </div>

          {error && <p className="error-text">{error}</p>}

          <h2 className="section-heading">Quién anda en esto</h2>

          <div className="friends-grid">
            <div className="friend-tile friend-tile-self">
              <CharacterAvatar characterId={me?.character} size="xl" />
              <div className="friend-tile-info">
                <span className="friend-tile-name">Tú</span>
                {!me?.character && <span className="friend-tile-hint">Elige tu personaje en Perfil</span>}
              </div>
            </div>

            {friends === undefined && <div className="skeleton skeleton-goal" />}

            {friends?.length === 0 && (
              <div className="empty-state friends-empty">
                <span className="glyph">🧭</span>
                <p>Todavía no tienes amigos agregados — comparte tu código para empezar.</p>
              </div>
            )}

            {friends?.map((f) => {
              const mainGoal = f.goals[0];
              return (
                <button key={f.id} className="friend-tile" onClick={() => openFriend(f)}>
                  <span className={`friend-tile-pulse ${f.didSomethingToday ? 'is-active' : ''}`} />
                  <CharacterAvatar characterId={f.character} size="xl" />
                  <div className="friend-tile-info">
                    <span className="friend-tile-name">{f.email.split('@')[0]}</span>
                    {mainGoal ? (
                      <>
                        <span className="friend-tile-goal">{mainGoal.title}</span>
                        <span className="friend-tile-pct">{mainGoal.pct}%</span>
                      </>
                    ) : (
                      <span className="friend-tile-goal">Sin metas activas</span>
                    )}
                    {f.goals.length > 1 && (
                      <span className="friend-tile-more">+{f.goals.length - 1} más</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}