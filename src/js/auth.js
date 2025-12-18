/**
 * ============================================
 * AUTHENTICATION FUNCTIONS
 * ============================================
 * 
 * Handles login, logout, and session management
 */

let currentUser = null;
let currentPassword = '';
let currentUserName = ''; // Store current user's name for refresh
let allNames = []; // Store all names for autocomplete
let selectedName = ''; // Store selected name
let activeIndex = -1; // Track active suggestion

/**
 * Load student names from server
 */
async function loadNames() {
  try {
    const names = await callAPIGet('getNames');
    onNamesLoaded(names);
  } catch (error) {
    const input = document.getElementById('nameInput');
    input.placeholder = 'Error loading names - check deployment';
    showNotice('Cannot load student names. Apps Script deployment may not be accessible. Error: ' + error.message, 'error');
    console.error('Load names error:', error);
  }
}

/**
 * Initialize autocomplete with names
 * @param {Array} names - Array of {name, row} objects
 */
function onNamesLoaded(names) {
  allNames = names || [];
  const input = document.getElementById('nameInput');
  input.placeholder = 'Type your name...';
  
  // Set up autocomplete event listeners
  initAutocomplete();
}

/**
 * Initialize autocomplete functionality
 */
function initAutocomplete() {
  const input = document.getElementById('nameInput');
  const dropdown = document.getElementById('nameDropdown');
  
  // Input event - filter as user types
  input.addEventListener('input', function() {
    const query = this.value.trim();
    selectedName = ''; // Reset selection when typing
    activeIndex = -1;
    
    if (query.length === 0) {
      dropdown.classList.remove('show');
      return;
    }
    
    filterAndShowSuggestions(query);
  });
  
  // Focus event - show all names if input is empty
  input.addEventListener('focus', function() {
    if (this.value.trim().length === 0) {
      showAllSuggestions();
    }
  });
  
  // Keyboard navigation
  input.addEventListener('keydown', function(e) {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      updateActiveItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        selectName(items[activeIndex].textContent);
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('show');
    }
  });
  
  // Click outside to close
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
}

/**
 * Filter and show name suggestions
 */
function filterAndShowSuggestions(query) {
  const dropdown = document.getElementById('nameDropdown');
  const lowerQuery = query.toLowerCase();
  
  const matches = allNames.filter(item => 
    item.name.toLowerCase().includes(lowerQuery)
  );
  
  if (matches.length === 0) {
    dropdown.innerHTML = '<div class="autocomplete-no-results">No names found</div>';
    dropdown.classList.add('show');
    return;
  }
  
  dropdown.innerHTML = '';
  matches.forEach(item => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.textContent = item.name;
    div.dataset.row = item.row;
    
    // Highlight matching text
    const regex = new RegExp(`(${query})`, 'gi');
    div.innerHTML = item.name.replace(regex, '<span class="autocomplete-highlight">$1</span>');
    
    div.addEventListener('click', function() {
      selectName(item.name);
    });
    
    dropdown.appendChild(div);
  });
  
  dropdown.classList.add('show');
  activeIndex = -1;
}

/**
 * Show all available names
 */
function showAllSuggestions() {
  const dropdown = document.getElementById('nameDropdown');
  dropdown.innerHTML = '';
  
  allNames.forEach(item => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.textContent = item.name;
    div.dataset.row = item.row;
    
    div.addEventListener('click', function() {
      selectName(item.name);
    });
    
    dropdown.appendChild(div);
  });
  
  dropdown.classList.add('show');
}

/**
 * Update active/highlighted item in dropdown
 */
function updateActiveItem(items) {
  items.forEach((item, index) => {
    if (index === activeIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * Select a name from suggestions
 */
function selectName(name) {
  const input = document.getElementById('nameInput');
  const dropdown = document.getElementById('nameDropdown');
  
  input.value = name;
  selectedName = name;
  dropdown.classList.remove('show');
  
  // Focus password field
  document.getElementById('passwordField').focus();
}

/**
 * Handle login button click
 */
async function onLogin() {
  const name = selectedName || document.getElementById('nameInput').value.trim();
  const password = document.getElementById('passwordField').value;
  
  if (!name || !password) {
    showNotice('Please enter your name and password', 'error');
    return;
  }
  
  // Verify name exists in list
  const nameExists = allNames.some(item => item.name === name);
  if (!nameExists) {
    showNotice('Name not found. Please select from suggestions.', 'error');
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'Logging in...';

  try {
    const response = await callAPI('getUserData', { name, password });
    onLoginSuccess(response);
  } catch (error) {
    const btn = document.getElementById('loginBtn');
    btn.disabled = false;
    btn.classList.remove('loading');
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
  btn.classList.remove('loading');
  btn.textContent = 'Login';

  if (!response || !response.success) {
    showNotice(response && response.message ? response.message : 'Invalid credentials', 'error');
    document.getElementById('passwordField').value = '';
    return;
  }

  currentUser = response;
  currentPassword = document.getElementById('passwordField').value;
  currentUserName = currentUser.name; // Store name for refresh
  
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
  document.getElementById('refreshBtn').style.display = 'inline-block';
  document.getElementById('headerStudentName').textContent = currentUser.name;
}

/**
 * Handle logout
 */
function onLogout() {
  currentUser = null;
  currentPassword = '';
  currentUserName = '';
  document.getElementById('loginCard').style.display = 'block';
  document.getElementById('progressCard').classList.remove('active');
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('refreshBtn').style.display = 'none';
  document.getElementById('passwordField').value = '';
  document.getElementById('headerStudentName').textContent = '';
  document.getElementById('authNotice').innerHTML = '';
}

/**
 * Refresh progress data from server
 * Re-fetches current user's data from Google Sheets
 */
async function refreshProgress() {
  if (!currentUser) return;
  
  const refreshBtn = document.getElementById('refreshBtn');
  const originalText = refreshBtn ? refreshBtn.textContent : '';
  
  try {
    // Show loading state
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.classList.add('loading');
      refreshBtn.textContent = '🔄 Refreshing...';
    }
    
    const response = await callAPI('getUserData', {
      name: currentUser.name,
      password: currentPassword
    });
    
    if (response && response.success) {
      currentUser = response;
      renderProgressTable();
      showNotice('✅ Data refreshed successfully!', 'success');
    } else {
      showNotice('Failed to refresh: ' + (response.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Refresh error:', error);
    showNotice('Error refreshing data: ' + error.message, 'error');
  } finally {
    // Restore button state
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('loading');
      refreshBtn.textContent = originalText;
    }
  }
}

/**
 * Alias for global access
 */
function refreshData() {
  return refreshProgress();
}
