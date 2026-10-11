const ITEMS = [{ id: 'friends', label: 'Amigos', icon: '👥' }];

export function SideMenu({ open, onClose, active, onNavigate }) {
  return (
    <>
      {open && <div className="side-menu-backdrop" onClick={onClose} />}
      <aside className={`side-menu ${open ? 'is-open' : ''}`}>
        <div className="side-menu-head">
          <span>Más</span>
          <button className="chat-sidebar-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className={`chat-thread-item ${active === item.id ? 'is-active' : ''}`}
            onClick={() => {
              onNavigate(item.id);
              onClose();
            }}
          >
            <span className="chat-thread-icon">{item.icon}</span>
            <span className="chat-thread-info">
              <span className="chat-thread-title">{item.label}</span>
            </span>
          </button>
        ))}
      </aside>
    </>
  );
}
