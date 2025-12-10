#!/usr/bin/env node
/**
 * Generate PWA icons from source image
 * Fallback: Just copy the original if resize tools unavailable
 */
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, '../public/icons/icon-original.png');
const icon192 = path.join(__dirname, '../public/icons/icon-192.png');
const icon512 = path.join(__dirname, '../public/icons/icon-512.png');

// Simple fallback: copy original to required sizes
// (Manual resize recommended for production)
console.log('⚠️  ImageMagick not available - copying original icon');
console.log('📝 For production: manually resize to 192x192 and 512x512');

try {
  fs.copyFileSync(sourceIcon, icon192);
  fs.copyFileSync(sourceIcon, icon512);
  console.log('✅ Icon files created (require manual resize for optimal quality)');
  console.log('   - public/icons/icon-192.png');
  console.log('   - public/icons/icon-512.png');
} catch (err) {
  console.error('❌ Error copying icons:', err.message);
  process.exit(1);
}
