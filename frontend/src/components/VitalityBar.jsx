export function VitalityBar({ value, today }) {
  const level = value >= 66 ? 'high' : value >= 33 ? 'mid' : 'low';

  let caption;
  if (today) {
    caption = 'Hoy ya avanzaste. Así se ve.';
  } else if (level === 'low') {
    caption = 'Llevo días esperando. Un paso chico y ya.';
  } else if (level === 'mid') {
    caption = 'Se está enfriando. Haz algo hoy.';
  } else {
    caption = 'Todavía no haces nada hoy — la racha no se cuida sola.';
  }

  return (
    <div className="vitality">
      <div className="vitality-top">
        <span className="vitality-label">Vitalidad de Migo</span>
        <span className="vitality-value">{value}%</span>
      </div>
      <div className="vitality-track">
        <div className={`vitality-fill is-${level}`} style={{ width: `${value}%` }} />
      </div>
      <p className="vitality-caption">{caption}</p>
    </div>
  );
}
