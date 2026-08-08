import { useState } from 'react';
import { useStore } from '../../store/useStore';

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
  const { userName, getTodayScore } = useStore();
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
          <nav style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 260,
            background: 'var(--bg-surface-low)',
            borderLeft: '1px solid var(--border-light)',
            zIndex: 201, padding: '80px 20px 20px',
            display: 'flex', flexDirection: 'column', gap: 8,
            animation: 'fadeIn 0.2s ease',
          }}>
            <p className="label-sm" style={{ marginBottom: 12, paddingLeft: 12 }}>Navigation</p>
            {ALL_PAGES.map(p => (
              <button
                key={p.key}
                onClick={() => { setPage(p.key); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 'var(--r-lg)',
                  border: 'none', cursor: 'pointer',
                  background: currentPage === p.key ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: currentPage === p.key ? 'var(--gold)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
                  transition: 'all 0.2s', width: '100%', textAlign: 'left',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{p.icon}</span>
                {p.label}
              </button>
            ))}

            <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--bg-surface-mid)', borderRadius: 'var(--r-lg)' }}>
              <p className="label-sm" style={{ marginBottom: 4 }}>Logged in as</p>
              <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 15 }}>{userName}</p>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
