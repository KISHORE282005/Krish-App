import { useState } from 'react';
import { useStore, QUOTES } from '../store/useStore';

const DAILY_CHALLENGES = [
  "Do 20 push-ups right now",
  "Drink 8 glasses of water today",
  "Write 3 things you're grateful for",
  "Read for 30 minutes straight",
  "Take a 10-minute cold shower",
  "Call someone you haven't spoken to in a month",
  "Learn 10 new German words",
];

const WEEKLY_CHALLENGES = [
  "Zero social media for 7 days",
  "Exercise every single day this week",
  "Cook healthy meals every day",
  "Read one full book this week",
];

const MONTHLY_CHALLENGES = [
  "Build and maintain a habit for 30 days",
  "Save 20% of your income this month",
  "Complete a full online course",
  "Meditate every day for a month",
];

export default function Motivation() {
  const { lifeGoals, missionStatement, dailyFocus, updateLifeGoals, updateMission, setDailyFocus } = useStore();
  const [quoteIdx, setQuoteIdx] = useState(new Date().getDate() % QUOTES.length);
  const [editMode, setEditMode] = useState(null);
  const [newGoal, setNewGoal] = useState('');
  const [editMission, setEditMission] = useState(missionStatement);
  const [editFocus, setEditFocus] = useState(dailyFocus);

  const quote = QUOTES[quoteIdx];
  const todayChallenge = DAILY_CHALLENGES[new Date().getDate() % DAILY_CHALLENGES.length];
  const weekChallenge = WEEKLY_CHALLENGES[Math.floor(new Date().getDate()/7) % WEEKLY_CHALLENGES.length];
  const monthChallenge = MONTHLY_CHALLENGES[new Date().getMonth() % MONTHLY_CHALLENGES.length];

  const addGoal = () => {
    if (newGoal.trim()) {
      updateLifeGoals([...lifeGoals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const removeGoal = (i) => {
    updateLifeGoals(lifeGoals.filter((_, idx) => idx !== i));
  };

  return (
    <div className="page-container">
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>DAILY FUEL</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>Motivation</h1>
      </div>

      {/* Quote of the Day */}
      <div className="glass-card anim-fade-up" style={{ padding:28, marginBottom:'var(--sp-md)',
        borderColor:'var(--border-gold)', animationDelay:'0.1s', position:'relative' }}>
        <div style={{ position:'absolute', top:-12, left:24,
          background:'var(--gold)', borderRadius:'var(--r-full)',
          padding:'4px 14px', fontSize:11, fontFamily:'var(--font-label)',
          fontWeight:700, color:'#1A1500', letterSpacing:'0.08em' }}>
          ✦ DAILY QUOTE
        </div>
        <p style={{ fontFamily:'var(--font-display)', fontSize:20, lineHeight:1.6,
          fontStyle:'italic', color:'var(--text-primary)', marginBottom:16, marginTop:8 }}>
          "{quote.text}"
        </p>
        <p style={{ color:'var(--gold)', fontWeight:600, fontSize:14 }}>— {quote.author}</p>
        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <button className="btn-ghost" style={{ flex:1, justifyContent:'center', padding:'10px 16px', fontSize:11 }}
            onClick={() => setQuoteIdx((quoteIdx + 1) % QUOTES.length)}>
            Next Quote ↻
          </button>
        </div>
      </div>

      {/* Challenges */}
      <div style={{ marginBottom:'var(--sp-md)' }} className="anim-fade-up" style={{ animationDelay:'0.15s' }}>
        <p className="label-sm" style={{ marginBottom:14 }}>⚡ ACTIVE CHALLENGES</p>
        {[
          { label:'Today', icon:'🎯', text:todayChallenge, color:'var(--emerald)', period:'Daily' },
          { label:'This Week', icon:'🔥', text:weekChallenge, color:'var(--gold)', period:'Weekly' },
          { label:'This Month', icon:'💎', text:monthChallenge, color:'#A855F7', period:'Monthly' },
        ].map((c, i) => (
          <div key={i} className="surface-card" style={{ marginBottom:10, borderLeft:`3px solid ${c.color}`,
            animation:`fadeInUp 0.35s ease both ${0.2+i*0.1}s` }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <span style={{ fontSize:24, flexShrink:0 }}>{c.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span className="chip" style={{ background:`${c.color}15`, color:c.color,
                    border:`1px solid ${c.color}30`, fontSize:10 }}>
                    {c.period}
                  </span>
                </div>
                <p style={{ fontWeight:600, fontSize:15, lineHeight:1.4 }}>{c.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Focus */}
      <div className="surface-card anim-fade-up" style={{ marginBottom:'var(--sp-md)', animationDelay:'0.3s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <p className="label-sm">🎯 DAILY FOCUS</p>
          <button className="btn-icon" onClick={() => setEditMode(editMode==='focus' ? null : 'focus')}>
            <span className="material-symbols-outlined" style={{ fontSize:16 }}>
              {editMode==='focus' ? 'close' : 'edit'}
            </span>
          </button>
        </div>
        {editMode === 'focus' ? (
          <div>
            <input className="input-field" value={editFocus}
              onChange={e => setEditFocus(e.target.value)}
              placeholder="What's your focus today?" />
            <button className="btn-primary" style={{ marginTop:10, width:'100%', justifyContent:'center' }}
              onClick={() => { setDailyFocus(editFocus); setEditMode(null); }}>
              Save Focus
            </button>
          </div>
        ) : (
          <p style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600,
            color:'var(--text-primary)', lineHeight:1.5 }}>
            {dailyFocus}
          </p>
        )}
      </div>

      {/* Life Goals */}
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)', animationDelay:'0.35s' }}>
        <div className="section-header">
          <p className="label-sm">🌟 LIFE GOALS</p>
          <button className="btn-icon" onClick={() => setEditMode(editMode==='goals' ? null : 'goals')}>
            <span className="material-symbols-outlined" style={{ fontSize:16 }}>
              {editMode==='goals' ? 'done' : 'edit'}
            </span>
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {lifeGoals.map((goal, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
              background:'var(--bg-surface-low)', borderRadius:'var(--r-lg)',
              border:'1px solid var(--border-light)',
            }}>
              <span style={{ color:'var(--gold)', fontWeight:700, fontFamily:'var(--font-label)',
                fontSize:13, minWidth:20 }}>{String(i+1).padStart(2,'0')}</span>
              <p style={{ flex:1, fontSize:14, fontWeight:500 }}>{goal}</p>
              {editMode === 'goals' && (
                <button className="btn-icon" onClick={() => removeGoal(i)}>
                  <span className="material-symbols-outlined" style={{ fontSize:16, color:'#FF6B6B' }}>remove_circle</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {editMode === 'goals' && (
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <input className="input-field" value={newGoal} onChange={e => setNewGoal(e.target.value)}
              placeholder="Add a new life goal..." style={{ borderRadius:'var(--r-sm)', border:'1px solid var(--border-light)' }}
              onKeyDown={e => e.key==='Enter' && addGoal()} />
            <button className="btn-primary" onClick={addGoal} style={{ padding:'14px 20px', flexShrink:0 }}>+</button>
          </div>
        )}
      </div>

      {/* Mission Statement */}
      <div className="glass-card anim-fade-up" style={{ padding:24, animationDelay:'0.4s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <p className="label-sm">📜 MISSION STATEMENT</p>
          <button className="btn-icon" onClick={() => setEditMode(editMode==='mission' ? null : 'mission')}>
            <span className="material-symbols-outlined" style={{ fontSize:16 }}>
              {editMode==='mission' ? 'close' : 'edit'}
            </span>
          </button>
        </div>

        {editMode === 'mission' ? (
          <div>
            <textarea className="input-field" value={editMission}
              onChange={e => setEditMission(e.target.value)} rows={4} />
            <button className="btn-primary" style={{ marginTop:10, width:'100%', justifyContent:'center' }}
              onClick={() => { updateMission(editMission); setEditMode(null); }}>
              Save Mission
            </button>
          </div>
        ) : (
          <p style={{ fontFamily:'var(--font-display)', fontSize:15, lineHeight:1.8,
            fontStyle:'italic', color:'var(--text-secondary)' }}>
            "{missionStatement}"
          </p>
        )}
      </div>
    </div>
  );
}
