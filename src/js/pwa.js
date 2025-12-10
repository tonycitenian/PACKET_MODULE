/**
 * PWA Installation Handler
 * Shows manual install button when PWA is installable
 */

let deferredPrompt = null;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  const installBtn = document.getElementById('installPWABtn');
  if (installBtn) {
    installBtn.style.display = 'inline-block';
  }
});

// Handle install button click
function installPWA() {
  const installBtn = document.getElementById('installPWABtn');
  
  if (!deferredPrompt) {
    showNotice('App is already installed or not installable', 'info');
    return;
  }
  
  // Show install prompt
  deferredPrompt.prompt();
  
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted install');
      showNotice('App installed successfully! 🎉', 'success');
    } else {
      console.log('[PWA] User dismissed install');
    }
    
    deferredPrompt = null;
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  });
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
}

// Hide install button when app is already installed
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed');
  const installBtn = document.getElementById('installPWABtn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
  deferredPrompt = null;
});
