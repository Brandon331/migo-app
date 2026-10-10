// Barra de vida de Migo: empieza llena, sube poco a poco cuando avanzas en tus
// metas, baja poco a poco cuando pasa un día sin que hagas nada. Se calcula
// siempre fresco a partir del historial (igual que las rachas) — nada que
// sincronizar ni guardar aparte.

const GAIN_PER_DAY = 12;
const LOSS_PER_DAY = 9;
const START_VALUE = 70;
const SIMULATE_DAYS = 21; // no hace falta ir más atrás que esto

function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

export function computeVitality(completedSubsteps, hasActiveGoals) {
  if (!hasActiveGoals) {
    return { value: 100, trend: 'neutral', today: null };
  }

  const activeDays = new Set(completedSubsteps.map((s) => dateKey(s.completedAt)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let value = START_VALUE;
  let lastDelta = 0;

  // Simulamos desde hace SIMULATE_DAYS días hasta AYER (hoy todavía está en curso,
  // así que no se castiga ni se premia hasta que el día cierre).
  for (let i = SIMULATE_DAYS; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    if (activeDays.has(key)) {
      lastDelta = GAIN_PER_DAY;
      value = Math.min(100, value + GAIN_PER_DAY);
    } else {
      lastDelta = -LOSS_PER_DAY;
      value = Math.max(0, value - LOSS_PER_DAY);
    }
  }

  const didToday = activeDays.has(dateKey(today));

  return {
    value: Math.round(value),
    trend: didToday ? 'up' : lastDelta < 0 ? 'down' : 'steady',
    today: didToday,
  };
}
