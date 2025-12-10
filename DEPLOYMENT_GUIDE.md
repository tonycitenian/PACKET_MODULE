# Packet Module - GitHub + Google Apps Script Deployment Guide

## 📋 Overview

This guide walks you through deploying the Packet Module system with:
- **Frontend**: `index.html` - GitHub Pages (static HTML/CSS/JS)
- **Backend**: `114_module_script.gs` - Google Apps Script (server-side logic + Google Sheets storage)
- **Version**: v114 (GitHub Edition)

---

## 🚀 Quick Start Summary

1. **Deploy Apps Script Backend** → Get Web App URL
2. **Update `index.html`** → Replace `YOUR_DEPLOYMENT_ID` with actual URL
3. **Deploy to GitHub Pages** → Upload and enable Pages
4. **Test** → Access your GitHub Pages URL

---

## Part 1: Deploy Google Apps Script Backend

### Step 1.1: Set Up Google Sheets

1. **Create a new Google Sheets document** or use existing one
2. **Create 3 sheets** with these exact names:
   - `MODULE_PROGRESS` (stores activity status + locks)
   - `SUBMISSION` (stores student input text)
   - `TIMESTAMP` (stores date/time of updates)

3. **Structure for all 3 sheets** (columns A-EM):
   ```
   Column A: ID (student number)
   Column B: Name (student full name)
   Column C: Password (plain text - for demo only)
   Columns D-EM: 140 activity columns (14 modules × 10 activities)
   ```

4. **Lock columns** (MODULE_PROGRESS sheet only):
   - Columns EN-JG: Lock flags (140 columns after D-EM)
   - Any value in these columns locks the corresponding activity

5. **Populate student data** in Row 2+ (all 3 sheets):
   ```
   A2: 1
   B2: John Doe
   C2: password123
   ```

### Step 1.2: Create Apps Script Project

1. In Google Sheets: **Extensions → Apps Script**
2. Delete default `Code.gs` content
3. **Copy entire contents** of `114_module_script.gs` from your repository into the editor
4. **Save** the project (File → Save or Ctrl/Cmd+S)
5. **Name the project**: "Packet Module API"

**Note**: The file `114_module_script.gs` in your repository is the complete backend code.

### Step 1.3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click gear icon ⚙️ → Select **Web app**
3. Configure deployment:
   ```
   Description: Packet Module v114 API
   Execute as: Me (your email)
   Who has access: Anyone
   ```
   ⚠️ **CRITICAL**: Must be "Anyone" for GitHub to access

4. Click **Deploy**
5. **Grant permissions** when prompted:
   - Review permissions
   - Go to Advanced → "Go to [Project Name] (unsafe)"
   - Click "Allow"

6. **Copy the Web App URL**:
   ```
   https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXX/exec
   ```
   ⚠️ **Save this URL** - you'll need it in Part 2!

### Step 1.4: Test Backend (Optional but Recommended)

1. Test the API endpoint in browser:
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getNames
   ```

2. Should return JSON with student names:
   ```json
   [{"name":"John Doe","row":2}]
   ```

3. If you get errors:
   - Check sheet names are exactly: `MODULE_PROGRESS`, `SUBMISSION`, `TIMESTAMP`
   - Check student data exists in row 2+
   - Check deployment settings (Execute as: Me, Access: Anyone)

---

## Part 2: Deploy GitHub Frontend

### Step 2.1: Update API URL in index.html

1. **Open** `index.html` file
2. **Find line ~407** (inside `<script>` tag):
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/AKfycby9H7lhO-l47m83X_wkx7kWjAhtmN3opfAN8kFBGkqwWMVEWwaMYTBpgGKmT4daljWL/exec';
   ```

