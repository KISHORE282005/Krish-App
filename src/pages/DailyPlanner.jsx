import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  ROUTINE, RULES, IDEA_FIELDS, REVIEW_FIELDS, SUCCESS_CHECK, RULE_OF_THE_DAY,
} from '../store/routine';
import './DailyPlanner.css';
import { today as todayKey } from '../utils/date';

const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const RULES_TAB = { id: 'rules', title: 'Rules', tagline: 'Non-negotiable', icon: '🛡️', color: '#FF5C7A', glow: 'rgba(255,92,122,0.35)' };
const SCORE_TAB = { id: 'score', title: 'Score', tagline: 'Success check', icon: '⭐', color: '#D4AF37', glow: 'rgba(212,175,55,0.4)' };
const TABS = [...ROUTINE, RULES_TAB, SCORE_TAB];

const currentSectionId = () => {
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  return ROUTINE.find(s => now >= toMins(s.time) && now < toMins(s.endTime))?.id ?? 'morning';
};

/* ── 3D tilt wrapper: follows the pointer, springs back on leave ── */
function Tilt({ children, className = '', style, max = 10 }) {
  const ref = useRef(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  const glareX = useTransform(x, v => `${v * 100}%`);
  const glareY = useTransform(y, v => `${v * 100}%`);

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { x.set(0.5); y.set(0.5); };

  return (
    <motion.div
      ref={ref}
      className={`tilt ${className}`}
      style={{ ...style, rotateX, rotateY, '--gx': glareX, '--gy': glareY }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
      <div className="tilt-glare" />
    </motion.div>
  );
}

/* ── 3D keycap checkbox ── */
function KeyCheck({ on, onClick, size = 30, label }) {
  return (
    <button
      type="button"
      className={`key3d ${on ? 'on' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
    >
      <AnimatePresence>
        {on && (
          <motion.span
            className="material-symbols-outlined"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            style={{ fontSize: size * 0.6, fontVariationSettings: "'wght' 700" }}
          >check</motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ── Particle burst when a group completes ── */
function Burst() {
  return (
    <div className="burst" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} style={{ '--a': `${(360 / 14) * i}deg`, '--d': `${60 + (i % 3) * 22}px` }} />
      ))}
    </div>
  );
}

/* ── Rotating gyroscope hero showing total progress ── */
function Gyro({ pct }) {
  const R = 46, C = 2 * Math.PI * R;
  return (
    <div className="gyro-stage">
      <div className="gyro">
        <div className="ring r1" />
        <div className="ring r2" />
        <div className="ring r3" />
        <div className="core">
          <svg viewBox="0 0 110 110" className="core-ring">
            <circle cx="55" cy="55" r={R} className="core-track" />
            <motion.circle
              cx="55" cy="55" r={R} className="core-fill"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - pct / 100) }}
              transition={{ type: 'spring', stiffness: 60, damping: 16 }}
            />
          </svg>
          <div className="core-text">
            <strong>{pct}%</strong>
            <span>done</span>
          </div>
        </div>
      </div>
      <div className="gyro-shadow" />
    </div>
  );
}

function MiniRing({ pct, color }) {
  const R = 15, C = 2 * Math.PI * R;
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" className="mini-ring">
      <circle cx="19" cy="19" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <circle
        cx="19" cy="19" r={R} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
        style={{ transition: 'stroke-dashoffset .6s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
      <text x="19" y="23" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">{pct}</text>
    </svg>
  );
}

function NoteField({ label, value, onChange, rows = 2 }) {
  return (
    <label className="note-field">
      <span>{label}</span>
      <textarea rows={rows} value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Write here…" />
    </label>
  );
}

/* ── Group card ── */
function GroupCard({ group, section, log, onToggle, notes, setNote, index }) {
  const done = group.items.filter(i => log[i.id]).length;
  const pct = Math.round((done / group.items.length) * 100);
  const complete = done === group.items.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -25 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 120, damping: 16 }}
      style={{ transformPerspective: 1000 }}
    >
      <Tilt className={`group-card ${complete ? 'complete' : ''}`} max={6}>
        {complete && <Burst key={`${group.id}-burst`} />}
        <div className="group-head">
          <div className="icon-bubble">{group.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>{group.title}</h3>
            <div className="group-meta">
              {group.badge && <span className="badge">{group.badge}</span>}
              <span className={`prio prio-${group.priority}`}>{group.priority}</span>
            </div>
          </div>
          <MiniRing pct={pct} color={section.color} />
        </div>

        <ul className="item-list">
          {group.items.map(item => {
            const on = !!log[item.id];
            return (
              <li key={item.id} className={`item ${on ? 'done' : ''}`} onClick={() => onToggle(item.id)}>
                <KeyCheck on={on} label={item.label} onClick={(e) => { e.stopPropagation(); onToggle(item.id); }} />
                <span className="item-label">{item.label}</span>
              </li>
            );
          })}
        </ul>

        {group.ideaCard && (
          <div className="sub-panel">
            <p className="sub-title">💡 Today's idea</p>
            {IDEA_FIELDS.map(f => (
              <NoteField key={f.key} label={f.label} value={notes[f.key]} onChange={v => setNote(f.key, v)} />
            ))}
          </div>
        )}
      </Tilt>
    </motion.div>
  );
}

/* ── Top 3 priorities ── */
function TopThree({ notes, setNote }) {
  return (
    <Tilt className="panel3d top3" max={5}>
      <div className="panel-head">
        <span className="icon-bubble sm">🎯</span>
        <div>
          <h3>Today's Top 3</h3>
          <p className="label-sm">Finish the important things first</p>
        </div>
      </div>
      {[1, 2, 3].map(n => (
        <div key={n} className={`top3-row ${notes[`top${n}_done`] ? 'done' : ''}`}>
          <span className="top3-num">{n}</span>
          <input
            value={notes[`top${n}`] || ''}
            onChange={e => setNote(`top${n}`, e.target.value)}
            placeholder={n === 1 ? 'Most important thing today…' : 'Priority…'}
          />
          <KeyCheck size={28} on={!!notes[`top${n}_done`]} label={`Priority ${n} done`}
            onClick={() => setNote(`top${n}_done`, !notes[`top${n}_done`])} />
        </div>
      ))}
    </Tilt>
  );
}

/* ── Rules: flip tiles ── */
function RulesView({ log, onToggle }) {
  const kept = RULES.filter(r => log[r.id]).length;
  return (
    <>
      <p className="view-intro">Tap a rule once you've kept it today — <b>{kept}/{RULES.length}</b> kept.</p>
      <div className="rules-grid">
        {RULES.map((r, i) => {
          const on = !!log[r.id];
          return (
            <motion.button
              key={r.id}
              type="button"
              className={`flip-tile ${r.key ? 'key-rule' : ''}`}
              onClick={() => onToggle(r.id)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              aria-pressed={on}
            >
              <div className={`flip-inner ${on ? 'flipped' : ''}`}>
                <div className="flip-face front">
                  <span className="flip-icon">{r.icon}</span>
                  <span>{r.label}</span>
                </div>
                <div className="flip-face back">
                  <span className="material-symbols-outlined" style={{ fontSize: 30 }}>verified</span>
                  <span>{r.label}</span>
                  <small>Kept today</small>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

/* ── Score: success check + reflections ── */
function ScoreView({ log, notes, setNote }) {
  const groupDone = (gid) => {
    const g = ROUTINE.flatMap(s => s.groups).find(x => x.id === gid);
    return g.items.every(i => log[i.id]);
  };
  const reviewDone = REVIEW_FIELDS.every(f => (notes[f.key] || '').trim());
  const rows = SUCCESS_CHECK.map(c => ({
    ...c,
    ok: c.review ? reviewDone : c.rules ? c.rules.every(id => log[id]) : c.groups.every(groupDone),
  }));
  const okCount = rows.filter(r => r.ok).length;

  return (
    <>
      <Tilt className="panel3d rule-card" max={6}>
        <p className="label-sm" style={{ color: 'var(--gold)' }}>🔥 Rule for the day</p>
        <p className="rule-quote">“{RULE_OF_THE_DAY}”</p>
      </Tilt>

      <Tilt className="panel3d" max={4}>
        <div className="panel-head">
          <span className="icon-bubble sm">⭐</span>
          <div style={{ flex: 1 }}>
            <h3>Daily Success Check</h3>
            <p className="label-sm">Fills in automatically as you finish</p>
          </div>
          <span className="score-pill">{okCount}/{rows.length}</span>
        </div>
        <div className="success-grid">
          {rows.map((r, i) => (
            <motion.div
              key={r.label}
              className={`success-cell ${r.ok ? 'ok' : ''}`}
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="success-icon">{r.ok ? '✅' : r.icon}</span>
              <span>{r.label}</span>
            </motion.div>
          ))}
        </div>
      </Tilt>

      <Tilt className="panel3d" max={4}>
        <NoteField label="One thing I learned today" value={notes.learned} onChange={v => setNote('learned', v)} />
        <NoteField label="One thing I will improve tomorrow" value={notes.improve} onChange={v => setNote('improve', v)} />
      </Tilt>
    </>
  );
}

export default function DailyPlanner() {
  const { taskLogs, toggleTask, plannerNotes = {}, setPlannerNote, DEFAULT_TASKS } = useStore();
  const [tab, setTab] = useState(currentSectionId);
  const [dir, setDir] = useState(1);

  const today = todayKey();
  const log = taskLogs[today] || {};
  const notes = plannerNotes[today] || {};

  const doneTotal = DEFAULT_TASKS.filter(t => log[t.id]).length;
  const pct = Math.round((doneTotal / DEFAULT_TASKS.length) * 100);
  const nowSection = currentSectionId();

  const sectionPct = (t) => {
    const ids = t.id === 'rules' ? RULES.map(r => r.id)
      : t.id === 'score' ? null
      : t.groups.flatMap(g => g.items.map(i => i.id));
    if (!ids) return pct;
    return Math.round((ids.filter(id => log[id]).length / ids.length) * 100);
  };

  const active = TABS.find(t => t.id === tab);
  const changeTab = (id) => {
    setDir(TABS.findIndex(t => t.id === id) > TABS.findIndex(t => t.id === tab) ? 1 : -1);
    setTab(id);
  };

  return (
    <div className="page-container planner3d" style={{ '--accent': active.color, '--accent-glow': active.glow }}>
      {/* Hero */}
      <Tilt className="hero3d" max={8}>
        <div className="hero-copy">
          <p className="label-sm" style={{ color: 'var(--gold)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </p>
          <h1>My Daily<br /><span>Mission</span></h1>
          <p className="hero-sub">{doneTotal} of {DEFAULT_TASKS.length} steps complete</p>
        </div>
        <Gyro pct={pct} />
      </Tilt>

      <TopThree notes={notes} setNote={setPlannerNote} />

      {/* Section tabs */}
      <div className="tabs3d" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab3d ${tab === t.id ? 'active' : ''}`}
            style={{ '--c': t.color, '--g': t.glow }}
            onClick={() => changeTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-name">{t.title}</span>
            {t.id === nowSection && <span className="now-dot" title="Now" />}
            <span className="tab-prog"><i style={{ width: `${sectionPct(t)}%` }} /></span>
          </button>
        ))}
      </div>

      {/* Section panel with 3D flip transition */}
      <div className="stage3d">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={tab}
            custom={dir}
            initial={{ rotateY: dir * 70, opacity: 0, x: dir * 60 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: dir * -70, opacity: 0, x: dir * -60 }}
            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
            className="section3d"
          >
            <header className="section-head">
              <span className="section-emoji">{active.icon}</span>
              <div>
                <h2>{active.title}</h2>
                <p className="label-sm">
                  {active.tagline}{active.time ? ` · ${active.time} – ${active.endTime}` : ''}
                </p>
              </div>
              {active.time && <span className="section-pct">{sectionPct(active)}%</span>}
            </header>

            {tab === 'rules' ? (
              <RulesView log={log} onToggle={toggleTask} />
            ) : tab === 'score' ? (
              <ScoreView log={log} notes={notes} setNote={setPlannerNote} />
            ) : (
              <>
                {active.groups.map((g, i) => (
                  <GroupCard
                    key={g.id} group={g} section={active} index={i}
                    log={log} onToggle={toggleTask} notes={notes} setNote={setPlannerNote}
                  />
                ))}
                {active.reviewCard && (
                  <Tilt className="panel3d" max={4}>
                    <div className="panel-head">
                      <span className="icon-bubble sm">📝</span>
                      <div>
                        <h3>Daily Review</h3>
                        <p className="label-sm">Answer all six to tick it off</p>
                      </div>
                    </div>
                    {REVIEW_FIELDS.map(f => (
                      <NoteField key={f.key} label={f.label} value={notes[f.key]} onChange={v => setPlannerNote(f.key, v)} />
                    ))}
                  </Tilt>
                )}
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {pct === 100 && (
        <motion.div className="panel3d perfect" initial={{ scale: 0.6, rotateX: 60 }} animate={{ scale: 1, rotateX: 0 }}>
          <div className="trophy">🏆</div>
          <h3>Perfect Day!</h3>
          <p>Everything done. You're unstoppable.</p>
        </motion.div>
      )}
    </div>
  );
}
