/**
 * ============================================
 * API COMMUNICATION LAYER
 * ============================================
 * 
 * Handles all communication with Google Apps Script backend
 */

/**
 * Make POST API call to backend
 * @param {string} action - Action to perform
 * @param {object} params - Parameters to send
 * @returns {Promise} Response data
 */
async function callAPI(action, params = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: action,
        ...params
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    
    // Provide detailed error information
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check:\n1. Apps Script deployment is active\n2. Deployment access is set to "Anyone"\n3. You have internet connection');
    }
    throw error;
  }
}

/**
 * Make GET API call to backend
 * @param {string} action - Action to perform
 * @returns {Promise} Response data
 */
async function callAPIGet(action) {
  try {
    const response = await fetch(`${API_URL}?action=${action}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    
    // Provide detailed error information
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check:\n1. Apps Script deployment is active\n2. Deployment access is set to "Anyone"\n3. You have internet connection');
    }
    throw error;
  }
}
