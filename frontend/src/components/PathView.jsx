export function PathView({ goal, milestones, substepsByMilestone, onToggleSubstep, onDeleteGoal, onArchiveGoal }) {
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const isGoalComplete = totalMilestones > 0 && completedMilestones === totalMilestones;
  const isArchived = goal.status === 'archived';

  return (
    <article className={`goal ${isGoalComplete ? 'is-complete' : ''}`}>
      <h3 className={`goal-title ${isGoalComplete ? 'is-complete' : ''}`}>
        <span className={isGoalComplete ? 'strike' : ''}>{goal.title}</span>
      </h3>

      {totalMilestones === 0 && (
        <p className="goal-pending">
          <span className="spinner" aria-hidden="true" />
          {navigator.onLine
            ? 'Trazando tu camino…'
            : 'Se trazará tu camino en cuanto tengas conexión.'}
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
                  <p className={`trail-title is-${milestone.status}`}>{milestone.title}</p>
                  {milestone.status !== 'completed' && milestone.description && (
                    <p className={`trail-desc ${milestone.status === 'locked' ? 'is-locked' : ''}`}>
                      {milestone.description}
                    </p>
                  )}

                  {milestone.status === 'active' && milestone.pending_ai_breakdown && substeps.length === 0 && (
                    <p className="milestone-pending">
                      <span className="spinner" aria-hidden="true" />
                      {navigator.onLine ? 'Preparando tus pasos…' : 'Se prepararán en cuanto tengas conexión.'}
                    </p>
                  )}

                  {milestone.status === 'active' && substeps.length > 0 && (
                    <ul className="substep-list">
                      {substeps.map((step) => (
                        <li key={step.id} className={`substep ${step.completed ? 'completed' : ''}`}>
                          <input
                            className="substep-checkbox"
                            type="checkbox"
                            checked={step.completed}
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

      {isGoalComplete && <p className="complete-banner">🎉 ¡Meta completada!</p>}

      {!isArchived && (
        <div className="goal-actions">
          {isGoalComplete && (
            <button className="ghost" onClick={() => onArchiveGoal(goal)}>
              Archivar
            </button>
          )}
          <button className="ghost" onClick={() => onDeleteGoal(goal)}>
            Eliminar
          </button>
        </div>
      )}
    </article>
  );
}
