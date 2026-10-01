import { DEFAULT_TASKS, HABITS } from '../store/routine';
import { dateKey } from './date';

/*
 * Google Sheets Sync Utility for Ascend
 *
 * SETUP:
 * 1. Deploy the Apps Script (see APPS_SCRIPT_CODE.js)
 * 2. Paste your Web App URL below
 * 3. That's it — data syncs automatically on every change
 */

const SHEETS_WEB_APP_URL = '';

let _syncQueue = [];
let isSyncing = false;
let lastSyncTime = null;
let syncStatus = 'idle'; // 'idle' | 'syncing' | 'success' | 'error'
let syncError = null;

function getSyncStatus() {
  return { status: syncStatus, lastSync: lastSyncTime, error: syncError };
}

async function sendToSheets(action, payload) {
  if (!SHEETS_WEB_APP_URL) {
    console.warn('[Ascend Sync] No Web App URL configured. Skipping sync.');
    return { success: false, reason: 'no_url' };
  }

  try {
    syncStatus = 'syncing';
    syncError = null;

    await fetch(SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });

    syncStatus = 'success';
    lastSyncTime = new Date().toISOString();
    return { success: true };
  } catch (err) {
    syncStatus = 'error';
    syncError = err.message;
    console.error('[Ascend Sync] Error:', err);
    return { success: false, error: err.message };
  }
}

function buildDailyPayload(state) {
  const d = dateKey();
  const habitLog = state.habitLogs[d] || {};
  const taskLog = state.taskLogs[d] || {};
  const journal = state.journals[d] || null;

  const habitsDone = HABITS.filter(h => habitLog[h.id]).length;
  const tasksDone = DEFAULT_TASKS.filter(t => taskLog[t.id]).length;

  // Compute streak
  let streak = 0;
  const checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const key = dateKey(checkDate);
    const hl = state.habitLogs[key] || {};
    const count = Object.values(hl).filter(Boolean).length;
    if (count >= Math.ceil(HABITS.length / 2)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  // Compute score
  const score = Math.round(((habitsDone / HABITS.length) * 60 + (tasksDone / DEFAULT_TASKS.length) * 40));

  return {
    date: d,
    score,
    habitsDone,
    habitsTotal: HABITS.length,
    habitsPct: Math.round((habitsDone / HABITS.length) * 100),
    tasksDone,
    tasksTotal: DEFAULT_TASKS.length,
    tasksPct: Math.round((tasksDone / DEFAULT_TASKS.length) * 100),
    streak,
    habits: habitLog,
    tasks: taskLog,
    journal,
  };
}

let syncTimer = null;

function scheduleSync(state) {
  if (!SHEETS_WEB_APP_URL) return;

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    performSync(state);
  }, 1500); // debounce: wait 1.5s after last change
}

async function performSync(state) {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const payload = buildDailyPayload(state);
    await sendToSheets('syncAll', payload);
  } finally {
    isSyncing = false;
  }
}

async function syncNow(state) {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const payload = buildDailyPayload(state);
    return await sendToSheets('syncAll', payload);
  } finally {
    isSyncing = false;
  }
}

export {
  SHEETS_WEB_APP_URL,
  getSyncStatus,
  syncNow,
  scheduleSync,
  buildDailyPayload,
};
