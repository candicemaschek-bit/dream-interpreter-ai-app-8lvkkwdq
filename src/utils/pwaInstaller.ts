// PWA Installation and Service Worker Management

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isListenerAttached = false;

// Capture install prompt - must be called as early as possible
export function captureInstallPrompt(): void {
  // Prevent duplicate listeners
  if (isListenerAttached) {
    console.log('[PWA] beforeinstallprompt listener already attached');
    return;
  }
  
  isListenerAttached = true;
  console.log('[PWA] Attaching beforeinstallprompt listener');
  
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    console.log('[PWA] ✅ beforeinstallprompt event FIRED');
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] ✅ Install prompt captured and deferred');
    
    // Dispatch custom event to notify components
    const event = new CustomEvent('pwa-installable', { detail: { promptAvailable: true } });
    window.dispatchEvent(event);
    console.log('[PWA] ✅ Dispatched pwa-installable event');
  });
  
  // Log if already in standalone mode
  if (isAppInstalled()) {
    console.log('[PWA] ℹ App is already installed (running in standalone mode)');
  }
  
  console.log('[PWA] ℹ Listener attached. Waiting for beforeinstallprompt event...');
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    // Proactively check for SW updates on load (helps avoid stale cached bundles)
    try {
      await registration.update();
      console.log('[PWA] Checked for updates');
    } catch (error) {
      console.warn('[PWA] Update check failed:', error);
    }

    // Auto-reload once when a new SW takes control (prevents users getting stuck on old routes)
    let hasRefreshed = false;
    let hasPromptedForUpdate = false;

    const promptForUpdate = (worker: ServiceWorker | null) => {
      if (
        hasPromptedForUpdate ||
        !worker ||
        !navigator.serviceWorker.controller
      ) {
        return;
      }

      hasPromptedForUpdate = true;
      console.log('[PWA] New service worker waiting, prompting for reload');
      const shouldReload = window.confirm(
        'Dreamcatcher AI has a fresh update. Reload to apply it now?'
      );

      if (shouldReload) {
        console.log('[PWA] Reload approved, telling service worker to skip waiting');
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasRefreshed) return;
      hasRefreshed = true;
      window.location.reload();
    });

    if (registration.waiting) {
      promptForUpdate(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            promptForUpdate(newWorker);
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

// Show install prompt
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User ${outcome} the install prompt`);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt error:', error);
    return false;
  }
}

// Check if app is installed
export function isAppInstalled(): boolean {
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  return isStandalone || (isIOS && isIOSStandalone);
}

// Check if install prompt is available
export function canInstallApp(): boolean {
  return deferredPrompt !== null;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('[PWA] Notification permission error:', error);
    return 'denied';
  }
}

// Send local notification
export function sendLocalNotification(title: string, body: string): void {
  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg'
    });
  } catch (error) {
    console.error('[PWA] Notification error:', error);
  }
}

// Check for updates
export async function checkForUpdates(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('[PWA] Checked for updates');
    }
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
  }
}

// Unregister service worker (for development)
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('[PWA] Service worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Unregister failed:', error);
    return false;
  }
}
