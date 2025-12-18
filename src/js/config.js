/**
 * ============================================
 * APPLICATION CONFIGURATION
 * ============================================
 * 
 * All constants and configuration values
 */

// API Configuration
// ⚠️ IMPORTANT: Replace with your actual Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycby9H7lhO-l47m83X_wkx7kWjAhtmN3opfAN8kFBGkqwWMVEWwaMYTBpgGKmT4daljWL/exec';

// Application Constants
const MAX_WORDS = 1000;
const DEFAULT_FONT_PX = 18;
const FONT_STORAGE_KEY = 'packet_modal_font_size';
const CLOCK_UPDATE_INTERVAL = 1000; // milliseconds

// Timezone Configuration
const TIMEZONE = 'Asia/Manila';

// Group/Section Configuration
// Add or remove groups as needed
const AVAILABLE_GROUPS = [
  { code: '293', label: '293' },
  { code: '370', label: '370' },
  { code: '384', label: '384' },
  { code: '385', label: '385' },
  { code: 'SSP', label: 'SSP' }
];
