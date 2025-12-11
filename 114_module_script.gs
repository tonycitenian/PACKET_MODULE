// Packet Module — Server-side Apps Script
// Version: 114
// --- CHANGE: v114 - Separated data into 3 sheets for clean organization:
//     MODULE_PROGRESS (status), SUBMISSION (input text), TIMESTAMP (date/time)
//     All sheets share columns D-EM (140 activities) with matching username/password keys

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
 * doGet - API endpoint for GET requests from GitHub-hosted frontend
 * Handles: getNames, getTime actions via query parameter
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    let result;
    
    switch(action) {
      case 'getNames':
        result = getNamesList();
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
    
  } catch(error) {
    const output = ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

/**
 * doPost - API endpoint for POST requests from GitHub-hosted frontend
 * Handles: getUserData, updateActivity actions via JSON body
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    let result;
    
    switch(action) {
      case 'getUserData':
        result = getUserData(params.name, params.password);
        break;
      case 'updateActivity':
        result = updateActivityStatus(
          params.row, 
          params.colLetter, 
          params.newValue, 
          params.inputText
        );
        break;
      default:
        result = { error: 'Invalid action' };
    }
    
    const output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
    
  } catch(error) {
    const output = ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    }));
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
 * Returns the parsed JSON from the API so client can build a Date locally.
 */
function getPhilippinesTime() {
  try {
    const url = "https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila";
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    return { success: true, data: data };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Get list of student names from MODULE_PROGRESS sheet
 */
function getNamesList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('MODULE_PROGRESS');
    
    if (!sheet) {
      Logger.log('Sheet MODULE_PROGRESS not found');
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    const out = [];
    
    for (let i = 0; i < names.length; i++) {
      const raw = names[i][0];
      const name = raw === null || raw === undefined ? '' : String(raw).trim();
      if (name !== '') {
        out.push({ name: name, row: i + 2 });
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
 */
function getUserData(name, password) {
  try {
    if (!name || !password) {
      return { success: false, message: 'Name and password required' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const progressSheet = ss.getSheetByName('MODULE_PROGRESS');
    const submissionSheet = ss.getSheetByName('SUBMISSION');
    const timestampSheet = ss.getSheetByName('TIMESTAMP');
    
    if (!progressSheet) {
      return { success: false, message: 'MODULE_PROGRESS sheet not found' };
    }
    if (!submissionSheet) {
      return { success: false, message: 'SUBMISSION sheet not found' };
    }
    if (!timestampSheet) {
      return { success: false, message: 'TIMESTAMP sheet not found' };
    }

    const lastRow = progressSheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, message: 'No data available' };
    }

    // Authenticate user (from MODULE_PROGRESS sheet)
    const nameVals = progressSheet.getRange(2, 2, lastRow - 1, 1).getValues();
    const passVals = progressSheet.getRange(2, 3, lastRow - 1, 1).getValues();
    
    let matchedRow = -1;
    for (let i = 0; i < nameVals.length; i++) {
      const n = nameVals[i][0];
      const p = passVals[i][0];
      if ((n !== null && String(n) === String(name)) && 
          (p !== null && String(p) === String(password))) {
        matchedRow = i + 2;
        break;
      }
    }
    
    if (matchedRow === -1) {
      return { success: false, message: 'Invalid name or password' };
    }

    // Activity names template (10 activities per module)
    const ACTIVITY_TEMPLATE = [
      'SOC 1', 'SOC 2', 'PRACTICE 1', 'PRACTICE 2', 'PRACTICE 3',
      'PRACTICE 4', 'PRACTICE 5', 'REFLECTION', 'WRAP-UP', 'ASSESSMENT'
    ];

    // Column mapping: D to EM (140 columns = 14 modules × 10 activities)
    const MODULE_COLUMNS = [
      'D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W',
      'X','Y','Z','AA','AB','AC','AD','AE','AF','AG',
      'AH','AI','AJ','AK','AL','AM','AN','AO','AP','AQ',
      'AR','AS','AT','AU','AV','AW','AX','AY','AZ','BA',
      'BB','BC','BD','BE','BF','BG','BH','BI','BJ','BK',
      'BL','BM','BN','BO','BP','BQ','BR','BS','BT','BU',
      'BV','BW','BX','BY','BZ','CA','CB','CC','CD','CE',
      'CF','CG','CH','CI','CJ','CK','CL','CM','CN','CO',
      'CP','CQ','CR','CS','CT','CU','CV','CW','CX','CY',
      'CZ','DA','DB','DC','DD','DE','DF','DG','DH','DI',
      'DJ','DK','DL','DM','DN','DO','DP','DQ','DR','DS',
      'DT','DU','DV','DW','DX','DY','DZ','EA','EB','EC',
      'ED','EE','EF','EG','EH','EI','EJ','EK','EL','EM'
    ];

    const totalValueCols = MODULE_COLUMNS.length;
    const startCol = 4; // Column D

    // NEW: Read from 3 separate sheets (all use columns D-EM)
    // MODULE_PROGRESS: status values + locks
    // SUBMISSION: input text
    // TIMESTAMP: date/time

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

    // Build modules array
    const modules = [];
    const modulesTotal = 14; // Fixed 14 modules
    
    for (let m = 0; m < modulesTotal; m++) {
      const modObj = { module: m + 1, activities: [] };
      
      for (let a = 0; a < ACTIVITY_TEMPLATE.length; a++) {
        const idx = m * ACTIVITY_TEMPLATE.length + a;
        if (idx >= totalValueCols) break;

        const colLetter = MODULE_COLUMNS[idx];
        
        // Get raw values
        const rawVal = (idx < valuesRow.length) ? valuesRow[idx] : '';
        const rawInput = (idx < inputTextsRow.length) ? inputTextsRow[idx] : '';
        const rawTs = (idx < timestampsRow.length) ? timestampsRow[idx] : '';
        const rawLock = (idx < locksRow.length) ? locksRow[idx] : '';

        const rawValueStr = (rawVal === null || rawVal === undefined) ? '' : String(rawVal);
        const rawInputStr = (rawInput === null || rawInput === undefined) ? '' : String(rawInput);
        const rawTsStr = (rawTs === null || rawTs === undefined) ? '' : String(rawTs);
        const rawLockStr = (rawLock === null || rawLock === undefined) ? '' : String(rawLock);

        // Determine status based on Google Sheet values
        let status = '';
        if (rawLockStr.trim() !== '') {
          // If lock column has any value
          status = 'LOCKED';
        } else {
          const up = rawValueStr.trim().toUpperCase();
          if (up === 'DONE') {
            status = 'COMPLETED';
          } else if (up === '0') {
            status = 'MISSING';
          } else if (up === 'LOCKED') {
            status = 'LOCKED';
          } else if (up === 'EMPTY' || up === '') {
            status = 'NOT APPLICABLE';
          } else if (up === 'PENDING') {
            status = 'PENDING';
          } else {
            // Fallback: keep original value as status
            status = rawValueStr.trim();
          }
        }

        modObj.activities.push({
          name: ACTIVITY_TEMPLATE[a],
          col: colLetter,
          rawValue: rawValueStr,
          inputText: rawInputStr,
          rawTimestamp: rawTsStr,
          rawLock: rawLockStr,
          status: status
        });
      }
      
      modules.push(modObj);
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
 * New signature: updateActivityStatus(row, colLetter, newValue, inputText)
 *
 * Writes to 3 sheets:
 * - MODULE_PROGRESS: status value
 * - SUBMISSION: input text
 * - TIMESTAMP: date/time (using timeapi.io Asia/Manila)
 */
function updateActivityStatus(row, colLetter, newValue, inputText) {
  try {
    row = Number(row);
    if (!row || row < 2) {
      return { success: false, message: 'Invalid row' };
    }

    const MODULE_COLUMNS = [
      'D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W',
      'X','Y','Z','AA','AB','AC','AD','AE','AF','AG',
      'AH','AI','AJ','AK','AL','AM','AN','AO','AP','AQ',
      'AR','AS','AT','AU','AV','AW','AX','AY','AZ','BA',
      'BB','BC','BD','BE','BF','BG','BH','BI','BJ','BK',
      'BL','BM','BN','BO','BP','BQ','BR','BS','BT','BU',
      'BV','BW','BX','BY','BZ','CA','CB','CC','CD','CE',
      'CF','CG','CH','CI','CJ','CK','CL','CM','CN','CO',
      'CP','CQ','CR','CS','CT','CU','CV','CW','CX','CY',
      'CZ','DA','DB','DC','DD','DE','DF','DG','DH','DI',
      'DJ','DK','DL','DM','DN','DO','DP','DQ','DR','DS',
      'DT','DU','DV','DW','DX','DY','DZ','EA','EB','EC',
      'ED','EE','EF','EG','EH','EI','EJ','EK','EL','EM'
    ];
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const progressSheet = ss.getSheetByName('MODULE_PROGRESS');
    const submissionSheet = ss.getSheetByName('SUBMISSION');
    const timestampSheet = ss.getSheetByName('TIMESTAMP');
    
    if (!progressSheet) {
      return { success: false, message: 'MODULE_PROGRESS sheet not found' };
    }
    if (!submissionSheet) {
      return { success: false, message: 'SUBMISSION sheet not found' };
    }
    if (!timestampSheet) {
      return { success: false, message: 'TIMESTAMP sheet not found' };
    }

    const totalValueCols = MODULE_COLUMNS.length;
    const idx = MODULE_COLUMNS.indexOf(String(colLetter || '').toUpperCase());
    
    if (idx === -1) {
      return { success: false, message: 'Invalid column' };
    }

    const valueCol = letterToColumn(MODULE_COLUMNS[idx]);
    const lockCol = valueCol + totalValueCols;  // Lock columns are after status columns in MODULE_PROGRESS
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

    // ---------- Timestamp (REPLACED) ----------
    // Use timeapi.io authoritative Manila time and write to TIMESTAMP sheet
    try {
      const url = "https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila";
      const response = UrlFetchApp.fetch(url);
      const data = JSON.parse(response.getContentText());

      // Build correct date string WITH TIME ZONE OFFSET (important)
      const dateTimeString = `${data.year}-${pad(data.month)}-${pad(data.day)}T${pad(data.hour)}:${pad(data.minute)}:${pad(data.seconds)}+08:00`;
      const date = new Date(dateTimeString);

      // Force format in PH time zone
      const formatted = Utilities.formatDate(date, "Asia/Manila", "MMMM d, yyyy hh:mm:ss a");

      // Write to TIMESTAMP sheet (same column D-EM)
      timestampSheet.getRange(row, valueCol).setValue(formatted);

      return { success: true, timestamp: formatted };
    } catch (e) {
      // fallback to spreadsheet timezone if API call fails
      const now = new Date();
      const tz = ss.getSpreadsheetTimeZone() || "GMT";
      const fallback = Utilities.formatDate(now, tz, "MMMM d, yyyy hh:mm:ss a");
      timestampSheet.getRange(row, valueCol).setValue(fallback);
      return { success: true, timestamp: fallback, warning: 'API failed: ' + e.toString() };
    }
    // ---------- end timestamp ----------
    
  } catch (e) {
    Logger.log('updateActivityStatus error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

/**
 * Test function - run from Script Editor to verify setup
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
  
  // Sample first student
  if (sheet.getLastRow() >= 2) {
    const name = sheet.getRange(2, 2).getValue();
    const password = sheet.getRange(2, 3).getValue();
    Logger.log('\nFirst student:');
    Logger.log('Name: ' + name);
    Logger.log('Password: ' + password);
  }
}

/**
 * Test login with sample credentials
 */
function testLogin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('MODULE_PROGRESS');
  
  if (!sheet || sheet.getLastRow() < 2) {
    Logger.log('No data to test');
    return;
  }
  
  const name = sheet.getRange(2, 2).getValue();
  const password = sheet.getRange(2, 3).getValue();
  
  Logger.log('Testing login...');
  Logger.log('Name: ' + name);
  
  const result = getUserData(name, password);
  
  if (result.success) {
    Logger.log('✅ Login successful');
    Logger.log('Modules found: ' + result.modules.length);
    Logger.log('First module activities: ' + result.modules[0].activities.length);
  } else {
    Logger.log('❌ Login failed: ' + result.message);
  }
}

/**
 * DEBUG: Check specific student's data (columns D-M)
 * Run this from Apps Script Editor to see what values are being read
 */
function debugStudentStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const progressSheet = ss.getSheetByName('MODULE_PROGRESS');
  
  // Find the student by name
  const studentName = 'ITE 370 3-2 ZERESO, KURTH JAY JANCE';
  const lastRow = progressSheet.getLastRow();
  const nameVals = progressSheet.getRange(2, 2, lastRow - 1, 1).getValues();
  
  let matchedRow = -1;
  for (let i = 0; i < nameVals.length; i++) {
    if (String(nameVals[i][0]) === studentName) {
      matchedRow = i + 2;
      break;
    }
  }
  
  if (matchedRow === -1) {
    Logger.log('❌ Student not found: ' + studentName);
    return;
  }
  
  Logger.log('✅ Found student at row: ' + matchedRow);
  Logger.log('Student name: ' + studentName);
  Logger.log('==========================================');
  
  // Read columns D-M (Module 1, activities 0-9)
  const columnsToCheck = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  const activityNames = [
    'SOC 1', 'SOC 2', 'PRACTICE 1', 'PRACTICE 2', 'PRACTICE 3',
    'PRACTICE 4', 'PRACTICE 5', 'REFLECTION', 'WRAP-UP', 'ASSESSMENT'
  ];
  
  Logger.log('\n📊 READING FROM MODULE_PROGRESS SHEET:');
  Logger.log('==========================================');
  
  for (let i = 0; i < columnsToCheck.length; i++) {
    const col = columnsToCheck[i];
    const colIndex = letterToColumn(col);
    const cellValue = progressSheet.getRange(matchedRow, colIndex).getValue();
    const cellValueStr = (cellValue === null || cellValue === undefined) ? '(EMPTY)' : String(cellValue);
    
    // Determine what STATUS this would produce
    let status = '';
    const up = cellValueStr.trim().toUpperCase();
    if (up === 'DONE') {
      status = 'COMPLETED';
    } else if (up === '0') {
      status = 'MISSING';
    } else if (up === 'LOCKED') {
      status = 'LOCKED';
    } else if (up === 'EMPTY' || up === '' || up === '(EMPTY)') {
      status = 'NOT APPLICABLE';
    } else if (up === 'PENDING') {
      status = 'PENDING';
    } else {
      status = cellValueStr.trim();
    }
    
    Logger.log('Column ' + col + ' (' + activityNames[i] + '):');
    Logger.log('  Raw Value: "' + cellValueStr + '"');
    Logger.log('  Mapped Status: ' + status);
    Logger.log('  ---');
  }
  
  Logger.log('\n==========================================');
  Logger.log('✅ Debug complete! Check the values above.');
}

/**
 * Create custom menu on open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📚 Module Tracker v114')
    .addItem('🔧 Test Connection', 'testConnection')
    .addItem('🧪 Test Login', 'testLogin')
    .addSeparator()
    .addItem('🚀 Deploy Instructions', 'showDeployInfo')
    .addToUi();
}

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
    'Note: HTML file must be named "114_module_index"\n' +
    'Required sheets: MODULE_PROGRESS, SUBMISSION, TIMESTAMP',
    ui.ButtonSet.OK
  );
}