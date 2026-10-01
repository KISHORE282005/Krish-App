import { useState } from 'react';
import { useStore } from '../store/useStore';
import { dateKey } from '../utils/date';

export default function CalendarPage({ setPage }) {
  const { journals, getDayInfo } = useStore();
  useStore(s => s.habitLogs); // re-render on changes
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString('en-US', { month:'long', year:'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = dateKey();

  const getDayStatus = (day) => {
    const info = getDayInfo(getDateKey(day));
    const ratio = info.habitsDone ? info.habitsDone / info.habitsTotal : info.legacyDone / 15;
    if (!info.hasData) return 'empty';
    if (ratio >= 0.85) return 'perfect';
    if (info.done) return 'partial';
    return 'missed';
  };

  const getDateKey = (day) => {
    return dateKey(new Date(year, month, day));
  };

  const prevMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
    setSelectedDay(null);
  };

  const selectedJournal = selectedDay ? journals[getDateKey(selectedDay)] : null;
  const selectedInfo = selectedDay ? getDayInfo(getDateKey(selectedDay)) : null;
  const selectedHabitCount = selectedInfo ? (selectedInfo.habitsDone || selectedInfo.legacyDone) : 0;

  // Summary stats
  const perfectDays  = Array.from({length:daysInMonth},(_,i)=>getDayStatus(i+1)).filter(s=>s==='perfect').length;
  const partialDays  = Array.from({length:daysInMonth},(_,i)=>getDayStatus(i+1)).filter(s=>s==='partial').length;
  const missedDays   = Array.from({length:daysInMonth},(_,i)=>getDayStatus(i+1)).filter(s=>s==='missed').length;

  return (
    <div className="page-container">
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>MONTHLY VIEW</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>Calendar</h1>
      </div>

      {/* Month nav */}
      <div className="glass-card anim-fade-up" style={{ padding:20, marginBottom:'var(--sp-md)', animationDelay:'0.1s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <button className="btn-icon" onClick={prevMonth}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <p style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600 }}>{monthLabel}</p>
          <button className="btn-icon" onClick={nextMonth}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Day labels */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:8 }}>
          {['S','M','T','W','T','F','S'].map((d,i) => (
            <div key={i} style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)',
              fontFamily:'var(--font-label)', fontWeight:600, letterSpacing:'0.05em', padding:'4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {/* Empty cells */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`e${i}`} className="cal-day empty" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayKey = getDateKey(day);
            const status = getDayStatus(day);
            const isToday = dayKey === todayStr;
            const isSelected = selectedDay === day;

            return (
              <div
                key={day}
                className={`cal-day ${isToday ? 'today' : ''} ${status}`}
                style={{
                  outline: isSelected ? '2px solid var(--gold)' : 'none',
                  outlineOffset: 2,
                  fontWeight: isToday ? 700 : 400,
                }}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:'var(--sp-md)' }}
        className="anim-fade-up" data-delay="0.2s">
        {[
          { color:'rgba(16,185,129,0.4)', label:`Perfect (${perfectDays})` },
          { color:'rgba(233,195,73,0.4)', label:`Partial (${partialDays})` },
          { color:'rgba(255,107,107,0.3)', label:`Missed (${missedDays})` },
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
            <div style={{ width:12, height:12, borderRadius:3, background:l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="glass-card anim-scale-in" style={{ padding:22 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600 }}>
              {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
                weekday:'long', month:'long', day:'numeric'
              })}
            </p>
            <button className="btn-icon" onClick={() => setSelectedDay(null)}>
              <span className="material-symbols-outlined" style={{ fontSize:18 }}>close</span>
            </button>
          </div>

          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <div className="surface-card" style={{ flex:1, textAlign:'center', padding:'14px 8px' }}>
              <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700,
                color: getDayStatus(selectedDay) === 'perfect' ? 'var(--emerald)' : 'var(--gold)' }}>
                {selectedHabitCount}
              </p>
              <p className="label-sm" style={{ marginTop:4 }}>habits done</p>
            </div>
            <div className="surface-card" style={{ flex:1, textAlign:'center', padding:'14px 8px' }}>
              <span style={{ fontSize:24 }}>
                {{ perfect:'🏆', partial:'⚡', missed:'😔', empty:'—' }[getDayStatus(selectedDay)]}
              </span>
              <p className="label-sm" style={{ marginTop:4 }}>
                {{ perfect:'Perfect', partial:'Good', missed:'Missed', empty:'No data' }[getDayStatus(selectedDay)]}
              </p>
            </div>
          </div>

          {selectedJournal ? (
            <div>
              <p className="label-sm" style={{ marginBottom:10 }}>📓 Journal Entry</p>
              {selectedJournal.achievement && (
                <div style={{ background:'var(--bg-surface-mid)', borderRadius:'var(--r-md)', padding:'12px 14px', marginBottom:8 }}>
                  <p className="label-sm" style={{ marginBottom:4 }}>🏆 Achievement</p>
                  <p style={{ fontSize:14, color:'var(--text-secondary)' }}>{selectedJournal.achievement}</p>
                </div>
              )}
              {selectedJournal.learning && (
                <div style={{ background:'var(--bg-surface-mid)', borderRadius:'var(--r-md)', padding:'12px 14px', marginBottom:8 }}>
                  <p className="label-sm" style={{ marginBottom:4 }}>💡 Learning</p>
                  <p style={{ fontSize:14, color:'var(--text-secondary)' }}>{selectedJournal.learning}</p>
                </div>
              )}
              {selectedJournal.gratitude && (
                <div style={{ background:'var(--bg-surface-mid)', borderRadius:'var(--r-md)', padding:'12px 14px' }}>
                  <p className="label-sm" style={{ marginBottom:4 }}>🙏 Gratitude</p>
                  <p style={{ fontSize:14, color:'var(--text-secondary)' }}>{selectedJournal.gratitude}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:16 }}>
              <p style={{ color:'var(--text-muted)', fontSize:14 }}>No journal entry for this day.</p>
              {getDateKey(selectedDay) === todayStr && (
                <button className="btn-primary" style={{ marginTop:12 }} onClick={() => setPage('journal')}>
                  Write Today's Journal
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
