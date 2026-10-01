import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scheduleSync, syncNow, getSyncStatus } from '../utils/googleSheets';
import {
  DEFAULT_TASKS, HABITS, habitTaskIds, deriveHabitLog, dayScore, STREAK_MIN_SCORE,
} from './routine';
import * as auth from '../utils/auth';
import { today, dateKey, addDays, parseKey } from '../utils/date';

// Habits now come from the planner (see routine.js). Kept under the old name for the pages.
const DEFAULT_HABITS = HABITS;

const parseTimeToMinutes = (time) => {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
};

const getCurrentMinutes = () => new Date().getHours() * 60 + new Date().getMinutes();

const ACHIEVEMENTS = [
  { id: 'a1',  icon: '🔥', title: '7-Day Streak',     desc: 'Complete all habits for 7 days',    condition: s => s >= 7  },
  { id: 'a2',  icon: '⚡', title: '30-Day Streak',    desc: 'Complete all habits for 30 days',   condition: s => s >= 30 },
  { id: 'a3',  icon: '💎', title: '100-Day Streak',   desc: 'Complete all habits for 100 days',  condition: s => s >= 100},
  { id: 'a4',  icon: '🌅', title: 'Early Bird',       desc: 'Log exercise before 6 AM',         condition: () => false  },
  { id: 'a5',  icon: '💪', title: 'Fitness Master',   desc: 'Complete exercise 30 times',        condition: () => false  },
  { id: 'a6',  icon: '📚', title: 'Learning Champ',   desc: 'Study for 50 hours total',          condition: () => false  },
  { id: 'a7',  icon: '👑', title: 'Discipline King',  desc: 'No reels for 30 days',             condition: () => false  },
  { id: 'a8',  icon: '📊', title: 'Investor',         desc: 'Study stocks for 20 days',         condition: () => false  },
  { id: 'a9',  icon: '🤖', title: 'Tech Explorer',    desc: 'Read tech news for 14 days',       condition: () => false  },
  { id:'a10',  icon: '🗣️', title: 'Language Learner', desc: 'Complete 20 German lessons',       condition: () => false  },
  { id:'a11',  icon: '🎯', title: 'Goal Crusher',     desc: 'Achieve a 90+ score for 7 days',   condition: () => false  },
  { id:'a12',  icon: '✨', title: 'Perfect Week',     desc: 'Score 100% for 7 straight days',   condition: () => false  },
];

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
];

const SETTING_KEYS = ['dailyFocus', 'lifeGoals', 'missionStatement', 'userName'];

const DEFAULT_SETTINGS = {
  userName: 'Krish',
  dailyFocus: 'Become 1% better today',
  lifeGoals: [
    'Build a successful business',
    'Achieve financial freedom',
    'Master German language',
    'Become physically elite',
    'Read 52 books a year',
  ],
  missionStatement: 'I am building a disciplined, healthy, and knowledgeable life through consistent daily actions.',
};

const EMPTY_DATA = { journals: {}, taskLogs: {}, plannerNotes: {}, legacyHabitLogs: {}, habitLogs: {} };

