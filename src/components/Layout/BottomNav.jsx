export default function BottomNav({ current, setPage, items }) {
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.key}
          className={`nav-item ${current === item.key ? 'active' : ''}`}
          onClick={() => setPage(item.key)}
        >
          <span
            className="material-symbols-outlined nav-icon"
            style={{ fontVariationSettings: current === item.key ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 200" }}
          >
            {item.icon}
          </span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
