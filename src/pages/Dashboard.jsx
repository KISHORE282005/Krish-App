import { useState, useEffect } from 'react';
import { useStore, DEFAULT_HABITS, DEFAULT_TASKS } from '../store/useStore';
import { getSyncStatus, SHEETS_WEB_APP_URL } from '../utils/googleSheets';
import StreakCalendar from '../components/StreakCalendar';
import { today as todayKey } from '../utils/date';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', // mountains
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', // sunrise peaks
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', // forest trail
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80', // minimal desk
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', // gym
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80', // ocean sunrise
  'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80', // night sky
];

function CircularRing({ score, size = 160 }) {
  const r = (size / 2) - 14;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const label = score >= 90 ? 'ELITE' : score >= 70 ? 'GREAT' : score >= 50 ? 'GOOD' : 'RISING';

  return (
    <div className="ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(212,175,55,0.1)" strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="#D4AF37" strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div className="ring-inner">
        <span style={{ fontFamily:'var(--font-display)', fontSize: size*0.22, fontWeight:700, color:'#fff', lineHeight:1 }}>
          {score}
        </span>
        <span className="label-sm" style={{ color:'var(--gold)', marginTop:4 }}>{label}</span>
      </div>
    </div>
  );
}

export default function Dashboard({ setPage }) {
  const { userName, getTodayScore, getDailyQuote, habitLogs, taskLogs, dailyFocus, getRecommendedTask, syncToSheets, getStreaks } = useStore();
  const [streakOpen, setStreakOpen] = useState(false);
  const [syncInfo, setSyncInfo] = useState(() => getSyncStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncInfo(getSyncStatus());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const score = getTodayScore();
  const recommendedTask = getRecommendedTask();
  const quote = getDailyQuote();
  const today = todayKey();

  const habitLog = habitLogs[today] || {};
  const taskLog = taskLogs[today] || {};

  const habitsDone = Object.values(habitLog).filter(Boolean).length;
  const tasksDone  = DEFAULT_TASKS.filter(t => taskLog[t.id]).length;
  const tasksRemaining = DEFAULT_TASKS.length - tasksDone;

  const { current: streak } = getStreaks();

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const heroIdx = new Date().getDate() % HERO_IMAGES.length;

  const upcomingTasks = DEFAULT_TASKS
    .filter(t => !t.allDay && !taskLog[t.id])
    .slice(0, 3);

  return (
    <div className="page-container">
      {/* Hero */}
      <section className="hero-section anim-fade-in">
        <img src={HERO_IMAGES[heroIdx]} alt="Daily motivation" loading="lazy" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6, letterSpacing:'0.18em' }}>
            {dayOfWeek.toUpperCase()} · {dateStr.toUpperCase()}
          </p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700, color:'#fff', lineHeight:1.2 }}>
            Conquer the peak,<br />
            <span style={{ color:'var(--gold)' }}>{userName}</span>.
          </h2>
        </div>
      </section>

      {/* Sync Status */}
      {SHEETS_WEB_APP_URL && (
        <div
          className="anim-fade-up"
          style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 16px', marginBottom:'var(--sp-md)',
            background: syncInfo.status === 'success' ? 'rgba(16,185,129,0.1)' :
                        syncInfo.status === 'error' ? 'rgba(239,68,68,0.1)' :
                        syncInfo.status === 'syncing' ? 'rgba(212,175,55,0.1)' :
                        'var(--bg-surface-low)',
            border: `1px solid ${
              syncInfo.status === 'success' ? 'rgba(16,185,129,0.3)' :
              syncInfo.status === 'error' ? 'rgba(239,68,68,0.3)' :
              'var(--border-light)'
            }`,
            borderRadius:'var(--r-md)', cursor:'pointer',
          }}
          onClick={() => syncToSheets().then(() => setSyncInfo(getSyncStatus()))}
          title="Click to force sync"
        >
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{
              width:8, height:8, borderRadius:'50%',
              background: syncInfo.status === 'success' ? '#10b981' :
                          syncInfo.status === 'error' ? '#ef4444' :
                          syncInfo.status === 'syncing' ? '#D4AF37' :
                          '#6b7280',
              animation: syncInfo.status === 'syncing' ? 'pulse 1s infinite' : 'none',
            }} />
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>
              {syncInfo.status === 'success' && `Synced ${new Date(syncInfo.lastSync).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}`}
              {syncInfo.status === 'error' && `Sync failed — tap to retry`}
              {syncInfo.status === 'syncing' && 'Syncing to Sheets...'}
              {syncInfo.status === 'idle' && 'Sync active'}
            </span>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:'var(--text-muted)' }}>cloud_upload</span>
        </div>
      )}

      {/* Quote */}
      <div className="glass-card anim-fade-up" style={{ padding:'20px 24px', marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:8 }}>✦ Daily Inspiration</p>
        <p style={{ fontFamily:'var(--font-display)', fontSize:16, fontStyle:'italic', lineHeight:1.6, color:'var(--text-primary)' }}>
          "{quote.text}"
        </p>
        <p className="label-sm" style={{ marginTop:10, color:'var(--text-muted)' }}>— {quote.author}</p>
      </div>

      {/* Score + Streaks */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:'var(--sp-md)' }}>
        {/* Score ring */}
        <div className="glass-card" style={{
          gridColumn: '1/-1', display:'flex', alignItems:'center',
          gap:24, padding:24, animation: 'fadeInUp 0.4s ease backwards 0.1s'
        }}>
          <CircularRing score={score} size={130} />
          <div style={{ flex:1 }}>
            <p className="label-sm" style={{ marginBottom:8 }}>Daily Productivity Score</p>
            <div style={{ marginBottom:12 }}>
              <div className="mini-bar-bg">
                <div className="mini-bar-fill" style={{ width:`${(habitsDone/DEFAULT_HABITS.length)*100}%` }} />
              </div>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                {habitsDone}/{DEFAULT_HABITS.length} habits
              </p>
            </div>
            <div style={{ marginBottom:16 }}>
              <div className="mini-bar-bg">
                <div className="mini-bar-fill green" style={{ width:`${(tasksDone/DEFAULT_TASKS.length)*100}%` }} />
              </div>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                {tasksDone}/{DEFAULT_TASKS.length} tasks
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-primary" style={{ padding:'10px 16px', fontSize:11 }}
                onClick={() => setPage('habits')}>
                Log Habit
              </button>
              <button className="btn-ghost" style={{ padding:'10px 16px', fontSize:11 }}
                onClick={() => setPage('journal')}>
                Journal
              </button>
            </div>
          </div>
        </div>

        {/* Streaks */}
        <button type="button" className="streak-badge" onClick={() => setStreakOpen(true)}
          style={{ animation:'fadeInUp 0.4s ease backwards 0.2s' }} aria-label="Open streak calendar">
          <span style={{ fontSize:22 }}>🔥</span>
          <span className="streak-number">{streak}</span>
          <span className="label-sm">Day Streak</span>
          <span className="tap-hint">Tap for calendar <span className="material-symbols-outlined" style={{ fontSize:12 }}>calendar_month</span></span>
        </button>
        <div className="streak-badge" style={{ animation:'fadeInUp 0.4s ease backwards 0.25s' }}>
          <span style={{ fontSize:22 }}>⚡</span>
          <span className="streak-number">{score}</span>
          <span className="label-sm">Today Score</span>
        </div>
      </div>

      <StreakCalendar open={streakOpen} onClose={() => setStreakOpen(false)} />

      {/* Daily Focus */}
      <div className="surface-card anim-fade-up" style={{ marginBottom:'var(--sp-md)', animationDelay:'0.3s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <span className="material-symbols-outlined" style={{ color:'var(--gold)' }}>my_location</span>
          <p className="label-sm">Daily Focus</p>
        </div>
        <p style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600, color:'var(--text-primary)' }}>
          {dailyFocus}
        </p>
      </div>

      <div className="surface-card anim-fade-up" style={{ marginBottom:'var(--sp-md)', animationDelay:'0.32s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <span className="material-symbols-outlined" style={{ color:'var(--gold)' }}>schedule</span>
          <p className="label-sm">Recommended Task</p>
        </div>
        <p style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>
          {recommendedTask ? recommendedTask.label : 'Everything is complete for now.'}
        </p>
        {recommendedTask && (
          <p className="label-sm" style={{ marginTop:6 }}>
            {recommendedTask.time} – {recommendedTask.endTime}
          </p>
        )}
      </div>

      {/* Upcoming Tasks */}
      <div style={{ animationDelay:'0.35s' }} className="anim-fade-up">
        <div className="section-header">
          <h3 className="section-title">Up Next</h3>
          <button className="btn-icon" onClick={() => setPage('planner')}>
            <span className="material-symbols-outlined" style={{ fontSize:18 }}>arrow_forward</span>
          </button>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="surface-card" style={{ textAlign:'center', padding:32 }}>
            <span style={{ fontSize:36 }}>🎉</span>
            <p style={{ color:'var(--emerald)', fontWeight:600, marginTop:8 }}>All tasks complete!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {upcomingTasks.map((task, i) => (
              <div key={task.id} className="surface-card" style={{
                display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
                animation:`fadeInUp 0.3s ease backwards ${0.4 + i*0.08}s`
              }}>
                <span style={{ fontSize:22 }}>{task.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:600 }}>{task.label}</p>
                  <p className="label-sm">{task.time} – {task.endTime}</p>
                </div>
                <span className={`chip ${task.priority === 'high' ? 'chip-red' : task.priority === 'medium' ? 'chip-gold' : 'chip-blue'}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:'var(--sp-md)', animation:'fadeInUp 0.4s ease backwards 0.5s' }}>
        {[
          { icon:'school', label:'Knowledge', page:'knowledge', emoji:'📚' },
          { icon:'emoji_events', label:'Achievements', page:'achievements', emoji:'🏆' },
          { icon:'bar_chart', label:'Statistics', page:'stats', emoji:'📊' },
          { icon:'bolt', label:'Motivation', page:'motivation', emoji:'⚡' },
        ].map(item => (
          <button
            key={item.page}
            onClick={() => setPage(item.page)}
            style={{
              background:'var(--bg-surface-low)', border:'1px solid var(--border-light)',
              borderRadius:'var(--r-lg)', padding:'16px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:12,
              color:'var(--text-primary)', transition:'all 0.2s',
              fontFamily:'var(--font-body)', fontSize:14, fontWeight:500,
            }}
            onMouseOver={e => e.currentTarget.style.borderColor='var(--border-gold)'}
            onMouseOut={e => e.currentTarget.style.borderColor='var(--border-light)'}
          >
            <span style={{ fontSize:24 }}>{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
