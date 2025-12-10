/**
 * ============================================
 * UTILITY FUNCTIONS
 * ============================================
 * 
 * Helper functions for word counting, validation, etc.
 */

/**
 * Show loading overlay with spinner
 * @param {string} message - Main loading message
 * @param {string} submessage - Optional secondary message
 */
function showLoading(message = 'Loading...', submessage = '') {
  // Remove existing loader if present
  hideLoading();
  
  const overlay = document.createElement('div');
  overlay.id = 'loadingOverlay';
  overlay.className = 'loading-overlay';
  
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  
  const msgEl = document.createElement('div');
  msgEl.className = 'loading-message';
  msgEl.textContent = message;
  
  overlay.appendChild(spinner);
  overlay.appendChild(msgEl);
  
  if (submessage) {
    const subEl = document.createElement('div');
    subEl.className = 'loading-submessage';
    subEl.textContent = submessage;
    overlay.appendChild(subEl);
  }
  
  document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
function countWords(text) {
  if (!text) return 0;
  const matches = text.trim().split(/\s+/).filter(Boolean);
  return matches.length;
}

/**
 * Enforce word limit on value and return truncated text
 * @param {string} val - Text value
 * @returns {string} Truncated text
 */
function enforceWordLimitOnValue(val) {
  if (!val) return '';
  const words = val.trim().split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) {
    return words.slice(0, MAX_WORDS).join(' ');
  }
  return val;
}

/**
 * Enforce word limit on textarea element
 * @param {HTMLTextAreaElement} textarea - Textarea element
 */
function enforceWordLimit(textarea) {
  const val = textarea.value || '';
  const words = val.trim().split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) {
    textarea.value = words.slice(0, MAX_WORDS).join(' ');
  }
}

/**
 * Get persisted font size from localStorage
 * @returns {number} Font size in pixels
 */
function getPersistedFontSize() {
  try {
    const v = localStorage.getItem(FONT_STORAGE_KEY);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 12 && n <= 40) return n;
  } catch (e) {
    console.warn('Cannot access localStorage:', e);
  }
  return DEFAULT_FONT_PX;
}

/**
 * Persist font size to localStorage
 * @param {number} px - Font size in pixels
 */
function setPersistedFontSize(px) {
  try {
    localStorage.setItem(FONT_STORAGE_KEY, String(px));
  } catch (e) {
    console.warn('Cannot save to localStorage:', e);
  }
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notice ('success' or 'error')
 */
function showNotice(message, type) {
  const notice = document.getElementById('authNotice');
  notice.className = 'notice ' + type;
  
  // Preserve line breaks in error messages
  notice.style.whiteSpace = 'pre-wrap';
  notice.style.textAlign = 'left';
  notice.style.fontSize = '0.7rem';
  notice.textContent = message;
  
  // Don't auto-hide error messages that are long/important
  if (type === 'error' && message.length > 100) {
    // Keep error visible longer for debugging
    setTimeout(() => {
      notice.textContent = '';
      notice.className = 'notice';
    }, 15000);
  } else {
    setTimeout(() => {
      notice.textContent = '';
      notice.className = 'notice';
    }, 5000);
  }
}

/**
 * Generic error handler
 * @param {Error} error - Error object
 */
function onError(error) {
  console.error(error);
  showNotice('An error occurred. Please try again.', 'error');
  
  const btn = document.getElementById('loginBtn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}
