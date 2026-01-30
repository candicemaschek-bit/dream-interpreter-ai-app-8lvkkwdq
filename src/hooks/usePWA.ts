import { useState, useEffect } from 'react';
import {
  isAppInstalled,
  canInstallApp,
  showInstallPrompt,
  requestNotificationPermission,
  checkForUpdates
} from '../utils/pwaInstaller';
import { isOnline, setupOnlineListeners, getSyncQueue } from '../utils/offlineStorage';

export interface PWAState {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  hasPendingSync: boolean;
  notificationPermission: NotificationPermission;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: isAppInstalled(),
    canInstall: canInstallApp(),
    isOnline: isOnline(),
    hasPendingSync: false,
    notificationPermission: 'default'
  });

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setState(prev => ({
        ...prev,
        notificationPermission: Notification.permission
      }));
    }

    // Check for pending sync items
    getSyncQueue().then(queue => {
      setState(prev => ({
        ...prev,
        hasPendingSync: queue.length > 0
      }));
    });

    // Listen for online/offline events
    const cleanup = setupOnlineListeners(
      () => {
        setState(prev => ({ ...prev, isOnline: true }));
        // Check for updates when coming online
        checkForUpdates();
      },
      () => {
        setState(prev => ({ ...prev, isOnline: false }));
      }
    );

    // Check if install prompt becomes available
    const handleBeforeInstallPrompt = () => {
      setState(prev => ({ ...prev, canInstall: true }));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      cleanup();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setState(prev => ({ ...prev, isInstalled: true, canInstall: false }));
    }
    return installed;
  };

  const enableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setState(prev => ({ ...prev, notificationPermission: permission }));
    return permission === 'granted';
  };

  return {
    ...state,
    install,
    enableNotifications
  };
}
