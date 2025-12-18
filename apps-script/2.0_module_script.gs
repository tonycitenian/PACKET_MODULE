// Packet Module — Server-side Apps Script (v2.1 MERGED)
// Uses getActiveSpreadsheet() for bound scripts
// Simplified GET endpoints (getNames, getTime only)

/**
 * Convert column letters to index (A=1)
 */
function letterToColumn(letter) {
  if (!letter || typeof letter !== 'string') return 0;
  letter = letter.toUpperCase().trim();
  let col = 0;
  for (let i = 0; i < letter.length; i++) {
    col = col * 26 + (letter.charCodeAt(i) - 64);
  }
  return col;
}

/**
 * Convert column index to letter (1 -> A)
 */
function columnToLetter(index) {
  if (!index || index < 1) return '';
  let col = '';
  while (index > 0) {
    const rem = (index - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    index = Math.floor((index - 1) / 26);
  }
  return col;
}

/**
 * doGet - API endpoint for GET requests
 * Supports: getNames, getTime
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  const group = (e && e.parameter && e.parameter.group) ? e.parameter.group : '';
  try {
    let result;
    switch (action) {
      case 'getNames':
        result = getNamesList(group);
        break;
      case 'getTime':
        result = getPhilippinesTime();
        break;
      default:
        result = { error: 'Invalid action. Use ?action=getNames or ?action=getTime' };
    }
    const output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    const output = ContentService.createTextOutput(JSON.stringify({ error: err.toString() }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

/**
 * doPost - API endpoint for POST requests
 * Supports: getUserData, updateActivity
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents || '{}');
    const action = params.action;
    const group = params.group || '';
    let result;
    switch (action) {
      case 'getUserData':
        result = getUserData(params.name, params.password, group);
        break;
      case 'updateActivity':
        result = updateActivityStatus(params.row, params.colLetter, params.newValue, params.inputText, group);
        break;
      default:
        result = { error: 'Invalid action' };
    }
    const output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    const output = ContentService.createTextOutput(JSON.stringify({ error: err.toString() }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

// Helper to pad single digits with leading zero (only used for date/time)
function pad(n) {
  return n < 10 ? '0' + n : n;
}

/**
 * Authoritative Philippines time via timeapi.io
 */
function getPhilippinesTime() {
  try {
    const url = 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila';
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    return { success: true, data: data };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Get list of student names from MODULE_PROGRESS sheet
 * NOTE: Students start from row 4 (row 2 = module labels, row 3 = activity labels)
 * @param {string} group - Group prefix (e.g., '293', '370', 'SSP')
 */
function getNamesList(group) {
  try {
    if (!group) {
      return { error: 'Group parameter is required' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = group + '_MODULE_PROGRESS';
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      Logger.log('Sheet ' + sheetName + ' not found');
      return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 4) return []; // Need at least row 4 (first student row)

    // Start from row 4 (skip rows 2-3 which are label rows)
    const names = sheet.getRange(4, 2, lastRow - 3, 1).getValues();
    const out = [];

    for (let i = 0; i < names.length; i++) {
      const raw = names[i][0];
      const name = raw === null || raw === undefined ? '' : String(raw).trim();
      if (name !== '') {
        out.push({ name: name, row: i + 4 }); // Actual row is i + 4
      }
    }
    return out;
  } catch (e) {
    Logger.log('getNamesList error: ' + e.toString());
    return [];
  }
}

/**
 * Get user data with authentication
 * Returns: { success, name, row, modules: [{module, activities: [...] }] }
 * Reads from 3 sheets: MODULE_PROGRESS (status), SUBMISSION (input), TIMESTAMP (datetime)
 * Labels: Row 2 = Module labels, Row 3 = Activity labels
 * @param {string} name - Student name
 * @param {string} password - Student password
 * @param {string} group - Group prefix (e.g., '293', '370', 'SSP')
 */
function getUserData(name, password, group) {
  try {
    if (!name || !password) {
      return { success: false, message: 'Name and password required' };
    }

    if (!group) {
      return { success: false, message: 'Group parameter is required' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const progressSheet = ss.getSheetByName(group + '_MODULE_PROGRESS');
    const submissionSheet = ss.getSheetByName(group + '_SUBMISSION');
    const timestampSheet = ss.getSheetByName(group + '_TIMESTAMP');

    if (!progressSheet || !submissionSheet || !timestampSheet) {
      return { success: false, message: 'Required sheet(s) not found for group: ' + group };
    }

    const lastRow = progressSheet.getLastRow();
    if (lastRow < 4) { // Need at least row 4 (first student row)
      return { success: false, message: 'No data available' };
    }

    const MODULE_COLUMNS = generateModuleColumns(140); // D..EM
    const totalValueCols = MODULE_COLUMNS.length;
    const startCol = 4; // Column D

    // Read module labels from Row 2 and activity labels from Row 3
    const moduleLabelsRow = progressSheet.getRange(2, startCol, 1, totalValueCols).getValues()[0];
    const activityLabelsRow = progressSheet.getRange(3, startCol, 1, totalValueCols).getValues()[0];

    // Authenticate user (from MODULE_PROGRESS sheet, starting from row 4)
    const nameVals = progressSheet.getRange(4, 2, lastRow - 3, 1).getValues();
    const passVals = progressSheet.getRange(4, 3, lastRow - 3, 1).getValues();
    
    let matchedRow = -1;
    for (let i = 0; i < nameVals.length; i++) {
      const n = nameVals[i][0];
      const p = passVals[i][0];
      if ((n !== null && String(n) === String(name)) && 
          (p !== null && String(p) === String(password))) {
        matchedRow = i + 4; // Actual row is i + 4
        break;
      }
    }
    
    if (matchedRow === -1) {
      return { success: false, message: 'Invalid name or password' };
    }

    // Read data from the 3 sheets for matched user row
    const progressLastCol = progressSheet.getLastColumn();
    const submissionLastCol = submissionSheet.getLastColumn();
    const timestampLastCol = timestampSheet.getLastColumn();

    // Read status values from MODULE_PROGRESS (columns D-EM)
    let valuesRow = [];
    if (progressLastCol >= startCol) {
      const readWidth = Math.min(totalValueCols, Math.max(0, progressLastCol - (startCol - 1)));
      if (readWidth > 0) {
        valuesRow = progressSheet.getRange(matchedRow, startCol, 1, readWidth).getValues()[0];
      }
    }

    // Read input text from SUBMISSION sheet (columns D-EM)
    let inputTextsRow = [];
    if (submissionLastCol >= startCol) {
      const readWidthInput = Math.min(totalValueCols, Math.max(0, submissionLastCol - (startCol - 1)));
      if (readWidthInput > 0) {
        inputTextsRow = submissionSheet.getRange(matchedRow, startCol, 1, readWidthInput).getValues()[0];
      }
    }

    // Read timestamps from TIMESTAMP sheet (columns D-EM)
    let timestampsRow = [];
    if (timestampLastCol >= startCol) {
      const readWidthTs = Math.min(totalValueCols, Math.max(0, timestampLastCol - (startCol - 1)));
      if (readWidthTs > 0) {
        timestampsRow = timestampSheet.getRange(matchedRow, startCol, 1, readWidthTs).getValues()[0];
      }
    }

    // Read lock columns from MODULE_PROGRESS (after the 140 status columns)
    const lockStart = startCol + totalValueCols;
    let locksRow = [];
    if (progressLastCol >= lockStart) {
      const readWidthLock = Math.min(totalValueCols, Math.max(0, progressLastCol - (lockStart - 1)));
      if (readWidthLock > 0) {
        locksRow = progressSheet.getRange(matchedRow, lockStart, 1, readWidthLock).getValues()[0];
      }
    }

    // Build modules dynamically from sheet labels
    const modules = [];
    const moduleMap = {}; // Map to group activities by module

    for (let idx = 0; idx < totalValueCols; idx++) {
      const colLetter = MODULE_COLUMNS[idx];
      const moduleLabel = (idx < moduleLabelsRow.length) ? String(moduleLabelsRow[idx] || '').trim() : '';
      const activityLabel = (idx < activityLabelsRow.length) ? String(activityLabelsRow[idx] || '').trim() : '';

      // Skip if no labels
      if (moduleLabel === '' && activityLabel === '') continue;

      // Get activity data
      const rawVal = (idx < valuesRow.length) ? valuesRow[idx] : '';
      const rawInput = (idx < inputTextsRow.length) ? inputTextsRow[idx] : '';
      const rawTs = (idx < timestampsRow.length) ? timestampsRow[idx] : '';
      const rawLock = (idx < locksRow.length) ? locksRow[idx] : '';
      const rawValueStr = (rawVal === null || rawVal === undefined) ? '' : String(rawVal);
      const rawInputStr = (rawInput === null || rawInput === undefined) ? '' : String(rawInput);
      const rawTsStr = (rawTs === null || rawTs === undefined) ? '' : String(rawTs);
      const rawLockStr = (rawLock === null || rawLock === undefined) ? '' : String(rawLock);

      // Determine status
      let status = '';
      if (rawLockStr.trim() !== '') {
        status = 'LOCKED';
      } else {
        const up = rawValueStr.trim().toUpperCase();
        if (up === 'DONE') status = 'COMPLETED';
        else if (up === '0') status = 'MISSING';
        else if (up === 'LOCKED') status = 'LOCKED';
        else if (up === 'EMPTY' || up === '') status = 'NOT APPLICABLE';
        else if (up === 'PENDING') status = 'PENDING';
        else status = rawValueStr.trim();
      }

      // Create activity object
      const activityObj = {
        name: activityLabel || 'Activity ' + (idx + 1),
        col: colLetter,
        rawValue: rawValueStr,
        inputText: rawInputStr,
        rawTimestamp: rawTsStr,
        rawLock: rawLockStr,
        status: status
      };

      // Group by module
      if (!moduleMap[moduleLabel]) {
        moduleMap[moduleLabel] = {
          module: moduleLabel,
          activities: []
        };
      }
      moduleMap[moduleLabel].activities.push(activityObj);
    }

    // Convert module map to array
    for (let moduleName in moduleMap) {
      modules.push(moduleMap[moduleName]);
    }

    return {
      success: true,
      name: String(name),
      row: matchedRow,
      modules: modules
    };
    
  } catch (e) {
    Logger.log('getUserData error: ' + e.toString());
    return { success: false, message: 'Server error: ' + e.toString() };
  }
}

/**
 * Update activity status and optionally save input text.
 * Signature: updateActivityStatus(row, colLetter, newValue, inputText, group)
 *
 * Writes to 3 sheets:
 * - MODULE_PROGRESS: status value
 * - SUBMISSION: input text
 * - TIMESTAMP: date/time (using timeapi.io Asia/Manila)
 * @param {string} group - Group prefix (e.g., '293', '370', 'SSP')
 */
function updateActivityStatus(row, colLetter, newValue, inputText, group) {
  try {
    row = Number(row);
    if (!row || row < 4) { // Must be at least row 4 (first student row)
      return { success: false, message: 'Invalid row' };
    }

    if (!group) {
      return { success: false, message: 'Group parameter is required' };
    }

    const MODULE_COLUMNS = generateModuleColumns(140);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const progressSheet = ss.getSheetByName(group + '_MODULE_PROGRESS');
    const submissionSheet = ss.getSheetByName(group + '_SUBMISSION');
    const timestampSheet = ss.getSheetByName(group + '_TIMESTAMP');

    if (!progressSheet || !submissionSheet || !timestampSheet) {
      return { success: false, message: 'Required sheet(s) not found for group: ' + group };
    }

    const totalValueCols = MODULE_COLUMNS.length;
    const idx = MODULE_COLUMNS.indexOf(String(colLetter || '').toUpperCase());
    
    if (idx === -1) {
      return { success: false, message: 'Invalid column' };
    }

    const valueCol = letterToColumn(MODULE_COLUMNS[idx]);
    const lockCol = valueCol + totalValueCols;  // Lock columns are after status columns
    const progressLastCol = progressSheet.getLastColumn();

    // Check if locked (from MODULE_PROGRESS sheet)
    if (progressLastCol >= lockCol) {
      const lockVal = progressSheet.getRange(row, lockCol).getValue();
      const locked = !(lockVal === null || lockVal === undefined || String(lockVal).trim() === '');
      if (locked) {
        return { success: false, message: 'Activity is locked and cannot be updated' };
      }
    }

    // Write status to MODULE_PROGRESS (columns D-EM)
    progressSheet.getRange(row, valueCol).setValue(newValue);

    // Write input text to SUBMISSION sheet (same column D-EM)
    if (typeof inputText !== 'undefined') {
      submissionSheet.getRange(row, valueCol).setValue(inputText);
    }

    // ---------- Timestamp (using timeapi.io) ----------
    try {
      const url = 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila';
      const response = UrlFetchApp.fetch(url);
      const data = JSON.parse(response.getContentText());

      // Build correct date string WITH TIME ZONE OFFSET
      const dateTimeString = `${data.year}-${pad(data.month)}-${pad(data.day)}T${pad(data.hour)}:${pad(data.minute)}:${pad(data.seconds)}+08:00`;
      const date = new Date(dateTimeString);

      // Force format in PH time zone
      const formatted = Utilities.formatDate(date, 'Asia/Manila', 'MMMM d, yyyy hh:mm:ss a');

      // Write to TIMESTAMP sheet (same column D-EM)
      timestampSheet.getRange(row, valueCol).setValue(formatted);

      return { success: true, timestamp: formatted };
    } catch (e) {
      // Fallback to spreadsheet timezone if API call fails
      const now = new Date();
      const tz = ss.getSpreadsheetTimeZone() || 'GMT';
      const fallback = Utilities.formatDate(now, tz, 'MMMM d, yyyy hh:mm:ss a');
      timestampSheet.getRange(row, valueCol).setValue(fallback);
      return { success: true, timestamp: fallback, warning: 'API failed: ' + e.toString() };
    }
    
  } catch (e) {
    Logger.log('updateActivityStatus error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

/**
 * Utility to generate MODULE_COLUMNS starting at D for given count
 */
function generateModuleColumns(count) {
  const cols = [];
  let colIndex = 4; // D
  for (let i = 0; i < count; i++) {
    cols.push(columnToLetter(colIndex + i));
  }
  return cols;
}

/**
 * ========================================
 * LABEL WRITER FUNCTIONS
 * ========================================
 */

/**
 * Write labels for columns D-Z (first 23 columns)
 */
function writeLabelsToSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('MODULE_PROGRESS');
    
    if (!sheet) {
      Logger.log('❌ Sheet MODULE_PROGRESS not found');
      return { success: false, message: 'Sheet not found' };
    }
    
    const ACTIVITY_TEMPLATE = [
      'SOC 1', 'SOC 2', 'PRACTICE 1', 'PRACTICE 2', 'PRACTICE 3',
      'PRACTICE 4', 'PRACTICE 5', 'REFLECTION', 'WRAP-UP', 'ASSESSMENT'
    ];
    
    const startCol = 4; // Column D
    const numCols = 23; // D to Z
    
    const moduleLabels = [];
    const activityLabels = [];
    
    // Generate labels for columns
    for (let i = 0; i < numCols; i++) {
      const moduleIndex = Math.floor(i / ACTIVITY_TEMPLATE.length);
      const activityIndex = i % ACTIVITY_TEMPLATE.length;
      
      moduleLabels.push('Module ' + (moduleIndex + 1));
      activityLabels.push(ACTIVITY_TEMPLATE[activityIndex]);
    }
    
    // Write to row 2 (module labels)
    sheet.getRange(2, startCol, 1, numCols).setValues([moduleLabels]);
    
    // Write to row 3 (activity labels)
    sheet.getRange(3, startCol, 1, numCols).setValues([activityLabels]);
    
    Logger.log('✅ Labels written successfully to rows 2 and 3 (columns D-Z)');
    return { success: true, message: 'Labels written successfully' };
    
  } catch (e) {
    Logger.log('❌ writeLabelsToSheet error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

/**
 * Write ALL labels for columns D-EM (140 columns = 14 modules × 10 activities)
 */
function writeAllLabelsToSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('MODULE_PROGRESS');
    
    if (!sheet) {
      Logger.log('❌ Sheet MODULE_PROGRESS not found');
      return { success: false, message: 'Sheet not found' };
    }
    
    const ACTIVITY_TEMPLATE = [
      'SOC 1', 'SOC 2', 'PRACTICE 1', 'PRACTICE 2', 'PRACTICE 3',
      'PRACTICE 4', 'PRACTICE 5', 'REFLECTION', 'WRAP-UP', 'ASSESSMENT'
    ];
    
    const startCol = 4; // Column D
    const numCols = 140; // D to EM (14 modules × 10 activities)
    
    const moduleLabels = [];
    const activityLabels = [];
    
    // Generate labels for all 140 columns
    for (let i = 0; i < numCols; i++) {
      const moduleIndex = Math.floor(i / ACTIVITY_TEMPLATE.length);
      const activityIndex = i % ACTIVITY_TEMPLATE.length;
      
      moduleLabels.push('Module ' + (moduleIndex + 1));
      activityLabels.push(ACTIVITY_TEMPLATE[activityIndex]);
    }
    
    // Write to row 2 (module labels)
    sheet.getRange(2, startCol, 1, numCols).setValues([moduleLabels]);
    
    // Write to row 3 (activity labels)
    sheet.getRange(3, startCol, 1, numCols).setValues([activityLabels]);
    
    Logger.log('✅ ALL Labels written successfully to rows 2 and 3 (columns D-EM)');
    Logger.log('Total columns written: ' + numCols);
    
    return { success: true, message: 'All 140 labels written successfully' };
    
  } catch (e) {
    Logger.log('❌ writeAllLabelsToSheet error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

/**
 * ========================================
 * TEST FUNCTIONS
 * ========================================
 */

/**
 * Test connection to spreadsheet
 */
function testConnection() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('MODULE_PROGRESS');
  
  if (!sheet) {
    Logger.log('❌ Sheet MODULE_PROGRESS not found');
    Logger.log('Available sheets: ' + ss.getSheets().map(s => s.getName()).join(', '));
    return;
  }
  
  Logger.log('✅ Sheet found: MODULE_PROGRESS');
  Logger.log('Last row: ' + sheet.getLastRow());
  Logger.log('Last column: ' + sheet.getLastColumn());
  
  // Sample first student (row 4)
  if (sheet.getLastRow() >= 4) {
    const name = sheet.getRange(4, 2).getValue();
    const password = sheet.getRange(4, 3).getValue();
    Logger.log('\nFirst student (row 4):');
    Logger.log('Name: ' + name);
    Logger.log('Password: ' + password);
  }
  
  // Show labels from rows 2 and 3
  Logger.log('\n--- Labels (rows 2-3) ---');
  const moduleLabels = sheet.getRange(2, 4, 1, 10).getValues()[0];
  const activityLabels = sheet.getRange(3, 4, 1, 10).getValues()[0];
  
  for (let i = 0; i < 10; i++) {
    const mod = moduleLabels[i] ? String(moduleLabels[i]) : '(empty)';
    const act = activityLabels[i] ? String(activityLabels[i]) : '(empty)';
    Logger.log('Column ' + String.fromCharCode(68 + i) + ': ' + mod + ' / ' + act);
  }
}

/**
 * Test login with first student credentials
 */
function testLogin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('MODULE_PROGRESS');
  
  if (!sheet || sheet.getLastRow() < 4) {
    Logger.log('No data to test (need at least row 4)');
    return;
  }
  
  const name = sheet.getRange(4, 2).getValue();
  const password = sheet.getRange(4, 3).getValue();
  
  Logger.log('Testing login...');
  Logger.log('Name: ' + name);
  
  const result = getUserData(name, password);
  
  if (result.success) {
    Logger.log('✅ Login successful');
    Logger.log('Modules found: ' + result.modules.length);
    if (result.modules.length > 0) {
      Logger.log('First module: ' + result.modules[0].module);
      Logger.log('First module activities: ' + result.modules[0].activities.length);
      Logger.log('\nFirst 3 activity names:');
      for (let i = 0; i < 3 && i < result.modules[0].activities.length; i++) {
        Logger.log((i+1) + '. ' + result.modules[0].activities[i].name);
      }
    }
  } else {
    Logger.log('❌ Login failed: ' + result.message);
  }
}

/**
 * Create custom menu on open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📚 Module Tracker v2.1 Merged')
    .addItem('🔧 Test Connection', 'testConnection')
    .addItem('🧪 Test Login', 'testLogin')
    .addSeparator()
    .addItem('🏷️ Write Labels (D-Z only)', 'writeLabelsToSheet')
    .addItem('🏷️ Write ALL Labels (D-EM)', 'writeAllLabelsToSheet')
    .addSeparator()
    .addItem('🚀 Deploy Instructions', 'showDeployInfo')
    .addToUi();
}

/**
 * Show deployment instructions
 */
function showDeployInfo() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Deploy Web App',
    'Steps to deploy:\n\n' +
    '1. Click Deploy → New deployment\n' +
    '2. Select type: Web app\n' +
    '3. Execute as: Me\n' +
    '4. Who has access: Anyone (or your preference)\n' +
    '5. Click Deploy\n' +
    '6. Copy the web app URL\n\n' +
    'Version 2.1 Merged Features:\n' +
    '- Row 2: Module labels (Module 1, Module 2...)\n' +
    '- Row 3: Activity labels (SOC 1, SOC 2...)\n' +
    '- Row 4+: Student data\n' +
    '- Uses getActiveSpreadsheet() (bound script)\n' +
    '- Simple GET endpoints (getNames, getTime)\n' +
    '- Label writer functions included\n' +
    '- Required sheets: MODULE_PROGRESS, SUBMISSION, TIMESTAMP',
    ui.ButtonSet.OK
  );
}