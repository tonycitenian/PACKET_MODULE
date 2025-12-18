# Packet Module v114 - Quick Reference

## 🔗 Essential URLs

**Apps Script Web App URL (Backend)**:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**GitHub Pages URL (Frontend)**:
```
https://YOUR_USERNAME.github.io/packet-module-v114/
```

---

## ⚡ Quick Commands

### Deploy Frontend to GitHub
```bash
# One-time setup
git init
git add index.html
git commit -m "Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/packet-module-v114.git
git push -u origin main

# Future updates
git add index.html
git commit -m "Update: [description]"
git push origin main
```

### Test API Endpoints
```bash
# Get student names
curl "YOUR_WEB_APP_URL?action=getNames"

# Get Philippines time
curl "YOUR_WEB_APP_URL?action=getTime"

# Login (POST request)
curl -X POST YOUR_WEB_APP_URL \
  -H "Content-Type: application/json" \
  -d '{"action":"getUserData","name":"John Doe","password":"password123"}'
```

---

## 📊 Google Sheets Structure

### Required Sheets (exact names)
1. **MODULE_PROGRESS** - Activity status + lock flags
2. **SUBMISSION** - Student input text
3. **TIMESTAMP** - Date/time of updates

### Column Layout (all 3 sheets)
```
A: ID
B: Name
C: Password
D-EM: 140 activity columns (14 modules × 10 activities)
EN-JG: 140 lock columns (MODULE_PROGRESS only)
```

### Activity Column Mapping
- **Module 1**: Columns D-M (10 activities)
- **Module 2**: Columns N-W (10 activities)
- **Module 3**: Columns X-AG (10 activities)
- ... and so on through Module 14

---

## 🔧 Configuration Changes

### Change API URL (Frontend)
**File**: `index.html`  
**Line**: ~413
```javascript
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### Change Number of Modules (Backend)
**File**: `114_module_script.gs`  
**Line**: ~180
```javascript
const modulesTotal = 14; // Change this
```

### Change Word Limit (Frontend)
**File**: `index.html`  
**Line**: ~409
```javascript
const MAX_WORDS = 1000; // Change this
```

### Change Activity Names (Backend)
**File**: `114_module_script.gs`  
**Line**: ~117
```javascript
const ACTIVITY_TEMPLATE = [
  'SOC 1', 'SOC 2', 'PRACTICE 1', 'PRACTICE 2', 'PRACTICE 3',
  'PRACTICE 4', 'PRACTICE 5', 'REFLECTION', 'WRAP-UP', 'ASSESSMENT'
];
```

---

## 🐛 Common Errors & Quick Fixes

### Error: "Invalid action"
**Cause**: Wrong API URL or action parameter  
**Fix**: Check API_URL in index.html matches Web App URL

### Error: "Sheet not found"
**Cause**: Missing required sheets  
**Fix**: Create sheets: MODULE_PROGRESS, SUBMISSION, TIMESTAMP

### Error: "Invalid name or password"
**Cause**: Credentials don't match Google Sheets  
**Fix**: Check Column B (name) and Column C (password) in MODULE_PROGRESS

### Error: "Activity is locked"
**Cause**: Lock flag set in MODULE_PROGRESS  
**Fix**: Clear lock column (EN-JG) for that activity

### Error: "Failed to fetch"
**Cause**: CORS or network issue  
**Fix**: Ensure Apps Script deployed as "Anyone can access"

---

## 📋 Deployment Checklist

### Google Apps Script
- [ ] 3 sheets created (MODULE_PROGRESS, SUBMISSION, TIMESTAMP)
- [ ] Student data added (Columns A-C)
- [ ] Apps Script code pasted
- [ ] Deployed as Web App
- [ ] Execute as: Me
- [ ] Access: Anyone
- [ ] Web App URL copied

### GitHub Pages
- [ ] index.html updated with real API URL
- [ ] Repository created (public)
- [ ] File uploaded to GitHub
- [ ] Pages enabled (Settings → Pages)
- [ ] Branch: main, Folder: / (root)
- [ ] Site accessible at GitHub Pages URL

### Testing
- [ ] Login works
- [ ] Progress table displays
- [ ] Activities can be marked as done
- [ ] Text input saves
- [ ] Timestamps update
- [ ] Clock displays
- [ ] Refresh works

---

## 🎨 Activity Status Values

| Status | Display | Color | Editable |
|--------|---------|-------|----------|
| `EMPTY` or blank | NOT STARTED | Gray | Yes |
| `PENDING` or any text | PENDING | Yellow | Yes |
| `DONE` or `COMPLETED` | COMPLETED | Green | No |
| `LOCKED` | LOCKED | Red | No |
| `NOT APPLICABLE` / `N/A` | NOT APPLICABLE | Dark Gray | No |

---

## 🔒 Security Notes

⚠️ **For Demo/Development Only**

**Current Limitations**:
- Passwords stored in plain text
- No session management
- No rate limiting
- Public API endpoint

**For Production**:
- Implement password hashing
- Use JWT tokens
- Add rate limiting
- Implement server-side validation
- Use environment variables for secrets

---

## 📞 Emergency Recovery

### Frontend Down
1. Check GitHub Pages status
2. Hard refresh browser (Ctrl+Shift+R)
3. Check file is named `index.html` exactly
4. Verify repository is public

### Backend Down
1. Check Apps Script execution log
2. Redeploy Web App
3. Check Google Sheets exists
4. Verify sheet names are exact

### Data Loss
1. Restore from backup (.xlsx file)
2. Copy data to production sheets
3. Verify in browser
4. Test with sample student

---

## 📈 Performance Tips

- **Load time**: Expect 2-4 seconds
- **Concurrent users**: Limit to ~10-20
- **API calls**: Minimize unnecessary requests
- **Caching**: Use localStorage for student data
- **Refresh**: Only when needed, not on every action

---

## 📚 File Reference

### Production Files
- `114_module_script.gs` - Apps Script backend (Google)
- `index.html` - Frontend (GitHub)
- Google Sheets - Data storage (3 sheets)

### Documentation Files
- `DEPLOYMENT_GUIDE.md` - Full deployment instructions
- `QUICK_REFERENCE.md` - This file
- `README.md` - Project overview

---

## 🎯 Next Steps After Deployment

1. **Add all students** to Google Sheets
2. **Lock completed modules** (set lock flags)
3. **Share GitHub Pages URL** with students
4. **Monitor usage** (Apps Script executions)
5. **Set up backups** (daily exports)
6. **Test on mobile** devices
7. **Train students** on system usage

---

**Last Updated**: December 10, 2024  
**Version**: 114  
**Support**: See DEPLOYMENT_GUIDE.md for detailed troubleshooting
