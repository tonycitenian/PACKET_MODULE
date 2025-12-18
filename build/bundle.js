#!/usr/bin/env node

/**
 * ============================================
 * BUILD SCRIPT
 * ============================================
 * 
 * Combines HTML, CSS, and JavaScript files into a single index.html
 * for deployment to GitHub Pages
 */

const fs = require('fs');
const path = require('path');

// Paths
const SRC_DIR = path.join(__dirname, '../src');
const PUBLIC_DIR = path.join(__dirname, '../public');
const HTML_TEMPLATE = path.join(SRC_DIR, 'module_progress.html');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'module_progress.html');

// CSS files in order
const CSS_FILES = [
  '01-variables.css',
  '02-base.css',
  '03-layout.css',
  '04-components.css',
  '05-login.css',
  '06-progress.css',
  '07-modal.css',
  '08-responsive.css',
  '09-mobile-nav.css'
];

// JavaScript files in order
const JS_FILES = [
  'config.js',
  'api.js',
  'utils.js',
  'clock.js',
  'auth.js',
  'modal.js',
  'progress.js',
  'mobile.js',
  'pwa.js',
  'main.js'
];

/**
 * Read and combine CSS files
 */
function combineCSS() {
  console.log('📦 Combining CSS files...');
  
  const cssContent = CSS_FILES.map(file => {
    const filePath = path.join(SRC_DIR, 'css', file);
    const content = fs.readFileSync(filePath, 'utf8');
    return `/* ${file} */\n${content}`;
  }).join('\n\n');
  
  console.log(`   ✅ Combined ${CSS_FILES.length} CSS files`);
  return cssContent;
}

/**
 * Read and combine JavaScript files
 */
function combineJS() {
  console.log('📦 Combining JavaScript files...');
  
  const jsContent = JS_FILES.map(file => {
    const filePath = path.join(SRC_DIR, 'js', file);
    const content = fs.readFileSync(filePath, 'utf8');
    return `// ${file}\n${content}`;
  }).join('\n\n');
  
  console.log(`   ✅ Combined ${JS_FILES.length} JavaScript files`);
  return jsContent;
}

/**
 * Build the final HTML file
 */
function build() {
  console.log('🔨 Building Packet Module...\n');
  
  try {
    // Read HTML template
    console.log('📄 Reading HTML template...');
    let html = fs.readFileSync(HTML_TEMPLATE, 'utf8');
    
    // Combine CSS
    const css = combineCSS();
    
    // Combine JavaScript
    const js = combineJS();
    
    // Inject CSS
    console.log('💉 Injecting CSS into HTML...');
    html = html.replace(
      '<!-- CSS will be injected here by build script -->',
      `<style>\n${css}\n  </style>`
    );
    
    // Inject JavaScript
    console.log('💉 Injecting JavaScript into HTML...');
    html = html.replace(
      '<!-- JavaScript will be injected here by build script -->',
      `<script>\n${js}\n  </script>`
    );
    
    // Ensure public directory exists
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    
    // Write output file
    console.log('💾 Writing output file...');
    fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
    
    // Calculate file size
    const stats = fs.statSync(OUTPUT_FILE);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    
    console.log('\n✨ Build complete!');
    console.log(`   📁 Output: ${OUTPUT_FILE}`);
    console.log(`   📊 Size: ${fileSizeInKB} KB`);
    console.log(`   🎉 Ready for deployment to GitHub Pages!\n`);
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build
build();
