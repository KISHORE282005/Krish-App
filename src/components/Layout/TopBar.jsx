import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { pendingCount, onPendingChange } from '../../utils/api';

const ALL_PAGES = [
  { key: 'dashboard',    label: 'Home',         icon: 'home' },
  { key: 'planner',      label: 'Planner',      icon: 'calendar_month' },
  { key: 'habits',       label: 'Habits',       icon: 'check_circle' },
  { key: 'journal',      label: 'Journal',      icon: 'book' },
  { key: 'knowledge',    label: 'Knowledge',    icon: 'school' },
  { key: 'stats',        label: 'Statistics',   icon: 'bar_chart' },
  { key: 'achievements', label: 'Achievements', icon: 'emoji_events' },
  { key: 'calendar',     label: 'Calendar',     icon: 'grid_view' },
  { key: 'motivation',   label: 'Motivation',   icon: 'bolt' },
];

export default function TopBar({ currentPage, setPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userName, getTodayScore, logoutUser } = useStore();
  const [pending, setPending] = useState(pendingCount);
  useEffect(() => onPendingChange(setPending), []);
  const score = getTodayScore();

  const pageLabels = {
    dashboard: 'ASCEND',
    planner: 'Daily Planner',
    habits: 'Habit Tracker',
    journal: 'Night Journal',
    knowledge: 'Knowledge Hub',
    stats: 'Statistics',
    achievements: 'Achievements',
    calendar: 'Calendar',
    motivation: 'Motivation',
  };

  return (
    <>
      <header className="top-bar">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {currentPage !== 'dashboard' && (
            <button className="btn-icon" onClick={() => setPage('dashboard')}>
              <span className="material-symbols-outlined" style={{ fontSize:22 }}>arrow_back</span>
            </button>
          )}
          <span className="top-bar-title">
            {currentPage === 'dashboard' ? 'ASCEND' : pageLabels[currentPage]}
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {currentPage === 'dashboard' && (
            <div className="chip chip-gold" style={{ fontSize:13, fontWeight:700 }}>
              <span>⚡</span> {score}
            </div>
          )}
          <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="material-symbols-outlined" style={{ fontSize:24 }}>
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Slide-out menu */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 200, backdropFilter: 'blur(4px)',
            }}
          />
          <nav className="drawer3d">
            <p className="label-sm" style={{ marginBottom: 12, paddingLeft: 12 }}>Navigation</p>
            {ALL_PAGES.map(p => (
              <button
                key={p.key}
                className={`drawer-item ${currentPage === p.key ? 'active' : ''}`}
                onClick={() => { setPage(p.key); setMenuOpen(false); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{p.icon}</span>
                {p.label}
              </button>
            ))}

            <div className="drawer-user">
              <p className="label-sm" style={{ marginBottom: 4 }}>Logged in as</p>
              <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 15 }}>{userName}</p>
              <p style={{ fontSize: 12, color: pending ? 'var(--gold-dim)' : 'var(--emerald)', marginTop: 6 }}>
                {pending ? `⏳ ${pending} change(s) waiting to save…` : '✓ All data saved to database'}
              </p>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '10px 16px' }}
                onClick={() => { setMenuOpen(false); logoutUser(); }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Log out
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
