// Mismas claves que usa el frontend en su wizard — si cambias una, cambia la otra.
export const DURATION_DAYS = {
  '1_week': 7,
  '1_month': 30,
  '3_months': 90,
  '6_months_plus': 180,
};

export const DURATION_LABELS = {
  '1_week': '1 semana',
  '1_month': '1 mes',
  '3_months': '3 meses',
  '6_months_plus': '6 meses o más',
};

export const COMMITMENT_LABELS = {
  low: 'poco tiempo por semana (1-2 horas)',
  medium: 'tiempo medio por semana (3-5 horas)',
  high: 'bastante tiempo por semana (6+ horas)',
};

export function durationToDays(durationLabel) {
  return DURATION_DAYS[durationLabel] || 30;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(days));
  return d;
}

export function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}
