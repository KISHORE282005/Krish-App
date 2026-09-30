import { useState } from 'react';
import { useStore, DEFAULT_HABITS } from '../store/useStore';

const CATEGORIES = ['all', 'health', 'discipline', 'learning', 'personal'];
const CAT_LABELS = { all:'All', health:'🏥 Health', discipline:'💪 Discipline', learning:'📚 Learning', personal:'🌟 Personal' };

function HabitRing({ pct, size = 38 }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth={3.5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#D4AF37" strokeWidth={3.5}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition:'stroke-dashoffset 0.8s ease' }}/>
    </svg>
  );
}

export default function HabitTracker() {
  const { habitLogs, toggleHabit } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [justToggled, setJustToggled] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const todayLog = habitLogs[today] || {};

  const filtered = activeCategory === 'all'
    ? DEFAULT_HABITS
    : DEFAULT_HABITS.filter(h => h.category === activeCategory);

  const totalDone = DEFAULT_HABITS.filter(h => todayLog[h.id]).length;
  const totalPct = Math.round((totalDone / DEFAULT_HABITS.length) * 100);

  // Calculate streak per habit
  const getHabitStreak = (habitId) => {
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split('T')[0];
      if (habitLogs[key]?.[habitId]) { s++; d.setDate(d.getDate()-1); }
      else break;
    }
    return s;
  };

  // Monthly completion %
  const getMonthlyPct = (habitId) => {
    const now = new Date();
    let total = 0, done = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      total++;
      if (habitLogs[key]?.[habitId]) done++;
    }
    return Math.round((done / total) * 100);
  };

  const handleToggle = (id) => {
    toggleHabit(id);
    setJustToggled(id);
    setTimeout(() => setJustToggled(null), 500);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>TODAY'S HABITS</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>
          Habit Tracker
        </h1>
      </div>

      {/* Overall progress */}
      <div className="glass-card anim-fade-up" style={{ padding:20, marginBottom:'var(--sp-md)', animationDelay:'0.1s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <p style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--gold)', lineHeight:1 }}>
              {totalDone}<span style={{ fontSize:16, color:'var(--text-muted)' }}>/{DEFAULT_HABITS.length}</span>
            </p>
            <p className="label-sm" style={{ marginTop:4 }}>habits completed</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--emerald)', lineHeight:1 }}>
              {totalPct}%
            </p>
            <p className="label-sm" style={{ marginTop:4 }}>daily progress</p>
          </div>
        </div>
        <div className="mini-bar-bg" style={{ height:6 }}>
          <div className="mini-bar-fill" style={{ width:`${totalPct}%`, height:6 }} />
        </div>
      </div>

      {/* Category tabs */}
      <div className="tab-bar anim-fade-up" style={{ animationDelay:'0.15s' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Habit list */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map((habit, i) => {
          const done = !!todayLog[habit.id];
          const streak = getHabitStreak(habit.id);
          const monthPct = getMonthlyPct(habit.id);

          return (
            <div
              key={habit.id}
              className={`habit-item ${done ? 'done' : ''}`}
              style={{ animation:`fadeInUp 0.3s ease backwards ${i*0.05}s`, cursor:'pointer' }}
              onClick={() => handleToggle(habit.id)}
            >
              {/* Check button */}
              <div className="habit-check" style={{
                transform: justToggled === habit.id ? 'scale(1.3)' : 'scale(1)',
                transition: 'all 0.25s ease',
              }}>
                {done && (
                  <span className="material-symbols-outlined" style={{ color:'#062b1f', fontSize:17, fontVariationSettings:"'wght' 700" }}>check</span>
                )}
              </div>

              {/* Emoji */}
              <span style={{ fontSize:22, flexShrink:0 }}>{habit.icon}</span>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{
                  fontWeight:600, fontSize:14, lineHeight:1.3,
                  color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: done ? 'line-through' : 'none',
                  marginBottom:4,
                }}>
                  {habit.label}
                </p>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                    🔥 {streak} day streak
                  </span>
                  <div style={{ flex:1, maxWidth:60 }}>
                    <div className="mini-bar-bg" style={{ height:3 }}>
                      <div className="mini-bar-fill" style={{ width:`${monthPct}%`, height:3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>{monthPct}%</span>
                </div>
              </div>

              {/* Ring */}
              <HabitRing pct={monthPct} />
            </div>
          );
        })}
      </div>

      {totalDone === DEFAULT_HABITS.length && (
        <div className="glass-card" style={{
          textAlign:'center', padding:28, marginTop:'var(--sp-md)',
          borderColor:'var(--border-gold)', animation:'scaleIn 0.4s ease'
        }}>
          <span style={{ fontSize:44 }}>🔥</span>
          <p style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--gold)', marginTop:8 }}>
            All habits done!
          </p>
          <p style={{ color:'var(--text-muted)', marginTop:4 }}>
            You're on fire today. Keep the streak alive!
          </p>
        </div>
      )}
    </div>
  );
}
