const TABS = [
  { id: 'goals', label: 'Camino', icon: '🧭' },
  { id: 'progress', label: 'Progreso', icon: '🔥' },
  { id: 'profile', label: 'Perfil', icon: '🙂' },
];

export function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-nav-item ${active === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
