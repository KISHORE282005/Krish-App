import { useState } from 'react';
import TopBar from './components/Layout/TopBar';
import BottomNav from './components/Layout/BottomNav';
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

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Home',    icon: 'home' },
  { key: 'planner',      label: 'Planner', icon: 'calendar_month' },
  { key: 'habits',       label: 'Habits',  icon: 'check_circle' },
  { key: 'journal',      label: 'Journal', icon: 'book' },
  { key: 'stats',        label: 'Stats',   icon: 'bar_chart' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const PageComponent = PAGES[page]?.component || Dashboard;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      <TopBar currentPage={page} setPage={setPage} PAGES={PAGES} />
      <PageComponent setPage={setPage} />
      <BottomNav current={page} setPage={setPage} items={NAV_ITEMS} />
    </div>
  );
}
