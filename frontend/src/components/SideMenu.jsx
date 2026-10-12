const SECTIONS = [
  { id: 'home', label: 'Migo', icon: '🔮' },
  { id: 'metas', label: 'Metas', icon: '🧭' },
  { id: 'progress', label: 'Progreso', icon: '🔥' },
  { id: 'chat', label: 'Chat', icon: '💬' },
];

const EXTRAS = [
  { id: 'friends', label: 'Amigos', icon: '👥' },
  { id: 'profile', label: 'Perfil', icon: '🙂' },
];

export function SideMenu({ open, onClose, active, onNavigate }) {
  function go(id) {
    onNavigate(id);
    onClose();
  }

  return (
    <>
      {open && <div className="side-menu-backdrop" onClick={onClose} />}
      <aside className={`side-menu ${open ? 'is-open' : ''}`}>
        <div className="side-menu-head">
          <span>Migo</span>
          <button className="chat-sidebar-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <nav className="side-menu-nav">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              className={`chat-thread-item ${active === item.id ? 'is-active' : ''}`}
              onClick={() => go(item.id)}
            >
              <span className="chat-thread-icon">{item.icon}</span>
              <span className="chat-thread-info">
                <span className="chat-thread-title">{item.label}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="side-menu-divider" />

        <nav className="side-menu-nav">
          {EXTRAS.map((item) => (
            <button
              key={item.id}
              className={`chat-thread-item ${active === item.id ? 'is-active' : ''}`}
              onClick={() => go(item.id)}
            >
              <span className="chat-thread-icon">{item.icon}</span>
              <span className="chat-thread-info">
                <span className="chat-thread-title">{item.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
