import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import TopBar from './components/Layout/TopBar';
import BottomNav from './components/Layout/BottomNav';
import Scene3D, { useTilt3D } from './components/Layout/Scene3D';
import Dashboard from './pages/Dashboard';
import DailyPlanner from './pages/DailyPlanner';
import HabitTracker from './pages/HabitTracker';
import Journal from './pages/Journal';
import KnowledgeCenter from './pages/KnowledgeCenter';
import Statistics from './pages/Statistics';
import Achievements from './pages/Achievements';
import CalendarPage from './pages/CalendarPage';
import Motivation from './pages/Motivation';

const PAGES = {
  dashboard:   { label: 'Home',        icon: 'home',         component: Dashboard },
  planner:     { label: 'Planner',     icon: 'calendar_month', component: DailyPlanner },
  habits:      { label: 'Habits',      icon: 'check_circle', component: HabitTracker },
  journal:     { label: 'Journal',     icon: 'book',         component: Journal },
  knowledge:   { label: 'Learn',       icon: 'school',       component: KnowledgeCenter },
  stats:       { label: 'Stats',       icon: 'bar_chart',    component: Statistics },
  achievements:{ label: 'Awards',      icon: 'emoji_events', component: Achievements },
  calendar:    { label: 'Calendar',    icon: 'grid_view',    component: CalendarPage },
  motivation:  { label: 'Inspire',     icon: 'bolt',         component: Motivation },
};

// Accent colour + glow per page (drives cards, tabs, nav and the 3D background)
const ACCENTS = {
  dashboard:    ['#D4AF37', 'rgba(212,175,55,0.35)'],
  planner:      ['#F5B94A', 'rgba(245,185,74,0.35)'],
  habits:       ['#34D399', 'rgba(52,211,153,0.35)'],
  journal:      ['#A78BFA', 'rgba(167,139,250,0.35)'],
  knowledge:    ['#5B9DFF', 'rgba(91,157,255,0.35)'],
  stats:        ['#22D3EE', 'rgba(34,211,238,0.32)'],
  achievements: ['#D4AF37', 'rgba(212,175,55,0.4)'],
  calendar:     ['#FF8A5B', 'rgba(255,138,91,0.35)'],
  motivation:   ['#FF5C7A', 'rgba(255,92,122,0.35)'],
};

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Home',    icon: 'home' },
  { key: 'planner',      label: 'Planner', icon: 'calendar_month' },
  { key: 'habits',       label: 'Habits',  icon: 'check_circle' },
  { key: 'journal',      label: 'Journal', icon: 'book' },
  { key: 'stats',        label: 'Stats',   icon: 'bar_chart' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const authStatus = useStore(s => s.auth.status);
  const initAuth = useStore(s => s.initAuth);
  const PageComponent = PAGES[page]?.component || Dashboard;
  const [accent, glow] = ACCENTS[page] || ACCENTS.dashboard;
  useTilt3D();

  useEffect(() => { initAuth(); }, [initAuth]);
  useEffect(() => { if (authStatus !== 'in') setPage('dashboard'); }, [authStatus]);

  let content;
  if (authStatus === 'checking') {
    content = <div className="app-splash" aria-label="Loading"><div className="login-orb" /></div>;
  } else if (authStatus !== 'in') {
    content = <Login />;
  } else {
    content = (
      <>
        <TopBar currentPage={page} setPage={setPage} PAGES={PAGES} />
        <PageComponent key={page} setPage={setPage} />
        <BottomNav current={page} setPage={setPage} items={NAV_ITEMS} />
      </>
    );
  }

  return (
    <div className="app3d" style={{ '--accent': accent, '--accent-glow': glow }}>
      <Scene3D />
      {content}
    </div>
  );
}
