import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { dateKey } from '../../utils/date';

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
  const { userName, getTodayScore, logoutUser, exportBackup, importBackup } = useStore();
  const [backupMsg, setBackupMsg] = useState(null);
  const fileRef = useRef(null);

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `ascend-backup-${dateKey()}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
    setBackupMsg('✓ Backup downloaded');
  };

  const restoreBackup = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const added = importBackup(JSON.parse(await file.text()));
      setBackupMsg(`✓ Imported ${added} day(s)`);
    } catch (err) {
      setBackupMsg(`✗ ${err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message}`);
    }
  };
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
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Data is saved in this browser. Download a backup to keep it safe or move it to another device.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '10px 8px' }} onClick={downloadBackup}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span> Export
                </button>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '10px 8px' }} onClick={() => fileRef.current.click()}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload</span> Import
                </button>
                <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={restoreBackup} />
              </div>
              {backupMsg && <p style={{ fontSize: 12, marginTop: 8, color: backupMsg.startsWith('✓') ? 'var(--emerald)' : '#FF8B8B' }}>{backupMsg}</p>}
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
