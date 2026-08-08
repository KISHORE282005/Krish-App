import { useState } from 'react';
import { useStore, DEFAULT_TASKS } from '../store/useStore';

const PRIORITY_COLORS = { high: 'chip-red', medium: 'chip-gold', low: 'chip-blue' };

export default function DailyPlanner() {
  const { taskLogs, toggleTask, getRecommendedTask } = useStore();
  const [justDone, setJustDone] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const taskLog = taskLogs[today] || {};
  const recommendedTask = getRecommendedTask();

  const tasks = DEFAULT_TASKS.map(t => ({ ...t, done: taskLog[t.id] ?? false }));
  const doneCount = tasks.filter(t => t.done).length;
  const progress = Math.round((doneCount / tasks.length) * 100);

  const handleToggle = (id) => {
    toggleTask(id);
    setJustDone(id);
    setTimeout(() => setJustDone(null), 600);
  };

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const parseTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>
          {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' }).toUpperCase()}
        </p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>
          Today's Schedule
        </h1>
      </div>

      <div className="glass-card anim-fade-up" style={{ padding:'20px 24px', marginBottom:'var(--sp-md)', animationDelay:'0.1s' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:8 }}>Recommended now</p>
        <p style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>
          {recommendedTask ? recommendedTask.label : 'You are all caught up today.'}
        </p>
        {recommendedTask && (
          <p className="label-sm" style={{ marginTop:6 }}>
            {recommendedTask.time} – {recommendedTask.endTime}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="glass-card anim-fade-up" style={{ padding:'20px 24px', marginBottom:'var(--sp-md)', animationDelay:'0.12s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <p style={{ fontWeight:600, fontSize:15 }}>{doneCount} of {tasks.length} tasks</p>
            <p className="label-sm">completed today</p>
          </div>
          <div style={{
            width:60, height:60, borderRadius:'50%',
            background:`conic-gradient(var(--gold) ${progress}%, var(--bg-surface-high) 0)`,
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <div style={{
              width:46, height:46, borderRadius:'50%',
              background:'var(--bg-surface-low)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:'var(--gold)'
            }}>{progress}%</div>
          </div>
        </div>
        <div className="mini-bar-bg">
          <div className="mini-bar-fill" style={{ width:`${progress}%` }} />
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position:'relative' }}>
        {tasks.map((task, i) => {
          const startMins = parseTime(task.time);
          const isNow = !task.done && Math.abs(startMins - nowMins) < 60;
          const isPast = !task.done && startMins < nowMins;

          return (
            <div
              key={task.id}
              className={`timeline-item ${task.done ? 'done' : ''}`}
              style={{ animation:`fadeInUp 0.35s ease both ${i * 0.04}s` }}
            >
              {/* Dot */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                <div className={`timeline-dot`} style={{
                  background: task.done
                    ? 'rgba(16,185,129,0.15)'
                    : isNow ? 'rgba(212,175,55,0.15)' : 'var(--bg-surface-mid)',
                  borderColor: task.done
                    ? 'var(--emerald)'
                    : isNow ? 'var(--gold)' : 'var(--border-light)',
                  boxShadow: isNow ? '0 0 12px rgba(212,175,55,0.3)' : 'none',
                }}>
                  {task.done
                    ? <span className="material-symbols-outlined" style={{ color:'var(--emerald)', fontSize:18 }}>check</span>
                    : <span style={{ fontSize:18 }}>{task.icon}</span>
                  }
                </div>
                {i < tasks.length - 1 && (
                  <div style={{
                    width:2, flex:1, minHeight:24,
                    background: task.done ? 'rgba(16,185,129,0.3)' : 'var(--border-light)',
                    marginTop:4
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{
                flex:1, paddingTop:6, paddingBottom:20,
                opacity: isPast && !task.done ? 0.5 : 1,
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                  <div>
                    {isNow && (
                      <span className="chip chip-gold" style={{ marginBottom:6, display:'inline-flex' }}>
                        🎯 Now
                      </span>
                    )}
                    <p style={{
                      fontFamily:'var(--font-display)', fontWeight:600, fontSize:15,
                      color: task.done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: task.done ? 'line-through' : 'none',
                    }}>
                      {task.label}
                    </p>
                    <p className="label-sm" style={{ marginTop:4 }}>
                      {task.time} – {task.endTime}
                    </p>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                    <span className={`chip ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    <button
                      onClick={() => handleToggle(task.id)}
                      style={{
                        width:32, height:32, borderRadius:'50%',
                        border: task.done ? '2px solid var(--emerald)' : '2px solid var(--border-light)',
                        background: task.done ? 'var(--emerald)' : 'transparent',
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all 0.25s',
                        transform: justDone === task.id ? 'scale(1.3)' : 'scale(1)',
                      }}
                    >
                      {task.done && <span className="material-symbols-outlined" style={{ color:'#fff', fontSize:16 }}>check</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {doneCount === tasks.length && (
        <div className="glass-card" style={{ textAlign:'center', padding:32, borderColor:'var(--border-gold)' }}>
          <span style={{ fontSize:40 }}>🏆</span>
          <p style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--gold)', marginTop:8 }}>
            Perfect Day!
          </p>
          <p style={{ color:'var(--text-muted)', marginTop:4 }}>All tasks completed. You're unstoppable.</p>
        </div>
      )}
    </div>
  );
}
