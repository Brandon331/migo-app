export function GoalCard({ goal, steps, onToggleStep, onDeleteGoal, onArchiveGoal }) {
  const total = steps.length;
  const done = steps.filter((s) => s.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;
  const isArchived = goal.status === 'archived';

  return (
    <article className={`goal ${isComplete ? 'is-complete' : ''}`}>
      <div className="goal-top">
        <h3 className={`goal-title ${isComplete ? 'is-complete' : ''}`}>
          <span className={isComplete ? 'strike' : ''}>{goal.title}</span>
        </h3>
      </div>

      {goal.pending_ai_breakdown && total === 0 && (
        <p className="goal-pending">
          <span className="spinner" aria-hidden="true" />
          {navigator.onLine
            ? 'Generando los pasos…'
            : 'Se generarán los pasos en cuanto tengas conexión.'}
        </p>
      )}

      {total > 0 && (
        <>
          <div className="progress-row">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="progress-label">{done}/{total}</span>
          </div>

          <ul className="step-list">
            {steps.map((step) => (
              <li key={step.id} className={`step ${step.completed ? 'completed' : ''}`}>
                <input
                  className="step-checkbox"
                  type="checkbox"
                  checked={step.completed}
                  onChange={() => onToggleStep(step)}
                  id={`step-${step.id}`}
                />
                <label htmlFor={`step-${step.id}`}>
                  <span className="step-title">{step.title}</span>
                  {step.description && (
                    <span className="step-description">{step.description}</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      {isComplete && (
        <p className="complete-banner">✓ Meta completada</p>
      )}

      {!isArchived && (
        <div className="goal-actions">
          {isComplete && (
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
