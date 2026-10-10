// Frases de Migo para la pantalla de inicio — directas, con humor, cómplices,
// y mencionan la meta real cuando hay una a la mano, en vez de genéricas tipo
// "¡sigue así!".

const NO_GOALS_LINES = [
  'Todavía no tenemos nada entre manos. ¿Empezamos?',
  'Esto está muy tranquilo. Cuéntame qué quieres lograr.',
];

const WITH_GOAL_LINES = [
  (title) => `¿Cómo vas con "${title}"?`,
  (title) => `Oye, ¿qué onda con "${title}"? No me has contado nada.`,
  (title) => `"${title}" sigue ahí, esperando. ¿Le metemos hoy?`,
  (title) => `Llevas rato con "${title}". ¿Seguimos o ajustamos el plan?`,
];

const MULTI_GOAL_LINES = [
  (a, b) => `Tienes "${a}" y "${b}" en la mesa. ¿Cuál toca hoy?`,
  (a, b) => `Entre "${a}" y "${b}", ¿cuál te está costando más?`,
];

export function pickMigoHomeLine(activeGoalTitles) {
  if (!activeGoalTitles || activeGoalTitles.length === 0) {
    return NO_GOALS_LINES[Math.floor(Math.random() * NO_GOALS_LINES.length)];
  }

  if (activeGoalTitles.length >= 2 && Math.random() < 0.4) {
    const [a, b] = activeGoalTitles;
    const fn = MULTI_GOAL_LINES[Math.floor(Math.random() * MULTI_GOAL_LINES.length)];
    return fn(a, b);
  }

  const title = activeGoalTitles[Math.floor(Math.random() * activeGoalTitles.length)];
  const fn = WITH_GOAL_LINES[Math.floor(Math.random() * WITH_GOAL_LINES.length)];
  return fn(title);
}
