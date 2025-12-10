/**
 * ============================================
 * MAIN APPLICATION INITIALIZATION
 * ============================================
 * 
 * Entry point for the application
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load student names
  loadNames();

  // Initialize clock from server (Philippines time)
  try {
    const result = await callAPIGet('getTime');
    startClockFromServer(result);
  } catch (error) {
    console.warn('Failed to get server time, using local time:', error);
    startClockLocal();
  }
  
  // Initialize mobile features
  if (typeof initMobileFeatures === 'function') {
    initMobileFeatures();
  }
});
