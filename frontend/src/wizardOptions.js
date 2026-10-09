// Mismas claves que backend/src/utils/timeline.js — si cambias una, cambia la otra.
export const DURATION_OPTIONS = [
  { value: '1_week', label: '1 semana', hint: 'un empujón rápido' },
  { value: '1_month', label: '1 mes', hint: 'un ritmo constante' },
  { value: '3_months', label: '3 meses', hint: 'algo más ambicioso' },
  { value: '6_months_plus', label: '6 meses o más', hint: 'un cambio de fondo' },
];

export const COMMITMENT_OPTIONS = [
  { value: 'low', label: 'Poco', hint: '1-2 horas a la semana' },
  { value: 'medium', label: 'Medio', hint: '3-5 horas a la semana' },
  { value: 'high', label: 'Bastante', hint: '6+ horas a la semana' },
];
