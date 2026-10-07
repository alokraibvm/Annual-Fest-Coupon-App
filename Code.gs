/**
 * Annual Fest 2026 coupon collection app
 * Bind this Apps Script project to the school's Google Sheet. The sheet is
 * then selected with getActiveSpreadsheet(), so no spreadsheet ID is needed.
 */

// -------------------- Configuration --------------------
const SCHOOL_NAME = 'Bal Vidya Mandir Sr. Sec. School, Sambhal';
const FEST_NAME = 'Annual Fest 2026';
const ENTRIES_SHEET_NAME = 'Entries';
const HEADERS = ['Timestamp', 'Society Name', 'Category', 'Coupon'];
const CATEGORIES = ['Junior', 'Senior'];
const COUPON_VALUES = [20, 50];
// Edit this list to change the societies shown in the entry form and dashboard.
const SOCIETIES = [
  'TINKER VERSE', 'TECH-TITANS', 'ECO WARRIORS', 'RECYCLERS', 'STAGE CRAFT',
  'INK MASTERS', 'PAPER CRAFTERS', 'COOL COOKS', 'EUREKA',
  'NUMBER NAVIGATORS', 'FIT LIFE', 'SYMPHONY', 'ARTISAN NEST'
];

function doGet() {
  const template = HtmlService.createTemplateFromFile('index');
  template.societies = SOCIETIES;
  template.schoolName = SCHOOL_NAME;
  template.festName = FEST_NAME;
  return template.evaluate()
    .setTitle(FEST_NAME + ' | Coupon Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Create the Entries sheet and headers if needed. Safe to run more than once. */
function setupSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from the Google Sheet, then run setupSpreadsheet().');
  let sheet = spreadsheet.getSheetByName(ENTRIES_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(ENTRIES_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const matches = HEADERS.every((header, i) => String(existing[i]).trim() === header);
    if (!matches) throw new Error('The Entries sheet has different headers. Please restore: ' + HEADERS.join(' | '));
  }
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('dd-MM-yyyy HH:mm');
  sheet.getRange('D:D').setNumberFormat('0');
  sheet.autoResizeColumns(1, HEADERS.length);
  return 'Entries sheet is ready.';
}

/** Save one coupon row. Duplicates are intentional: every call is one coupon. */
function saveEntry(entry) {
  try {
    if (!entry || typeof entry !== 'object') throw new Error('Missing entry.');
    const society = String(entry.society || '').trim();
    const category = String(entry.category || '').trim();
    const coupon = Number(entry.coupon);
    if (SOCIETIES.indexOf(society) === -1) throw new Error('Invalid society.');
    if (CATEGORIES.indexOf(category) === -1) throw new Error('Invalid category.');
    if (COUPON_VALUES.indexOf(coupon) === -1) throw new Error('Invalid coupon value.');

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const sheet = getEntriesSheet_();
      sheet.appendRow([new Date(), society, category, coupon]);
    } finally {
      lock.releaseLock();
    }
    return { success: true };
  } catch (error) {
    Logger.log('saveEntry failed: ' + (error && error.stack ? error.stack : error));
    throw new Error('Unable to save entry. Please try again.');
  }
}

/** Return aggregate dashboard data only; individual entry rows stay server-side. */
function getDashboardData() {
  try {
    const sheet = getEntriesSheet_();
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues() : [];
    const result = calculateStatistics_(rows);
    result.generatedAt = new Date().toISOString();
    return result;
  } catch (error) {
    Logger.log('getDashboardData failed: ' + (error && error.stack ? error.stack : error));
    throw new Error('Unable to load dashboard data. Please refresh and try again.');
  }
}

function getEntriesSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('No active spreadsheet. Bind the script to the school spreadsheet.');
  let sheet = spreadsheet.getSheetByName(ENTRIES_SHEET_NAME);
  if (!sheet) {
    setupSpreadsheet();
    sheet = spreadsheet.getSheetByName(ENTRIES_SHEET_NAME);
  }
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (!HEADERS.every((header, i) => String(headers[i]).trim() === header)) {
    throw new Error('Entries sheet headers do not match the required format.');
  }
  return sheet;
}

function calculateStatistics_(rows) {
  const societies = {};
  SOCIETIES.forEach(name => {
    societies[name] = {
      society: name,
      junior20Count: 0, junior50Count: 0, juniorCount: 0, juniorTotal: 0,
      senior20Count: 0, senior50Count: 0, seniorCount: 0, seniorTotal: 0,
      junior20Total: 0, junior50Total: 0, senior20Total: 0, senior50Total: 0,
      overallTotal: 0, couponCount: 0
    };
  });
  const stats = {
    coupon20: { count: 0, total: 0 }, coupon50: { count: 0, total: 0 },
    grandTotal: { count: 0, total: 0 },
    categories: {
      Junior: { count: 0, total: 0 },
      Senior: { count: 0, total: 0 }
    }
  };

  rows.forEach(row => {
    const society = String(row[1] || '').trim();
    const category = String(row[2] || '').trim();
    const coupon = Number(row[3]);
    const item = societies[society];
    if (!item || CATEGORIES.indexOf(category) === -1 || COUPON_VALUES.indexOf(coupon) === -1) return;
    const bucket = category.toLowerCase();
    const countKey = bucket + 'Count';
    const totalKey = bucket + 'Total';
    const valueKey = bucket + coupon + 'Total';
    const couponCountKey = bucket + coupon + 'Count';
    item[countKey] += 1;
    item[totalKey] += coupon;
    item[valueKey] += coupon;
    item[couponCountKey] += 1;
    item.overallTotal += coupon;
    item.couponCount += 1;
    stats['coupon' + coupon].count += 1;
    stats['coupon' + coupon].total += coupon;
    stats.grandTotal.count += 1;
    stats.grandTotal.total += coupon;
    stats.categories[category].count += 1;
    stats.categories[category].total += coupon;
  });

  const societyRows = Object.keys(societies).map(name => societies[name]);
  societyRows.sort((a, b) => b.overallTotal - a.overallTotal || a.society.localeCompare(b.society));
  return {
    schoolName: SCHOOL_NAME,
    festName: FEST_NAME,
    societies: societyRows,
    winner: calculateWinner_(societyRows, 'overallTotal'),
    juniorLeader: calculateWinner_(societyRows, 'juniorTotal'),
    seniorLeader: calculateWinner_(societyRows, 'seniorTotal'),
    stats: stats
  };
}

/** Return all tied leaders. An empty collection has no winner. */
function calculateWinner_(societies, field) {
  const max = societies.reduce((highest, item) => Math.max(highest, item[field]), 0);
  return {
    total: max,
    societies: max === 0 ? [] : societies.filter(item => item[field] === max).map(item => item.society)
  };
}
