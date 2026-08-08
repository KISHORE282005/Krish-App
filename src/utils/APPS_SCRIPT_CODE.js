/*
 * =====================================================
 * ASCEND - Google Apps Script for Google Sheets Sync
 * =====================================================
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Create a new Google Sheet (or use an existing one)
 *    - Name it something like "Ascend Daily Tracker"
 *
 * 2. Open the sheet → Extensions → Apps Script
 *
 * 3. Delete any existing code and paste this entire file
 *
 * 4. Click Deploy → New Deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy
 *
 * 5. Copy the Web App URL and paste it into your app's
 *    src/utils/googleSheets.js → SHEETS_WEB_APP_URL
 *
 * 6. Go back to your Google Sheet — you'll see 4 tabs:
 *    - Daily Summary
 *    - Habit Log
 *    - Task Log
 *    - Journal
 *
 * =====================================================
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'syncDaily') {
      return syncDailyData(data.payload);
    }
    if (action === 'syncJournal') {
      return syncJournalData(data.payload);
    }
    if (action === 'syncAll') {
      return syncAllData(data.payload);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'Ascend API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function findOrCreateRow(sheet, dateCol, dateValue) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][dateCol]) === String(dateValue)) {
      return i + 1; // 1-indexed row number
    }
  }
  return -1; // not found
}

/* ========== DAILY SUMMARY SHEET ========== */
function syncDailyData(p) {
  const sheet = getOrCreateSheet('Daily Summary');

  // Headers
  const headers = [
    'Date', 'Score', 'Habits Done', 'Habits Total', 'Habits %',
    'Tasks Done', 'Tasks Total', 'Tasks %',
    'Current Streak', 'Mood', 'Energy', 'Rating',
    'Last Updated'
  ];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#D4AF37');
    sheet.setColumnWidths(1, headers.length, 130);
  }

  const row = findOrCreateRow(sheet, 0, p.date);
  const rowData = [
    p.date,
    p.score,
    p.habitsDone,
    p.habitsTotal,
    p.habitsPct + '%',
    p.tasksDone,
    p.tasksTotal,
    p.tasksPct + '%',
    p.streak,
    p.mood || '',
    p.energy || '',
    p.rating || '',
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Color-code score cell
  if (row > 0 || sheet.getLastRow() > 1) {
    const targetRow = row > 0 ? row : sheet.getLastRow();
    const scoreCell = sheet.getRange(targetRow, 2);
    if (p.score >= 80) scoreCell.setBackground('#065f46').setFontColor('#34d399');
    else if (p.score >= 60) scoreCell.setBackground('#713f12').setFontColor('#fbbf24');
    else if (p.score >= 40) scoreCell.setBackground('#7c2d12').setFontColor('#fb923c');
    else scoreCell.setBackground('#7f1d1d').setFontColor('#f87171');
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, sheet: 'Daily Summary' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========== HABIT LOG SHEET ========== */
function syncHabitLog(p) {
  const sheet = getOrCreateSheet('Habit Log');

  const habitLabels = [
    'Exercise', 'Breakfast', 'Cycling', 'Shake', 'Sleep',
    'No Porn', 'No Reels', 'English', 'German', 'Tech',
    'Stocks', 'Business', 'Family', 'Music', 'Journal'
  ];
  const habitIds = [
    'exercise', 'breakfast', 'cycling', 'shake', 'sleep',
    'no_porn', 'no_reels', 'english', 'german', 'tech',
    'stocks', 'business', 'family', 'music', 'journal'
  ];

  const headers = ['Date', ...habitLabels, 'Total Done', '%', 'Last Updated'];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#D4AF37');
    sheet.setColumnWidths(1, headers.length, 100);
  }

  const row = findOrCreateRow(sheet, 0, p.date);
  const doneCount = Object.values(p.habits).filter(Boolean).length;
  const pct = Math.round((doneCount / 15) * 100);

  const rowData = [
    p.date,
    ...habitIds.map(id => p.habits[id] ? 'YES' : 'NO'),
    doneCount,
    pct + '%',
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Color individual habit cells
  const targetRow = row > 0 ? row : sheet.getLastRow();
  habitIds.forEach((id, i) => {
    const cell = sheet.getRange(targetRow, i + 2);
    if (p.habits[id]) {
      cell.setBackground('#065f46').setFontColor('#34d399');
    } else {
      cell.setBackground('#1f1f2e').setFontColor('#6b7280');
    }
  });

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, sheet: 'Habit Log' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========== TASK LOG SHEET ========== */
function syncTaskLog(p) {
  const sheet = getOrCreateSheet('Task Log');

  const taskLabels = [
    'Exercise', 'Learning', 'English Words', 'Bath & Groom', 'Deep Work',
    'Healthy Shake', 'Lunch', 'Work/Studies', 'Cycling', 'German',
    'Stocks', 'Tech News', 'Family', 'Night Journal'
  ];
  const taskIds = [
    't1', 't2', 't4', 't5', 't6',
    't7', 't8', 't9', 't10', 't11',
    't12', 't13', 't14', 't15'
  ];

  const headers = ['Date', ...taskLabels, 'Total Done', '%', 'Last Updated'];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#D4AF37');
    sheet.setColumnWidths(1, headers.length, 110);
  }

  const row = findOrCreateRow(sheet, 0, p.date);
  const doneCount = Object.values(p.tasks).filter(Boolean).length;
  const pct = Math.round((doneCount / 14) * 100);

  const rowData = [
    p.date,
    ...taskIds.map(id => p.tasks[id] ? 'DONE' : 'PENDING'),
    doneCount,
    pct + '%',
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  const targetRow = row > 0 ? row : sheet.getLastRow();
  taskIds.forEach((id, i) => {
    const cell = sheet.getRange(targetRow, i + 2);
    if (p.tasks[id]) {
      cell.setBackground('#065f46').setFontColor('#34d399');
    } else {
      cell.setBackground('#1f1f2e').setFontColor('#6b7280');
    }
  });

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, sheet: 'Task Log' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========== JOURNAL SHEET ========== */
function syncJournalData(p) {
  const sheet = getOrCreateSheet('Journal');

  const headers = [
    'Date', 'Mood', 'Mood Label', 'Energy', 'Rating',
    'Achievement', 'Mistake', 'Learning', 'Gratitude', 'Tomorrow Goal',
    'Score', 'Habits Done', 'Tasks Done',
    'Last Updated'
  ];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#D4AF37');
    sheet.setColumnWidths(1, headers.length, 160);
  }

  const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Happy', 'Great', 'Excellent'];

  const row = findOrCreateRow(sheet, 0, p.date);
  const rowData = [
    p.date,
    (p.mood || 0) + 1,
    moodLabels[p.mood] || 'Unknown',
    p.energy || '',
    p.rating || '',
    p.achievement || '',
    p.mistake || '',
    p.learning || '',
    p.gratitude || '',
    p.tomorrow || '',
    p.score || 0,
    p.habitsDone || 0,
    p.tasksDone || 0,
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, sheet: 'Journal' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========== SYNC ALL ========== */
function syncAllData(p) {
  syncDailyData(p);
  syncHabitLog(p);
  syncTaskLog(p);
  if (p.journal) {
    syncJournalData({
      date: p.date,
      ...p.journal,
      score: p.score,
      habitsDone: p.habitsDone,
      tasksDone: p.tasksDone
    });
  }
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'All sheets synced' }))
    .setMimeType(ContentService.MimeType.JSON);
}
