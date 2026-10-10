import { useState } from 'react';
import { daysUntil, computePaceStatus } from '../dateHelpers.js';

function DueBadge({ dueDate }) {
  const days = daysUntil(dueDate);
  if (days === null) return null;

  if (days < 0) {
    return <span className="due-badge is-overdue">Atrasado {Math.abs(days)}d</span>;
  }
  if (days === 0) {
    return <span className="due-badge is-today">Vence hoy</span>;
  }
  if (days <= 3) {
    return <span className="due-badge is-soon">{days}d restantes</span>;
  }
  return <span className="due-badge">{days}d restantes</span>;
}

export function PathView({
  goal,
  milestones,
  substepsByMilestone,
  onToggleSubstep,
  onDeleteGoal,
  onArchiveGoal,
  onOpenPath,
  onChatAboutGoal,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const isGoalComplete = totalMilestones > 0 && completedMilestones === totalMilestones;
  const isArchived = goal.status === 'archived';
  const pct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const daysLeftToTarget = daysUntil(goal.targetDate);
  const pace = computePaceStatus(goal, milestones);

  function handleDeleteClick() {
    if (confirmingDelete) {
      onDeleteGoal(goal);
    } else {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
    }
  }

  return (
    <article className={`goal ${isGoalComplete ? 'is-complete' : ''}`}>
      <button
        className="goal-top goal-top-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="goal-top-left">
          <h3 className={`goal-title ${isGoalComplete ? 'is-complete' : ''}`}>
            <span className={isGoalComplete ? 'strike' : ''}>{goal.title}</span>
          </h3>
          {totalMilestones > 0 && (
            <span className="goal-mini-progress">
              {completedMilestones}/{totalMilestones} etapas · {pct}%
            </span>
          )}
        </div>
        <div className="goal-top-right">
          {!isGoalComplete && daysLeftToTarget !== null && (
            <span
              className={`goal-deadline ${daysLeftToTarget < 0 ? 'is-overdue' : ''} ${
                pace === 'behind' ? 'is-behind-pace' : ''
              }`}
            >
              {daysLeftToTarget < 0
                ? `${Math.abs(daysLeftToTarget)}d tarde`
                : daysLeftToTarget === 0
                ? 'Meta hoy'
                : `${daysLeftToTarget}d para tu meta`}
              {pace === 'behind' && daysLeftToTarget >= 0 ? ' · vas atrasado' : ''}
            </span>
          )}
          <span className="goal-chevron" aria-hidden="true">
            {expanded ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {expanded && (
        <>
          {totalMilestones === 0 && (
            <p className="goal-pending">
              <span className="spinner" aria-hidden="true" />
              {navigator.onLine
                ? 'Pensando el mejor camino…'
                : 'Lo trazo en cuanto tengas conexión. No se me olvida.'}
            </p>
          )}

          {totalMilestones > 0 && (
            <div className="trail">
              {milestones.map((milestone, i) => {
                const isLast = i === milestones.length - 1;
                const substeps = substepsByMilestone[milestone.id] || [];

                return (
                  <div className="trail-item" key={milestone.id}>
                    <div className="trail-rail">
                      <div className={`trail-node is-${milestone.status}`}>
                        {milestone.status === 'completed' ? '✓' : milestone.status === 'locked' ? '🔒' : i + 1}
                      </div>
                      {!isLast && <div className={`trail-line ${milestone.status === 'completed' ? 'is-done' : ''}`} />}
                    </div>

                    <div className="trail-content">
                      <div className="trail-title-row">
                        <p className={`trail-title is-${milestone.status}`}>{milestone.title}</p>
                        {milestone.status === 'active' && <DueBadge dueDate={milestone.dueDate} />}
                      </div>
                      {milestone.status !== 'completed' && milestone.description && (
                        <p className={`trail-desc ${milestone.status === 'locked' ? 'is-locked' : ''}`}>
                          {milestone.description}
                        </p>
                      )}

                      {milestone.status === 'active' && milestone.pending_ai_breakdown && substeps.length === 0 && (
                        <p className="milestone-pending">
                          <span className="spinner" aria-hidden="true" />
                          {navigator.onLine ? 'Armando tus pasos…' : 'Los armo apenas vuelva la conexión.'}
                        </p>
                      )}

                      {(milestone.status === 'active' || milestone.status === 'completed') &&
                        substeps.length > 0 && (
                          <ul className="substep-list">
                            {substeps.map((step) => (
                              <li key={step.id} className={`substep ${step.completed ? 'completed' : ''}`}>
                                <input
                                  className="substep-checkbox"
                                  type="checkbox"
                                  checked={step.completed}
                                  disabled={milestone.status === 'completed'}
                                  onChange={() => onToggleSubstep(step)}
                                  id={`substep-${step.id}`}
                                />
                                <label htmlFor={`substep-${step.id}`}>
                                  <span className="substep-title">{step.title}</span>
                                  {step.description && (
                                    <span className="substep-description">{step.description}</span>
                                  )}
                                </label>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isGoalComplete && <p className="complete-banner">🎉 La cerraste. Esa es tuya.</p>}

          <div className="goal-actions">
            {totalMilestones > 0 && (
              <button className="ghost" onClick={() => onOpenPath(goal)}>
                Ver camino completo
              </button>
            )}
            <button className="ghost" onClick={() => onChatAboutGoal(goal.id)}>
              Hablar con Migo
            </button>
            {!isArchived && (
              <>
                {isGoalComplete && (
                  <button className="ghost" onClick={() => onArchiveGoal(goal)}>
                    Archivar
                  </button>
                )}
                <button className={`ghost ${confirmingDelete ? 'is-confirming' : ''}`} onClick={handleDeleteClick}>
                  {confirmingDelete ? '¿Seguro? Toca otra vez y la borro' : 'Eliminar'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </article>
  );
}
