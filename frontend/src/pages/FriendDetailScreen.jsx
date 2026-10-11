import { CharacterAvatar } from '../components/CharacterAvatar.jsx';
import { daysUntil } from '../dateHelpers.js';

export function FriendDetailScreen({ friend, goals, loading, error, onBack }) {
  return (
    <div className="friend-detail">
      <button className="chat-back" onClick={onBack}>
        ← Amigos
      </button>

      <div className="friend-detail-head">
        <CharacterAvatar characterId={friend.character} size="lg" />
        <div>
          <h1 className="friend-detail-name">{friend.email.split('@')[0]}</h1>
          <p className="counts">{friend.email}</p>
        </div>
      </div>

      {loading && <div className="skeleton skeleton-goal" style={{ marginTop: '1rem' }} />}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && goals?.length === 0 && (
        <div className="empty-state">
          <span className="glyph">🧭</span>
          <p>Todavía no tiene metas activas.</p>
        </div>
      )}

      {!loading && goals?.length > 0 && (
        <div className="goals-list">
          {goals.map((goal) => {
            const total = goal.milestones.length;
            const done = goal.milestones.filter((m) => m.status === 'completed').length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const daysLeft = daysUntil(goal.target_date);

            return (
              <article className="goal friend-goal-card" key={goal.id}>
                <div className="goal-top">
                  <div className="goal-top-left">
                    <h3 className="goal-title">{goal.title}</h3>
                    <span className="goal-mini-progress">
                      {done}/{total} etapas · {pct}%
                    </span>
                  </div>
                  {daysLeft !== null && (
                    <span className={`goal-deadline ${daysLeft < 0 ? 'is-overdue' : ''}`}>
                      {daysLeft < 0
                        ? `${Math.abs(daysLeft)}d tarde`
                        : daysLeft === 0
                        ? 'Meta hoy'
                        : `${daysLeft}d restantes`}
                    </span>
                  )}
                </div>

                <div className="trail">
                  {goal.milestones.map((m, i) => (
                    <div className="trail-item" key={m.id}>
                      <div className="trail-rail">
                        <div className={`trail-node is-${m.status}`}>
                          {m.status === 'completed' ? '✓' : m.status === 'locked' ? '🔒' : i + 1}
                        </div>
                        {i < goal.milestones.length - 1 && (
                          <div className={`trail-line ${m.status === 'completed' ? 'is-done' : ''}`} />
                        )}
                      </div>
                      <div className="trail-content">
                        <p className={`trail-title is-${m.status}`}>{m.title}</p>
                        {m.status === 'active' && m.substeps?.length > 0 && (
                          <ul className="substep-list friend-readonly-list">
                            {m.substeps.map((s) => (
                              <li key={s.id} className={`substep ${s.completed ? 'completed' : ''}`}>
                                <span className={`friend-substep-dot ${s.completed ? 'is-done' : ''}`} />
                                <label>
                                  <span className="substep-title">{s.title}</span>
                                </label>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
