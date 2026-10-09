import { computeStreaks } from '../streak.js';

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

export function StreakStrip({ completedSubsteps }) {
  const { current, dateSet } = computeStreaks(completedSubsteps);

  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  return (
    <div className="streak-card">
      <div className="streak-count">
        <span className="streak-flame">🔥</span>
        <span className="streak-number">{current}</span>
      </div>
      <div className="streak-days">
        {days.map((d, i) => {
          const isToday = dateKey(d) === dateKey(today);
          const isActive = dateSet.has(dateKey(d));
          return (
            <div className="streak-day" key={i}>
              <div className={`streak-dot ${isActive ? 'is-active' : ''} ${isToday ? 'is-today' : ''}`} />
              <span className="streak-label">{DAY_LABELS[d.getDay()]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
