/**
 * ============================================
 * AUTHENTICATION FUNCTIONS
 * ============================================
 * 
 * Handles login, logout, and session management
 */

let currentUser = null;
let currentPassword = '';

/**
 * Load student names from server
 */
async function loadNames() {
  try {
    const names = await callAPIGet('getNames');
    onNamesLoaded(names);
  } catch (error) {
    const select = document.getElementById('nameSelect');
    select.innerHTML = '<option value="">Error loading names - check deployment</option>';
    showNotice('Cannot load student names. Apps Script deployment may not be accessible. Error: ' + error.message, 'error');
    console.error('Load names error:', error);
  }
}

/**
 * Populate names dropdown
 * @param {Array} names - Array of {name, row} objects
 */
function onNamesLoaded(names) {
  const select = document.getElementById('nameSelect');
  select.innerHTML = '<option value="">-- Select your name --</option>';
  
  (names || []).forEach(item => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.name;
    option.dataset.row = item.row;
    select.appendChild(option);
  });
}

/**
 * Handle login button click
 */
async function onLogin() {
  const name = document.getElementById('nameSelect').value;
  const password = document.getElementById('passwordField').value;
  
  if (!name || !password) {
    showNotice('Please select your name and enter password', 'error');
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const response = await callAPI('getUserData', { name, password });
    onLoginSuccess(response);
  } catch (error) {
    const btn = document.getElementById('loginBtn');
    btn.disabled = false;
    btn.textContent = 'Login';
    
    let errorMsg = 'Login failed: ';
    if (error.message.includes('Cannot connect to server')) {
      errorMsg += 'Cannot access Apps Script backend. Please verify:\n\n' +
                 '1. Apps Script Web App is deployed\n' +
                 '2. Access is set to "Anyone" (not "Only myself")\n' +
                 '3. Current URL: ' + API_URL;
    } else {
      errorMsg += error.message || 'Unknown error';
    }
    
    showNotice(errorMsg, 'error');
    console.error('Login error:', error);
    document.getElementById('passwordField').value = '';
  }
}

/**
 * Handle successful login
 * @param {object} response - Login response from server
 */
function onLoginSuccess(response) {
  const btn = document.getElementById('loginBtn');
  btn.disabled = false;
  btn.textContent = 'Login';

  if (!response || !response.success) {
    showNotice(response && response.message ? response.message : 'Invalid credentials', 'error');
    document.getElementById('passwordField').value = '';
    return;
  }

  currentUser = response;
  currentPassword = document.getElementById('passwordField').value;
  
  showProgressView();
  renderProgressTable();
  showNotice('Login successful', 'success');
}

/**
 * Show progress view and hide login card
 */
function showProgressView() {
  document.getElementById('loginCard').style.display = 'none';
  document.getElementById('progressCard').classList.add('active');
  document.getElementById('logoutBtn').style.display = 'inline-block';
  document.getElementById('headerStudentName').textContent = currentUser.name;
}

/**
 * Handle logout
 */
function onLogout() {
  currentUser = null;
  currentPassword = '';
  document.getElementById('loginCard').style.display = 'block';
  document.getElementById('progressCard').classList.remove('active');
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('passwordField').value = '';
  document.getElementById('headerStudentName').textContent = '';
  document.getElementById('authNotice').innerHTML = '';
}

/**
 * Refresh progress data from server
 */
async function refreshProgress() {
  if (!currentUser) return;
  
  try {
    const response = await callAPI('getUserData', {
      name: currentUser.name,
      password: currentPassword
    });
    
    if (response && response.success) {
      currentUser = response;
      renderProgressTable();
      showNotice('Progress refreshed', 'success');
    }
  } catch (error) {
    onError(error);
  }
}
