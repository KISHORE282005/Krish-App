import { useState } from 'react';
import { useStore } from '../store/useStore';
import { today as todayKey } from '../utils/date';

const MOODS = ['😔','😕','😐','🙂','😊','😄','🤩'];
const MOOD_LABELS = ['Very Low','Low','Neutral','Good','Happy','Great','Excellent'];

export default function Journal({ setPage }) {
  const { journals, saveJournal } = useStore();
  const today = todayKey();
  const existing = journals[today];

  const [view, setView] = useState('write'); // 'write' | 'past'
  const [saved, setSaved] = useState(null); // null | 'saving' | 'db' | 'queued'
  const [form, setForm] = useState(existing || {
    achievement: '',
    mistake: '',
    learning: '',
    gratitude: '',
    tomorrow: '',
    mood: 4,
    energy: 7,
    rating: 4,
  });

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setSaved(null);
  };

  const handleSave = async () => {
    setSaved('saving');
    const inDb = await saveJournal(form);
    setSaved(inDb ? 'db' : 'queued');
  };

  const pastJournals = Object.entries(journals)
    .sort(([a],[b]) => b.localeCompare(a))
    .slice(0, 14);

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  return (
    <div className="page-container">
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>NIGHT REFLECTION</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>Daily Journal</h1>
      </div>

      {/* Tab */}
      <div className="tab-bar anim-fade-up" style={{ animationDelay:'0.1s', marginBottom:'var(--sp-md)' }}>
        <button className={`tab-btn ${view==='write'?'active':''}`} onClick={() => setView('write')}>✏️ Write Today</button>
        <button className={`tab-btn ${view==='past'?'active':''}`} onClick={() => setView('past')}>📖 Past Entries</button>
      </div>

      {view === 'write' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-md)' }}>
          {/* Mood selector */}
          <div className="glass-card anim-fade-up" style={{ padding:22, animationDelay:'0.15s' }}>
            <p className="label-sm" style={{ marginBottom:14 }}>😊 How do you feel today?</p>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              {MOODS.map((m, i) => (
                <button
                  key={i}
                  className={`mood-btn ${form.mood === i ? 'selected' : ''}`}
                  onClick={() => handleChange('mood', i)}
                  title={MOOD_LABELS[i]}
                >
                  {m}
                </button>
              ))}
            </div>
            <p style={{ textAlign:'center', color:'var(--gold)', fontWeight:600, fontSize:14 }}>
              {MOOD_LABELS[form.mood]}
            </p>
          </div>

          {/* Energy + Rating */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="surface-card anim-fade-up" style={{ animationDelay:'0.2s' }}>
              <p className="label-sm" style={{ marginBottom:12 }}>⚡ Energy Level</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--gold)', marginBottom:10 }}>
                {form.energy}<span style={{ fontSize:14, color:'var(--text-muted)' }}>/10</span>
              </p>
              <input
                type="range" min={1} max={10} value={form.energy}
                onChange={e => handleChange('energy', +e.target.value)}
                style={{ width:'100%', accentColor:'var(--gold)' }}
              />
            </div>
            <div className="surface-card anim-fade-up" style={{ animationDelay:'0.25s' }}>
              <p className="label-sm" style={{ marginBottom:12 }}>⭐ Productivity</p>
              <div className="stars" style={{ justifyContent:'center', marginBottom:8 }}>
                {[1,2,3,4,5].map(n => (
                  <span
                    key={n}
                    className={`star ${form.rating >= n ? 'active' : ''}`}
                    onClick={() => handleChange('rating', n)}
                  >★</span>
                ))}
              </div>
              <p style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>
                {form.rating}/5 stars
              </p>
            </div>
          </div>

          {/* Text fields */}
          {[
            { field:'achievement', label:"🏆 Today's Achievement", placeholder:"What did you accomplish today?" },
            { field:'mistake',     label:"⚠️ Today's Mistake",     placeholder:"What went wrong? What would you change?" },
            { field:'learning',    label:"💡 Today's Learning",    placeholder:"What new thing did you learn?" },
            { field:'gratitude',   label:"🙏 Gratitude",           placeholder:"What are you grateful for today?" },
            { field:'tomorrow',    label:"🎯 Tomorrow's Goal",     placeholder:"What's your #1 priority for tomorrow?" },
          ].map(({ field, label, placeholder }, i) => (
            <div key={field} className="anim-fade-up" style={{ animationDelay:`${0.3 + i*0.07}s` }}>
              <p className="label-sm" style={{ marginBottom:8 }}>{label}</p>
              <textarea
                className="input-field"
                placeholder={placeholder}
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                rows={3}
                style={{ minHeight:90 }}
              />
            </div>
          ))}

          {/* Save button */}
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saved === 'saving'}
            style={{ width:'100%', justifyContent:'center', fontSize:14, padding:18, marginTop:8 }}
          >
            {saved === 'saving' ? 'Saving…' : saved === 'db' ? '✓ Saved to database' : '💾 Save Journal Entry'}
          </button>
          {saved === 'db' && <p className="save-note ok">Stored safely. You can see it under Past Entries anytime.</p>}
          {saved === 'queued' && <p className="save-note warn">Saved on this device. The database server isn't reachable — it will be stored automatically when it's back.</p>}
          {!saved && existing?.savedAt && (
            <p className="save-note">Last saved {new Date(existing.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
          )}
        </div>
      )}

      {view === 'past' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {pastJournals.length === 0 ? (
            <div className="surface-card" style={{ textAlign:'center', padding:40 }}>
              <span style={{ fontSize:40 }}>📓</span>
              <p style={{ color:'var(--text-muted)', marginTop:12 }}>No journal entries yet.</p>
              <button className="btn-primary" style={{ marginTop:16 }} onClick={() => setView('write')}>
                Start Writing
              </button>
            </div>
          ) : (
            pastJournals.map(([date, entry]) => (
              <div key={date} className="surface-card" style={{ cursor:'pointer' }}
                onClick={() => { setForm(entry); setView('write'); }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <p style={{ fontWeight:600, fontSize:14 }}>{formatDate(date)}</p>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:18 }}>{MOODS[entry.mood] || '😊'}</span>
                    <div className="stars" style={{ fontSize:14 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} className={`star ${entry.rating >= n ? 'active' : ''}`}
                          style={{ fontSize:14, cursor:'default' }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                {entry.achievement && (
                  <p style={{ fontSize:13, color:'var(--text-muted)', overflow:'hidden',
                    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    🏆 {entry.achievement}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