/** habitLogs for every date that has planner ticks or notes. */
function deriveAllHabits(taskLogs = {}, plannerNotes = {}) {
  const dates = new Set([...Object.keys(taskLogs), ...Object.keys(plannerNotes)]);
  return Object.fromEntries([...dates].map(d => [d, deriveHabitLog(taskLogs[d], plannerNotes[d])]));
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      ...EMPTY_DATA,
      userAvatar: null,

      // Auth (not persisted): 'checking' | 'out' | 'in'
      auth: { status: 'checking', user: null, error: null },

      /* ── Getters ── */
      getTodayHabits: () => get().habitLogs[today()] || {},
      getTodayTasks: () => {
        const overrides = get().taskLogs[today()] || {};
        return DEFAULT_TASKS.map(t => ({ ...t, done: overrides[t.id] ?? t.done }));
      },
      getRecommendedTask: () => {
        const overrides = get().taskLogs[today()] || {};
        const tasks = DEFAULT_TASKS.map(t => ({ ...t, done: overrides[t.id] ?? t.done }));
        const nowMins = getCurrentMinutes();
        const timed = tasks.filter(t => !t.allDay);

        const activeTask = timed.find(t => !t.done && nowMins >= parseTimeToMinutes(t.time) && nowMins <= parseTimeToMinutes(t.endTime));
        if (activeTask) return activeTask;

        const nextTask = timed.find(t => !t.done && parseTimeToMinutes(t.time) >= nowMins);
        return nextTask || timed.find(t => !t.done) || null;
      },
      getTodayScore: () => get().getDayScore(today()),
      getDayScore: (key) => {
        const s = get();
        return dayScore(s.habitLogs[key], s.taskLogs[key], s.legacyHabitLogs[key]);
      },
      getDailyQuote: () => QUOTES[new Date().getDate() % QUOTES.length],

      /** Everything the streak calendar needs about one day. */
      getDayInfo: (key) => {
        const s = get();
        const habitsDone = HABITS.filter(h => s.habitLogs[key]?.[h.id]).length;
        const tasksDone = DEFAULT_TASKS.filter(t => s.taskLogs[key]?.[t.id]).length;
        const legacyDone = Object.values(s.legacyHabitLogs[key] || {}).filter(Boolean).length;
        const score = s.getDayScore(key);
        return {
          habitsDone, habitsTotal: HABITS.length,
          tasksDone, tasksTotal: DEFAULT_TASKS.length,
          legacyDone,
          score,
          journal: !!s.journals[key],
          done: score >= STREAK_MIN_SCORE, // only days scoring 20+ add to the streak
          hasData: habitsDone > 0 || tasksDone > 0 || legacyDone > 0 || !!s.journals[key],
        };
      },

      /** First day with any recorded data (YYYY-MM-DD) or null. */
      getFirstDate: () => {
        const s = get();
        const keys = [
          ...Object.keys(s.taskLogs).filter(k => Object.values(s.taskLogs[k]).some(Boolean)),
          ...Object.keys(s.legacyHabitLogs).filter(k => Object.values(s.legacyHabitLogs[k]).some(Boolean)),
          ...Object.keys(s.journals),
        ].sort();
        return keys[0] || null;
      },

      /** { current, longest }. An unfinished today doesn't break the streak until the day is over. */
      getStreaks: () => {
        const { getDayInfo, getFirstDate } = get();
        let current = 0;
        let d = new Date();
        if (!getDayInfo(dateKey(d)).done) d = addDays(d, -1);
        while (getDayInfo(dateKey(d)).done) { current++; d = addDays(d, -1); }

        let longest = 0, run = 0;
        const first = getFirstDate();
        if (first) {
          const end = dateKey();
          for (let x = parseKey(first); dateKey(x) <= end; x = addDays(x, 1)) {
            run = getDayInfo(dateKey(x)).done ? run + 1 : 0;
            longest = Math.max(longest, run);
          }
        }
        return { current, longest: Math.max(longest, current) };
      },

      // Sync status getter (Google Sheets)
      getSyncStatus: () => getSyncStatus(),

      /* ── Planner / habits ── */
      setTasks: (ids, value) => {
        const d = today();
        set(state => {
          const updated = { ...(state.taskLogs[d] || {}) };
          ids.forEach(id => { updated[id] = value; });
          const taskLogs = { ...state.taskLogs, [d]: updated };
          const habitLogs = { ...state.habitLogs, [d]: deriveHabitLog(updated, state.plannerNotes[d]) };
          scheduleSync({ ...state, taskLogs, habitLogs });
          return { taskLogs, habitLogs };
        });
      },
      toggleTask: (taskId) => {
        const done = !!get().taskLogs[today()]?.[taskId];
        get().setTasks([taskId], !done);
      },
      /** Ticks/unticks the habit's whole planner group. Returns false for habits that can't be ticked directly. */
      toggleHabit: (habitId) => {
        const habit = HABITS.find(h => h.id === habitId);
        const ids = habit ? habitTaskIds(habit) : [];
        if (!ids.length) return false;
        const log = get().taskLogs[today()] || {};
        get().setTasks(ids, !ids.every(id => log[id]));
        return true;
      },
      setPlannerNote: (key, value) => {
        const d = today();
        set(state => {
          const notes = { ...(state.plannerNotes[d] || {}), [key]: value };
          return {
            plannerNotes: { ...state.plannerNotes, [d]: notes },
            habitLogs: { ...state.habitLogs, [d]: deriveHabitLog(state.taskLogs[d], notes) },
          };
        });
      },

      /* ── Journal ── */
      saveJournal: (data) => {
        const d = today();
        const entry = { ...data, date: d, savedAt: new Date().toISOString() };
        set(state => {
          const journals = { ...state.journals, [d]: entry };
          scheduleSync({ ...state, journals });
          return { journals };
        });
      },

      /* ── Settings ── */
      setDailyFocus: (focus) => set({ dailyFocus: focus }),
      updateLifeGoals: (goals) => set({ lifeGoals: goals }),
      updateMission: (ms) => set({ missionStatement: ms }),
      setUserName: (name) => set({ userName: name }),

      syncToSheets: () => syncNow(get()),

      /* ── Auth (checked in the app; see utils/auth.js) ── */
      initAuth: () => {
        const user = auth.currentUser();
        set({ auth: { status: user ? 'in' : 'out', user, error: null } });
      },
      loginWith: (username, password) => {
        const user = auth.login(username, password); // throws with a message on failure
        set({ auth: { status: 'in', user, error: null } });
      },
      /** Logging out only ends the session; your data stays on this device. */
      logoutUser: () => {
        auth.logout();
        set({ auth: { status: 'out', user: null, error: null } });
      },

      /* ── Backup: download / restore everything as a JSON file ── */
      exportBackup: () => {
        const s = get();
        return {
          app: 'ascend', version: 1, exportedAt: new Date().toISOString(),
          journals: s.journals, taskLogs: s.taskLogs, plannerNotes: s.plannerNotes, legacyHabitLogs: s.legacyHabitLogs,
          settings: Object.fromEntries(SETTING_KEYS.map(k => [k, s[k]])),
        };
      },
      /** Adds days from a backup that this device doesn't have yet (never overwrites). Returns days added. */
      importBackup: (backup) => {
        if (!backup || backup.app !== 'ascend') throw new Error('This is not an Ascend backup file.');
        const s = get();
        let added = 0;
        const merge = (current, incoming = {}) => {
          const out = { ...current };
          for (const [date, value] of Object.entries(incoming)) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(date) && value && !(date in out)) { out[date] = value; added++; }
          }
          return out;
        };
        const taskLogs = merge(s.taskLogs, backup.taskLogs);
        const plannerNotes = merge(s.plannerNotes, backup.plannerNotes);
        set({
          journals: merge(s.journals, backup.journals),
          taskLogs,
          plannerNotes,
          legacyHabitLogs: merge(s.legacyHabitLogs, backup.legacyHabitLogs),
          habitLogs: deriveAllHabits(taskLogs, plannerNotes),
          ...Object.fromEntries(SETTING_KEYS.filter(k => backup.settings?.[k] != null).map(k => [k, backup.settings[k]])),
        });
        return added;
      },

      // Helpers exported
      DEFAULT_HABITS,
      DEFAULT_TASKS,
      ACHIEVEMENTS,
      QUOTES,
    }),
    {
      name: 'ascend-storage',
      version: 2,
      // Everything is stored in this browser. Derived habits and auth state are rebuilt on load.
      partialize: (s) => ({
        ...Object.fromEntries(SETTING_KEYS.map(k => [k, s[k]])),
        journals: s.journals, taskLogs: s.taskLogs, plannerNotes: s.plannerNotes, legacyHabitLogs: s.legacyHabitLogs,
      }),
      migrate: (persisted, version) => {
        if (version < 2 && persisted) {
          // v1 tracked 15 standalone habits; keep them as history.
          const { habitLogs, ...rest } = persisted;
          return { ...rest, legacyHabitLogs: habitLogs || {} };
        }
        return persisted;
      },
      merge: (persisted, current) => {
        const s = { ...current, ...(persisted || {}) };
        return { ...s, habitLogs: deriveAllHabits(s.taskLogs, s.plannerNotes) };
      },
    }
  )
);

export { DEFAULT_HABITS, DEFAULT_TASKS, ACHIEVEMENTS, QUOTES };