3. **Replace the entire URL** with your actual Web App URL from Step 1.3:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec';
   ```
   
   ⚠️ **IMPORTANT**: The current URL is a placeholder. You MUST replace it with your own deployment URL.

4. **Save** the file and commit to GitHub

### Step 2.2: Create GitHub Repository

#### Option A: GitHub Web Interface

1. Go to https://github.com/new
2. **Repository name**: `PACKET_MODULE` (or your choice)
3. **Visibility**: Public (required for free GitHub Pages)
4. **Initialize**: Unchecked (we'll upload files manually)
5. Click **Create repository**

**Note**: If you're reading this from GitHub, you've already created the repository!

#### Option B: GitHub CLI

```bash
gh repo create PACKET_MODULE --public --source=. --remote=origin
```

### Step 2.3: Upload Files to GitHub

**Current Repository Structure**:
```
PACKET_MODULE/
├── index.html                 # Main frontend (REQUIRED for deployment)
├── 114_module_script.gs       # Backend script (copy to Apps Script)
├── README.md                  # Project documentation
├── DEPLOYMENT_GUIDE.md        # This guide
└── QUICK_REFERENCE.md         # Quick reference
```

#### Option A: GitHub Web Interface

1. In your repository, click **Add file → Upload files**
2. **Drag and drop** `index.html` (updated with your API URL)
3. **Commit message**: "Deploy Packet Module frontend"
4. Click **Commit changes**

#### Option B: Git Command Line

```bash
# Navigate to project directory
cd /path/to/PACKET_MODULE

# Add the updated index.html
git add index.html

# Commit
git commit -m "Update index.html with deployment URL"

# Push to GitHub
git push origin main
```

**Note**: Only `index.html` is needed for GitHub Pages. The `.gs` file is for Apps Script only.

### Step 2.4: Enable GitHub Pages

1. Go to repository **Settings → Pages** (left sidebar)
2. **Source**: Deploy from a branch
3. **Branch**: `main` (or `master`)
4. **Folder**: `/ (root)`
5. Click **Save**

6. **Wait 1-2 minutes** for deployment
7. **Your site will be live at**:
   ```
   https://YOUR_USERNAME.github.io/PACKET_MODULE/
   ```
   
   Example: `https://tonycitenian.github.io/PACKET_MODULE/`

8. **Bookmark this URL** - this is your application!

---

## Part 3: Testing Checklist

### ✅ Basic Functionality

