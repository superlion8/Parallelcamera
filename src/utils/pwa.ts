// PWA utilities for service worker registration and install prompt

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// Handle PWA install prompt
let deferredPrompt: any;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('PWA install prompt available');
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
  });
}

export async function showInstallPrompt() {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to the install prompt: ${outcome}`);

  // Clear the deferred prompt variable
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

export function isInstallPromptAvailable() {
  return !!deferredPrompt;
}

// Check if app is running as PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}
