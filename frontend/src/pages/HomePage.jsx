import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';
import { Mascot } from '../components/Mascot.jsx';
import { VitalityBar } from '../components/VitalityBar.jsx';
import { StreakStrip } from '../components/StreakStrip.jsx';
import { computeVitality } from '../vitality.js';
import { pickMigoHomeLine } from '../migoPhrases.js';

export function HomePage({ onGoToMetas }) {
  const goals = useLiveQuery(() => db.goals.orderBy('updatedAt').reverse().toArray(), []);
  const milestones = useLiveQuery(() => db.milestones.toArray(), []);
  const substeps = useLiveQuery(() => db.substeps.toArray(), []);

  const loading = !goals || !milestones || !substeps;

  const activeGoals = useMemo(() => {
    if (loading) return [];
    return goals.filter((g) => {
      if (g.status === 'archived') return false;
      const goalMilestones = milestones.filter((m) => m.goalId === g.id);
      return !(goalMilestones.length > 0 && goalMilestones.every((m) => m.status === 'completed'));
    });
  }, [loading, goals, milestones]);

  const completedSubsteps = loading ? [] : substeps.filter((s) => s.completed);

  const vitality = useMemo(
    () => computeVitality(completedSubsteps, activeGoals.length > 0),
    [completedSubsteps, activeGoals.length]
  );

  // Se elige una vez por carga de pantalla, no en cada render.
  const [line] = useState(() => pickMigoHomeLine(activeGoals.map((g) => g.title)));

  return (
    <div className="home-page">
      <div className="home-hero">
        <Mascot message={loading ? null : line} celebrating={vitality.trend === 'up'} />
        <h1 className="home-mascot-name">Migo</h1>
      </div>

      {!loading && <VitalityBar value={vitality.value} today={vitality.today} />}

      {!loading && activeGoals.length > 0 && (
        <div className="home-streak-wrap">
          <StreakStrip completedSubsteps={completedSubsteps} />
        </div>
      )}

      <button className="home-cta" onClick={onGoToMetas}>
        {activeGoals.length === 0 ? 'Crear mi primera meta' : 'Ir a tu planeación'}
      </button>

      {!loading && activeGoals.length > 0 && (
        <p className="home-subcta">
          {activeGoals.length} meta{activeGoals.length === 1 ? '' : 's'} en curso ahora mismo.
        </p>
      )}
    </div>
  );
}