- [ ] Page loads without errors (check browser console: F12)
- [ ] Clock displays and updates every second
- [ ] Red clock color (#ef4444) displays correctly
- [ ] Version shows "v114" in header
- [ ] Title shows "Packet Module — v114 (GitHub Edition)"

### ✅ Authentication

- [ ] Name dropdown populates with student names
- [ ] Login works with correct credentials (name + password)
- [ ] Login fails with incorrect password
- [ ] Login shows error message for wrong credentials
- [ ] Logout clears session and returns to login screen

### ✅ Progress Table

- [ ] Progress table displays after successful login
- [ ] Shows 14 modules (MODULE 1 - MODULE 14)
- [ ] Each module has 10 activities
- [ ] Statistics show correct counts (Completed/Pending/Total)
- [ ] Module name appears only on first activity of each module

### ✅ Activity Status

- [ ] Status badges display correctly:
  - 🟢 COMPLETED (green)
  - 🟡 PENDING (yellow)
  - 🔴 LOCKED (red)
  - ⚪ NOT STARTED (gray)
  - ⚫ NOT APPLICABLE (dark gray)
- [ ] Locked activities cannot be clicked
- [ ] Completed activities show completion date

### ✅ Text Input Editor

- [ ] Clicking textarea opens fullscreen modal
- [ ] Modal shows module number and activity name
- [ ] Font size controls work (A-, A+, Reset, slider)
- [ ] Font size persists across sessions (localStorage)
- [ ] Word count displays and updates live
- [ ] Word count enforces 1000-word limit
- [ ] Save button closes modal and saves text
- [ ] Cancel button closes modal without saving
- [ ] Esc key closes modal (Cancel)
- [ ] Ctrl/Cmd+S saves and closes modal
- [ ] Modal works on mobile (fullscreen)

### ✅ Mark as Done

- [ ] "Mark as Done" button triggers confirmation
- [ ] Button shows "UPDATING..." during save
- [ ] Status updates to COMPLETED after save
- [ ] Timestamp updates to Philippines time
- [ ] Input text saves to Google Sheets
- [ ] Button becomes disabled after completion
- [ ] Row becomes non-editable after completion
- [ ] Success notification appears
- [ ] Failed updates show error message

### ✅ Refresh Progress

- [ ] Refresh button reloads data from Google Sheets
- [ ] Updates reflect changes made by other users
- [ ] Success notification appears after refresh

### ✅ Mobile Responsiveness

- [ ] Layout adapts to mobile screen sizes
- [ ] Table scrolls horizontally if needed
- [ ] Buttons are tappable (proper touch targets)
- [ ] Modal editor works on mobile (fullscreen)
- [ ] Font size controls accessible on mobile

### ✅ Data Persistence

- [ ] Changes save to `MODULE_PROGRESS` sheet (status)
- [ ] Changes save to `SUBMISSION` sheet (input text)
- [ ] Changes save to `TIMESTAMP` sheet (datetime)
- [ ] Multiple users can work simultaneously (last-write-wins)

---

## Part 4: Common Issues & Troubleshooting

### Issue 1: "Failed to fetch" or CORS errors

**Symptoms**: Browser console shows CORS or network errors

**Solutions**:
1. Verify Apps Script deployment is "Anyone" can access
2. Check API_URL in index.html matches your Web App URL exactly
3. Ensure Web App URL ends with `/exec` (not `/dev`)
4. Redeploy Apps Script (Deploy → Manage deployments → Edit → Deploy)

### Issue 2: Names dropdown stays "Loading names..."

**Symptoms**: Dropdown never populates

**Solutions**:
1. Check `MODULE_PROGRESS` sheet exists (exact name)
2. Check student names are in Column B (row 2+)
3. Check browser console for API errors (F12)
4. Test API manually: `YOUR_WEB_APP_URL?action=getNames`

### Issue 3: Login always fails

**Symptoms**: Always shows "Invalid name or password"

**Solutions**:
1. Check passwords are in Column C of `MODULE_PROGRESS` sheet
2. Check spelling/capitalization of name and password
3. Check row numbers match (name and password in same row)
4. Check browser console for API errors

### Issue 4: Clock not updating

**Symptoms**: Clock shows "--:--:--" or doesn't tick

**Solutions**:
1. Check timeapi.io is accessible (test in browser)
2. Check browser console for API errors
3. Wait 5 seconds - it may fall back to local time
4. Clock will use local time if API fails (expected behavior)

### Issue 5: Updates don't save

**Symptoms**: "Mark as Done" doesn't work

**Solutions**:
1. Check all 3 sheets exist: `MODULE_PROGRESS`, `SUBMISSION`, `TIMESTAMP`
2. Check activity is not locked (columns EN-JG in MODULE_PROGRESS)
3. Check browser console for API errors
4. Test API manually with POST request
5. Check Apps Script execution log (View → Executions)

### Issue 6: Timestamp shows wrong timezone

**Symptoms**: Time is not Philippines time

**Solutions**:
1. Check timeapi.io API is working
2. Check Apps Script has internet access
3. Verify timezone offset in code: `+08:00`
4. Check Google Sheets timezone: File → Settings → General → Time zone

### Issue 7: Word count doesn't enforce limit

**Symptoms**: Can type more than 1000 words

**Solutions**:
1. Check `enforceWordLimit()` function exists
2. Check MAX_WORDS constant is set to 1000
3. Clear browser cache and reload page
4. Check console for JavaScript errors

### Issue 8: Modal font size doesn't persist

**Symptoms**: Font size resets after page reload

**Solutions**:
1. Check localStorage is enabled in browser
2. Check browser is not in private/incognito mode
3. Check FONT_STORAGE_KEY constant exists
4. Check browser console for localStorage errors

### Issue 9: GitHub Pages shows 404

**Symptoms**: GitHub Pages URL shows "404 Not Found"

**Solutions**:
1. Wait 2-5 minutes after enabling Pages
2. Check file is named exactly `index.html` (case-sensitive)
3. Check file is in root directory (not in subfolder)
4. Check repository is Public
5. Check Pages is enabled in Settings → Pages
6. Try accessing with `/index.html` explicitly

### Issue 10: Changes made by one user don't show for another

**Symptoms**: Multi-user conflicts or stale data

**Expected Behavior**: Last-write-wins (no optimistic locking)

**Solutions**:
1. Click "Refresh" button to reload data
2. This is expected - system has no real-time sync
3. Users should coordinate to avoid simultaneous edits
4. Implement WebSockets or polling for real-time updates (future enhancement)

---

## Part 5: Security Considerations

### ⚠️ Current Security Limitations

1. **Passwords stored in plain text** in Google Sheets
   - **Risk**: Anyone with Sheets access can see passwords
   - **Recommendation**: Use password hashing (bcrypt) or OAuth

2. **No session management** 
   - **Risk**: Password sent with every API request
   - **Recommendation**: Implement JWT tokens or session cookies

3. **Anyone can access Web App**
   - **Risk**: Public API endpoint
   - **Recommendation**: Implement API key or IP whitelist

4. **No rate limiting**
   - **Risk**: Potential abuse or DoS
   - **Recommendation**: Implement request throttling

5. **Client-side validation only**
   - **Risk**: Can be bypassed
   - **Recommendation**: Add server-side validation

### 🔒 Recommended Improvements for Production

```javascript
// Example: Hash passwords (add to Apps Script)
function hashPassword(password) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, 
    password + "YOUR_SALT"
  );
}

// Example: Validate input (add to updateActivityStatus)
function validateInput(inputText) {
  if (!inputText || typeof inputText !== 'string') return false;
  if (inputText.length > 100000) return false;
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  return wordCount <= 1000;
}

// Example: Rate limiting (simple version)
const RATE_LIMIT = 60; // requests per minute
const requestLog = {};

function checkRateLimit(userId) {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const key = `${userId}_${minute}`;
  
  if (!requestLog[key]) requestLog[key] = 0;
  requestLog[key]++;
  
  return requestLog[key] <= RATE_LIMIT;
}
```

---

## Part 6: Maintenance & Updates

### Updating the Frontend (index.html)

1. **Edit** `index.html` locally
2. **Commit and push** to GitHub:
   ```bash
   git add index.html
   git commit -m "Update frontend: [description]"
   git push origin main
   ```
3. **Wait 1-2 minutes** for GitHub Pages to rebuild
4. **Hard refresh** browser (Ctrl+Shift+R / Cmd+Shift+R)

### Updating the Backend (Apps Script)

1. **Edit** script in Apps Script Editor
2. **Save** changes (Ctrl/Cmd+S)
3. **Deploy** → **Manage deployments**
4. Click ✏️ **Edit** on active deployment
5. **Version**: New version
6. Click **Deploy**
7. **Important**: Web App URL stays the same (no frontend update needed)

### Updating Apps Script Without Redeployment

For minor changes that don't affect API structure:
1. Edit and save in Apps Script Editor
2. Changes take effect immediately
3. No redeployment needed

### Adding New Students

1. Open Google Sheets
2. Add new row in **all 3 sheets**:
   - `MODULE_PROGRESS`
   - `SUBMISSION`
   - `TIMESTAMP`
3. Fill columns A (ID), B (Name), C (Password)
4. Save - student can login immediately

### Locking Activities

To prevent editing of specific activities:
1. Open `MODULE_PROGRESS` sheet
2. Find the activity column (D-EM)
3. Add corresponding lock column (EN-JG):
   - Activity in column D → Lock in column EN
   - Activity in column E → Lock in column EO
   - ... (140 columns offset)
4. Put any value (e.g., "LOCKED") in the lock column
5. Save - activity becomes read-only

---

## Part 7: Advanced Configuration

### Customizing Number of Modules

Current: 14 modules × 10 activities = 140 total

To change:
1. **Apps Script** (`114_module_script.gs`):
   ```javascript
   const modulesTotal = 14; // Change this number
   ```

2. **Update MODULE_COLUMNS array** if changing activities per module

3. **Update Google Sheets** structure accordingly

### Customizing Activity Names

Edit in `114_module_script.gs`:
```javascript
const ACTIVITY_TEMPLATE = [
  'SOC 1', 'SOC 2', 'PRACTICE 1', 'PRACTICE 2', 'PRACTICE 3',
  'PRACTICE 4', 'PRACTICE 5', 'REFLECTION', 'WRAP-UP', 'ASSESSMENT'
];
```

### Customizing Word Limit

In `index.html`:
```javascript
const MAX_WORDS = 1000; // Change this number
```

### Customizing Clock Timezone

In `114_module_script.gs`:
```javascript
const url = "https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila";
// Change timezone parameter (e.g., America/New_York)
```

### Customizing Colors

In `index.html` `<style>` section:
```css
/* Clock color */
.digital-clock { color: #ef4444; } /* Change hex code */

/* Status badges */
.status-done { background: linear-gradient(90deg, #10b981, #059669); }
.status-pending { background: linear-gradient(90deg, #fef3c7, #fde68a); }
.status-locked { background: linear-gradient(90deg, #ef4444, #dc2626); }
```

---

## Part 8: Backup & Recovery

### Backing Up Google Sheets Data

1. **File → Download → Microsoft Excel (.xlsx)**
2. Save with timestamp: `packet-module-backup-2024-12-10.xlsx`
3. Store in secure location

### Automated Backup (Apps Script)

Add to `114_module_script.gs`:
```javascript
function backupToGoogleDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFolderById('YOUR_FOLDER_ID');
  const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd_HHmmss');
  const copy = ss.copy('Backup_' + timestamp);
  DriveApp.getFileById(copy.getId()).moveTo(folder);
}

// Run daily
function createBackupTrigger() {
  ScriptApp.newTrigger('backupToGoogleDrive')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
}
```

### Restoring from Backup

1. Open backup file
2. Copy all data
3. Paste into production sheets
4. Verify data integrity
5. Test login with sample student

---

## Part 9: Performance Optimization

### Current Performance Characteristics

- **Load time**: 2-4 seconds (depends on student count)
- **Update time**: 1-3 seconds (per activity)
- **Concurrent users**: ~10-20 (Google Apps Script limit)
- **Data size**: ~5 MB per 100 students

### Optimization Strategies

1. **Reduce API calls**:
   ```javascript
   // Cache student data in localStorage
   if (localStorage.getItem('cachedUser')) {
     // Use cached data, refresh in background
   }
   ```

2. **Lazy load modules**:
   ```javascript
   // Load only visible modules initially
   // Load others on scroll or expand
   ```

3. **Compress responses**:
   ```javascript
   // In Apps Script: send minimal data
   // Remove unnecessary fields
   ```

4. **Implement pagination**:
   ```javascript
   // Show 5 modules at a time
   // "Load more" button for remaining
   ```

---

## Part 10: Monitoring & Analytics

### Google Apps Script Execution Log

1. Apps Script Editor → **View → Executions**
2. See all API calls, errors, execution time
3. Filter by status: Success, Failed, Timeout

### GitHub Pages Analytics

1. Enable Google Analytics in `index.html`:
   ```html
   <!-- Global site tag (gtag.js) - Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

2. Track custom events:
   ```javascript
   gtag('event', 'login', { user: currentUser.name });
   gtag('event', 'activity_complete', { module: moduleNumber });
   ```

### Error Tracking

Add to `index.html`:
```javascript
window.addEventListener('error', (e) => {
  // Send to error tracking service (e.g., Sentry)
  console.error('Global error:', e.message);
});
```

---

## 📞 Support & Resources

### Documentation
- **Google Apps Script**: https://developers.google.com/apps-script
- **GitHub Pages**: https://docs.github.com/pages
- **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

### Community
- **Stack Overflow**: [google-apps-script] tag
- **GitHub Discussions**: Enable in repository settings
- **Reddit**: r/googleappsscript

### Contact
For issues with this specific deployment:
1. Check this guide first
2. Check browser console (F12) for errors
3. Check Apps Script execution log
4. Create issue on GitHub repository

---

## 🎉 Success Checklist

After completing deployment, you should have:

✅ Google Sheets with 3 sheets and student data  
✅ Apps Script deployed as Web App  
✅ Web App URL copied and saved  
✅ `index.html` updated with real API URL  
✅ GitHub repository created  
✅ GitHub Pages enabled  
✅ Application accessible at GitHub Pages URL  
✅ Login working with test student  
✅ Progress table displaying correctly  
✅ Activity updates saving to Google Sheets  
✅ Clock displaying Philippines time  
✅ Modal editor working with font controls  
✅ All testing checklist items passing  

**Congratulations! Your Packet Module v114 is now live! 🚀**

---

**Last Updated**: December 10, 2025  
**Version**: 114 (GitHub Edition)  
**Repository**: https://github.com/tonycitenian/PACKET_MODULE  
**Author**: Packet Module Development Team
