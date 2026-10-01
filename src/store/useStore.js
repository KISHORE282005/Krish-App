import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scheduleSync, syncNow, getSyncStatus } from '../utils/googleSheets';
import {
  DEFAULT_TASKS, HABITS, habitTaskIds, deriveHabitLog, DAY_DONE_RATIO, LEGACY_HABIT_COUNT,
} from './routine';
import * as api from '../utils/api';
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

const HABITS_NEEDED = Math.ceil(HABITS.length * DAY_DONE_RATIO);
const LEGACY_NEEDED = Math.ceil(LEGACY_HABIT_COUNT * DAY_DONE_RATIO);

// Debounced saves for fields typed character-by-character.
const noteTimers = {};
const debounce = (key, fn, ms = 600) => { clearTimeout(noteTimers[key]); noteTimers[key] = setTimeout(fn, ms); };

export const useStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      ...EMPTY_DATA,
      userAvatar: null,

      // Auth (not persisted): 'checking' | 'out' | 'in' | 'offline'
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
      getTodayScore: () => {
        const state = get();
        const d = today();
        const habitDone = HABITS.filter(h => state.habitLogs[d]?.[h.id]).length;
        const taskDone = DEFAULT_TASKS.filter(t => state.taskLogs[d]?.[t.id]).length;
        return Math.round((habitDone / HABITS.length) * 60 + (taskDone / DEFAULT_TASKS.length) * 40);
      },
      getDailyQuote: () => QUOTES[new Date().getDate() % QUOTES.length],

      /** Everything the streak calendar needs about one day. */
      getDayInfo: (key) => {
        const s = get();
        const habitsDone = HABITS.filter(h => s.habitLogs[key]?.[h.id]).length;
        const tasksDone = DEFAULT_TASKS.filter(t => s.taskLogs[key]?.[t.id]).length;
        const legacyDone = Object.values(s.legacyHabitLogs[key] || {}).filter(Boolean).length;
        return {
          habitsDone, habitsTotal: HABITS.length,
          tasksDone, tasksTotal: DEFAULT_TASKS.length,
          legacyDone,
          journal: !!s.journals[key],
          done: habitsDone >= HABITS_NEEDED || legacyDone >= LEGACY_NEEDED,
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
          api.saveEntry('tasks', d, updated);
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
          debounce(`notes|${d}`, () => api.saveEntry('notes', d, get().plannerNotes[d]));
          return {
            plannerNotes: { ...state.plannerNotes, [d]: notes },
            habitLogs: { ...state.habitLogs, [d]: deriveHabitLog(state.taskLogs[d], notes) },
          };
        });
      },

      /* ── Journal: resolves true once it is in the database, false if queued for retry ── */
      saveJournal: (data) => {
        const d = today();
        const entry = { ...data, date: d, savedAt: new Date().toISOString() };
        set(state => {
          const journals = { ...state.journals, [d]: entry };
          scheduleSync({ ...state, journals });
          return { journals };
        });
        return api.saveEntry('journal', d, entry);
      },

      /* ── Settings ── */
      setDailyFocus: (focus) => { set({ dailyFocus: focus }); api.saveSetting('dailyFocus', focus); },
      updateLifeGoals: (goals) => { set({ lifeGoals: goals }); api.saveSetting('lifeGoals', goals); },
      updateMission: (ms) => { set({ missionStatement: ms }); api.saveSetting('missionStatement', ms); },
      setUserName: (name) => { set({ userName: name }); api.saveSetting('userName', name); },

      syncToSheets: () => syncNow(get()),

      /* ── Auth + database ── */
      initAuth: async () => {
        api.setUnauthorizedHandler(() => set({ auth: { status: 'out', user: null, error: 'Session expired. Please log in again.' } }));
        if (!api.getToken()) return set({ auth: { status: 'out', user: null, error: null } });
        set({ auth: { ...get().auth, status: 'checking', error: null } });
        try {
          const user = await api.me();
          await get().loadFromServer();
          set({ auth: { status: 'in', user, error: null } });
        } catch (err) {
          if (err.status === 401) return; // handler already switched to 'out'
          set({ auth: { status: 'offline', user: null, error: err.message } });
        }
      },

      loginWith: async (username, password) => {
        const user = await api.login(username, password);
        await get().pushLocalData();
        await get().loadFromServer();
        set({ auth: { status: 'in', user, error: null } });
      },

      logoutUser: async () => {
        await api.logout();
        set({ ...DEFAULT_SETTINGS, ...EMPTY_DATA, auth: { status: 'out', user: null, error: null } });
      },

      /** Copies data held only in this browser into the database (never overwrites). */
      pushLocalData: async () => {
        const s = get();
        const nonEmpty = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v && Object.keys(v).length));
        await api.importData({
          entries: {
            journal: s.journals,
            tasks: nonEmpty(s.taskLogs),
            notes: nonEmpty(s.plannerNotes),
            habits_legacy: nonEmpty(s.legacyHabitLogs),
          },
          settings: Object.fromEntries(SETTING_KEYS.map(k => [k, s[k]])),
        });
      },

      loadFromServer: async () => {
        await api.flush(); // send queued edits first so they aren't overwritten
        const { entries, settings } = await api.fetchAll();
        const taskLogs = entries.tasks || {};
        const plannerNotes = entries.notes || {};
        set({
          ...DEFAULT_SETTINGS,
          ...Object.fromEntries(SETTING_KEYS.filter(k => k in settings).map(k => [k, settings[k]])),
          journals: entries.journal || {},
          taskLogs,
          plannerNotes,
          legacyHabitLogs: entries.habits_legacy || {},
          habitLogs: deriveAllHabits(taskLogs, plannerNotes),
        });
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
      // Offline cache of the database. Derived habits and auth state are rebuilt on load.
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
