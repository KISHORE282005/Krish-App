import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { dateKey } from '../utils/date';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Month-by-month view of done / missed days. Opened from the Day Streak badge. */
export default function StreakCalendar({ open, onClose }) {
  const { getDayInfo, getStreaks, getFirstDate } = useStore();
  useStore(s => s.habitLogs); // re-render when habits change
  const [view, setView] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(dateKey());

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const todayKey = dateKey();
  const firstKey = getFirstDate() || todayKey;
  const { current, longest } = getStreaks();

  const year = view.getFullYear(), month = view.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const lead = new Date(year, month, 1).getDay();

  const statusOf = (key) => {
    if (key > todayKey) return 'future';
    const info = getDayInfo(key);
    if (info.done) return 'done';
    if (key === todayKey) return 'today';
    if (key < firstKey) return 'before';
    return 'missed';
  };

  const monthKeys = Array.from({ length: days }, (_, i) => dateKey(new Date(year, month, i + 1)));
  const doneCount = monthKeys.filter(k => statusOf(k) === 'done').length;
  const missedCount = monthKeys.filter(k => statusOf(k) === 'missed').length;

  const shift = (n) => setView(new Date(year, month + n, 1));
  const atCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

  const sel = getDayInfo(selected);
  const selStatus = statusOf(selected);
  const selLabel = new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Portal to the app root: the page's 3D perspective would otherwise trap position:fixed.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="streak-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Streak calendar"
            onClick={e => e.stopPropagation()}
            initial={{ rotateX: -35, y: 60, opacity: 0 }}
            animate={{ rotateX: 0, y: 0, opacity: 1 }}
            exit={{ rotateX: 30, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          >
            <button className="btn-icon modal-close" onClick={onClose} aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="streak-top">
              <div className="streak-stat">
                <span className="flame">🔥</span>
                <strong>{current}</strong>
                <span className="label-sm">Current streak</span>
              </div>
              <div className="streak-stat">
                <span className="flame">🏆</span>
                <strong>{longest}</strong>
                <span className="label-sm">Best streak</span>
              </div>
            </div>

            <div className="streak-month">
              <button className="btn-icon" onClick={() => shift(-1)} aria-label="Previous month">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <h3>{view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              <button className="btn-icon" onClick={() => shift(1)} disabled={atCurrentMonth} aria-label="Next month">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <div className="streak-grid">
              {WEEKDAYS.map((w, i) => <span key={i} className="streak-wd">{w}</span>)}
              {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
              {monthKeys.map((k, i) => {
                const st = statusOf(k);
                return (
                  <motion.button
                    key={k}
                    className={`streak-day ${st} ${k === selected ? 'selected' : ''} ${k === todayKey ? 'is-today' : ''}`}
                    onClick={() => setSelected(k)}
                    disabled={st === 'future'}
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: i * 0.012 }}
                    aria-label={`${k}: ${st}`}
                  >
                    <span>{i + 1}</span>
                    {st === 'done' && <i className="material-symbols-outlined">check</i>}
                    {st === 'missed' && <i className="material-symbols-outlined">close</i>}
                  </motion.button>
                );
              })}
            </div>

            <div className="streak-legend">
              <span><i className="lg done" />Done ({doneCount})</span>
              <span><i className="lg missed" />Not done ({missedCount})</span>
              <span><i className="lg today" />Today</span>
            </div>

            <div className={`streak-detail ${selStatus}`}>
              <p className="label-sm">{selLabel}</p>
              <p className="detail-status">
                {selStatus === 'done' ? '✅ Done — counted in your streak'
                  : selStatus === 'today' ? '⏳ In progress — finish half your habits to count it'
                  : selStatus === 'missed' ? '❌ Not done'
                  : selStatus === 'before' ? 'Before you started tracking'
                  : 'Upcoming'}
              </p>
              {selStatus !== 'future' && selStatus !== 'before' && (
                <div className="detail-chips">
                  {sel.legacyDone > 0 && sel.habitsDone === 0
                    ? <span>🗂️ {sel.legacyDone}/15 old habits</span>
                    : <span>🎯 {sel.habitsDone}/{sel.habitsTotal} habits</span>}
                  <span>✔️ {sel.tasksDone}/{sel.tasksTotal} tasks</span>
                  <span>{sel.journal ? '📓 Journal written' : '📓 No journal'}</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.querySelector('.app3d') || document.body
  );
}
