const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

/** Recibe los substeps completados (con completedAt) y arma los últimos 7 días + racha. */
export function StreakStrip({ completedSubsteps }) {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const completedDates = new Set(
    (completedSubsteps || [])
      .filter((s) => s.completedAt)
      .map((s) => dateKey(new Date(s.completedAt)))
  );

  // Racha: días consecutivos con actividad, contando hacia atrás desde hoy.
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (completedDates.has(dateKey(d))) {
      streak++;
    } else if (i === 0) {
      continue; // hoy puede seguir sin actividad y no rompe la racha de ayer
    } else {
      break;
    }
  }

  return (
    <div className="streak-card">
      <div className="streak-count">
        <span className="streak-flame">🔥</span>
        <span className="streak-number">{streak}</span>
      </div>
      <div className="streak-days">
        {days.map((d, i) => {
          const isToday = dateKey(d) === dateKey(today);
          const isActive = completedDates.has(dateKey(d));
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
