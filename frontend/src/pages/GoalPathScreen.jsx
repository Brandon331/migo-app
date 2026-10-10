import { daysUntil, computePaceStatus } from '../dateHelpers.js';
import { groupMilestonesByTime } from '../pathGrouping.js';

export function GoalPathScreen({ goal, milestones, substepsByMilestone, onToggleSubstep, onBack, onChatAboutGoal }) {
  const groups = groupMilestonesByTime(goal, milestones);
  const daysLeftToTarget = daysUntil(goal.targetDate);
  const pace = computePaceStatus(goal, milestones);

  return (
    <div className="path-screen">
      <button className="chat-back" onClick={onBack}>
        ← Metas
      </button>

      <div className="path-screen-header">
        <h1>{goal.title}</h1>
        {daysLeftToTarget !== null && (
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
      </div>

      <button className="ghost path-screen-chat-cta" onClick={() => onChatAboutGoal(goal.id)}>
        Hablar con Migo de esta meta
      </button>

      {groups.map((group) => (
        <div className="path-group" key={group.key}>
          <h2 className="path-group-label">{group.label}</h2>

          <div className="trail">
            {group.milestones.map((milestone) => {
              const substeps = substepsByMilestone[milestone.id] || [];
              return (
                <div className="trail-item" key={milestone.id}>
                  <div className="trail-rail">
                    <div className={`trail-node is-${milestone.status}`}>
                      {milestone.status === 'completed' ? '✓' : milestone.status === 'locked' ? '🔒' : '●'}
                    </div>
                  </div>

                  <div className="trail-content">
                    <div className="trail-title-row">
                      <p className={`trail-title is-${milestone.status}`}>{milestone.title}</p>
                    </div>
                    {milestone.status !== 'completed' && milestone.description && (
                      <p className={`trail-desc ${milestone.status === 'locked' ? 'is-locked' : ''}`}>
                        {milestone.description}
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
                                id={`path-substep-${step.id}`}
                              />
                              <label htmlFor={`path-substep-${step.id}`}>
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
        </div>
      ))}
    </div>
  );
}
