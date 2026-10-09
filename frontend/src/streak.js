function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

/** A partir de los substeps completados, calcula racha actual, racha más
 * larga histórica, y el set de días (YYYY-MM-DD) con actividad. */
export function computeStreaks(completedSubsteps) {
  const dates = (completedSubsteps || [])
    .filter((s) => s.completedAt)
    .map((s) => dateKey(new Date(s.completedAt)));

  const uniqueDates = Array.from(new Set(dates)).sort();
  const dateSet = new Set(uniqueDates);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dateSet.has(dateKey(d))) {
      current++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  let longest = 0;
  let running = 0;
  let prev = null;
  for (const key of uniqueDates) {
    const d = new Date(key);
    if (prev) {
      const diff = Math.round((d - prev) / (1000 * 60 * 60 * 24));
      running = diff === 1 ? running + 1 : 1;
    } else {
      running = 1;
    }
    longest = Math.max(longest, running);
    prev = d;
  }

  return { current, longest, dateSet, totalDaysActive: uniqueDates.length };
}
