import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scheduleSync, syncNow, getSyncStatus } from '../utils/googleSheets';
import { DEFAULT_TASKS } from './routine';

const today = () => new Date().toISOString().split('T')[0];

const DEFAULT_HABITS = [
  { id: 'exercise',    icon: '🏃', label: 'Morning Exercise',     category: 'health' },
  { id: 'breakfast',   icon: '🥗', label: 'Healthy Breakfast',    category: 'health' },
  { id: 'cycling',     icon: '🚴', label: 'Cycling',              category: 'health' },
  { id: 'shake',       icon: '🥤', label: 'Healthy Shake',        category: 'health' },
  { id: 'sleep',       icon: '😴', label: 'Sleep by 10:15 PM',    category: 'health' },
  { id: 'no_porn',     icon: '🚫', label: 'No Porn',              category: 'discipline' },
  { id: 'no_reels',    icon: '📵', label: 'No Reels',             category: 'discipline' },
  { id: 'english',     icon: '🇬🇧', label: 'English Learning',    category: 'learning' },
  { id: 'german',      icon: '🇩🇪', label: 'German Lesson',       category: 'learning' },
  { id: 'tech',        icon: '💻', label: 'Technology Update',    category: 'learning' },
  { id: 'stocks',      icon: '📈', label: 'Stock Market',         category: 'learning' },
  { id: 'business',    icon: '💼', label: 'Business Knowledge',   category: 'learning' },
  { id: 'family',      icon: '👨‍👩‍👧', label: 'Family Time',      category: 'personal' },
  { id: 'music',       icon: '🎵', label: 'Music',                category: 'personal' },
  { id: 'journal',     icon: '📓', label: 'Journal',              category: 'personal' },
];



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

export const useStore = create(
  persist(
    (set, get) => ({
      // User
      userName: 'Krish',
      userAvatar: null,

      // Habits - keyed by date string
      habitLogs: {}, // { 'YYYY-MM-DD': { habitId: boolean } }

      // Tasks - keyed by date string
      taskLogs: {}, // { 'YYYY-MM-DD': { taskId: boolean } }

      // Planner text (Top 3, idea, review) - keyed by date string
      plannerNotes: {}, // { 'YYYY-MM-DD': { fieldKey: string | boolean } }

      // Journals - keyed by date string
      journals: {}, // { 'YYYY-MM-DD': journalObject }

      // Scores - keyed by date string
      scores: {}, // { 'YYYY-MM-DD': number }

      // Streak
      currentStreak: 0,
      longestStreak: 0,

      // Goals / Vision
      dailyFocus: 'Become 1% better today',
      lifeGoals: [
        'Build a successful business',
        'Achieve financial freedom',
        'Master German language',
        'Become physically elite',
        'Read 52 books a year',
      ],
      missionStatement: 'I am building a disciplined, healthy, and knowledgeable life through consistent daily actions.',

      // Getters
      getTodayHabits: () => {
        const state = get();
        const d = today();
        return state.habitLogs[d] || {};
      },
      getTodayTasks: () => {
        const state = get();
        const d = today();
        const overrides = state.taskLogs[d] || {};
        return DEFAULT_TASKS.map(t => ({ ...t, done: overrides[t.id] ?? t.done }));
      },
      getRecommendedTask: () => {
        const state = get();
        const d = today();
        const overrides = state.taskLogs[d] || {};
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
        if (state.scores[d] !== undefined) return state.scores[d];
        // Calculate from habits + tasks
        const habitLog = state.habitLogs[d] || {};
        const taskLog = state.taskLogs[d] || {};
        const habitDone = Object.values(habitLog).filter(Boolean).length;
        const taskDone = DEFAULT_TASKS.filter(t => taskLog[t.id]).length;
        const habitMax = DEFAULT_HABITS.length;
        const taskMax = DEFAULT_TASKS.length;
        return Math.round(((habitDone / habitMax) * 60 + (taskDone / taskMax) * 40));
      },
      getDailyQuote: () => {
        const idx = new Date().getDate() % QUOTES.length;
        return QUOTES[idx];
      },

      // Sync status getter
      getSyncStatus: () => getSyncStatus(),

      // Actions
      toggleHabit: (habitId) => {
        const d = today();
        set(state => {
          const prev = state.habitLogs[d] || {};
          const updated = { ...prev, [habitId]: !prev[habitId] };
          scheduleSync({ ...state, habitLogs: { ...state.habitLogs, [d]: updated } });
          return { habitLogs: { ...state.habitLogs, [d]: updated } };
        });
      },
      toggleTask: (taskId) => {
        const d = today();
        set(state => {
          const prev = state.taskLogs[d] || {};
          const updated = { ...prev, [taskId]: !prev[taskId] };
          scheduleSync({ ...state, taskLogs: { ...state.taskLogs, [d]: updated } });
          return { taskLogs: { ...state.taskLogs, [d]: updated } };
        });
      },
      setPlannerNote: (key, value) => {
        const d = today();
        set(state => ({
          plannerNotes: { ...state.plannerNotes, [d]: { ...(state.plannerNotes[d] || {}), [key]: value } },
        }));
      },
      saveJournal: (data) => {
        const d = today();
        set(state => {
          const newJournals = { ...state.journals, [d]: { ...data, date: d } };
          scheduleSync({ ...state, journals: newJournals });
          return { journals: newJournals };
        });
      },
      syncToSheets: () => {
        const state = get();
        return syncNow(state);
      },
      setDailyFocus: (focus) => set({ dailyFocus: focus }),
      updateLifeGoals: (goals) => set({ lifeGoals: goals }),
      updateMission: (ms) => set({ missionStatement: ms }),
      setUserName: (name) => set({ userName: name }),

      // Helpers exported
      DEFAULT_HABITS,
      DEFAULT_TASKS,
      ACHIEVEMENTS,
      QUOTES,
    }),
    {
      name: 'ascend-storage',
      version: 1,
    }
  )
);

export { DEFAULT_HABITS, DEFAULT_TASKS, ACHIEVEMENTS, QUOTES };
