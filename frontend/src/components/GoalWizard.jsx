import { useEffect, useState } from 'react';
import { DURATION_OPTIONS, COMMITMENT_OPTIONS } from '../wizardOptions.js';

const STEP_TITLE = 0;
const STEP_DURATION = 1;
const STEP_COMMITMENT = 2;
const STEP_LOADING = 3;

export function GoalWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(STEP_TITLE);
  const [title, setTitle] = useState('');
  const [durationLabel, setDurationLabel] = useState(null);
  const [weeklyCommitment, setWeeklyCommitment] = useState(null);

  useEffect(() => {
    if (step !== STEP_LOADING) return;
    onComplete({ title: title.trim(), durationLabel, weeklyCommitment });
    const timer = setTimeout(() => onCancel(), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleTitleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setStep(STEP_DURATION);
  }

  function handleDuration(value) {
    setDurationLabel(value);
    setStep(STEP_COMMITMENT);
  }

  function handleCommitment(value) {
    setWeeklyCommitment(value);
    setStep(STEP_LOADING);
  }

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true">
      <div className="wizard-card">
        {step < STEP_LOADING && (
          <button className="wizard-close" onClick={onCancel} aria-label="Cerrar">
            ✕
          </button>
        )}

        {step === STEP_TITLE && (
          <div className="wizard-step" key="step-title">
            <span className="wizard-eyebrow">Paso 1 de 3</span>
            <h2 className="wizard-question">Ok, ¿qué quieres lograr?</h2>
            <form className="wizard-form" onSubmit={handleTitleSubmit}>
              <input
                type="text"
                autoFocus
                placeholder="Ej: aprender a tocar guitarra"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button type="submit" disabled={!title.trim()}>
                Sigamos
              </button>
            </form>
          </div>
        )}

        {step === STEP_DURATION && (
          <div className="wizard-step" key="step-duration">
            <span className="wizard-eyebrow">Paso 2 de 3</span>
            <h2 className="wizard-question">¿Para cuándo la quieres lista?</h2>
            <div className="wizard-options">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="wizard-option"
                  onClick={() => handleDuration(opt.value)}
                >
                  <span className="wizard-option-label">{opt.label}</span>
                  <span className="wizard-option-hint">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === STEP_COMMITMENT && (
          <div className="wizard-step" key="step-commitment">
            <span className="wizard-eyebrow">Paso 3 de 3</span>
            <h2 className="wizard-question">¿Cuánto tiempo real le vas a meter cada semana?</h2>
            <p className="wizard-subtext">Sé honesto — con esto calibro qué tan grandes son tus pasos.</p>
            <div className="wizard-options">
              {COMMITMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="wizard-option"
                  onClick={() => handleCommitment(opt.value)}
                >
                  <span className="wizard-option-label">{opt.label}</span>
                  <span className="wizard-option-hint">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === STEP_LOADING && (
          <div className="wizard-step wizard-loading" key="step-loading">
            <div className="wizard-circle" aria-hidden="true" />
            <p className="wizard-loading-text">Dame un segundo, le estoy buscando la vuelta…</p>
          </div>
        )}
      </div>
    </div>
  );
}
