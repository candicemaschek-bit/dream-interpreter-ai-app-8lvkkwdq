import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Download, X } from 'lucide-react';
import { showInstallPrompt, canInstallApp, isAppInstalled } from '../utils/pwaInstaller';

const PWA_DISMISSED_KEY = 'dreamcatcher-pwa-dismissed';
const PWA_DISMISSED_COUNT_KEY = 'dreamcatcher-pwa-dismiss-count';
const MAX_DISMISSALS = 3; // Show again after 3 dismissals
const PWA_PROMPT_SHOWN_KEY = 'dreamcatcher-pwa-shown-count';

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('[PWA] PWAInstallPrompt component mounted');
    
    // Check if app is already installed
    const installed = isAppInstalled();
    setIsInstalled(installed);
    
    if (installed) {
      console.log('[PWA] ✅ App already installed, not showing prompt');
      setDebugInfo('App already installed');
      return;
    }

    // Check if user has permanently dismissed (after multiple dismissals)
    const dismissCount = parseInt(localStorage.getItem(PWA_DISMISSED_COUNT_KEY) || '0');
    const lastDismissed = localStorage.getItem(PWA_DISMISSED_KEY);
    
    if (dismissCount >= MAX_DISMISSALS) {
      console.log('[PWA] ⚠️ Prompt dismissed max times, respecting user preference');
      setDebugInfo('Dismissed too many times');
      return;
    }
    
    // If dismissed today, don't show again
    if (lastDismissed) {
      const lastDismissedDate = new Date(lastDismissed);
      const today = new Date();
      if (lastDismissedDate.toDateString() === today.toDateString()) {
        console.log('[PWA] ⚠️ Already dismissed today, will try again tomorrow');
        setDebugInfo('Dismissed today already');
        return;
      }
    }

    let eventListenerAdded = false;
    let pollTimerId: NodeJS.Timeout | null = null;
    let cleanupTimerId: NodeJS.Timeout | null = null;
    let showPromptTimerId: NodeJS.Timeout | null = null;

    // Listen for PWA installable event
    const handleInstallable = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[PWA] 📢 Received installable event', customEvent.detail);
      setDebugInfo('Event received, showing in 2s');
      
      // Show after 2 seconds to let app settle
      showPromptTimerId = setTimeout(() => {
        if (!isAppInstalled() && canInstallApp()) {
          console.log('[PWA] 🎉 Showing install prompt');
          setShowPrompt(true);
          setDebugInfo('Prompt shown');
          
          // Track how many times we've shown this prompt
          const shownCount = parseInt(localStorage.getItem(PWA_PROMPT_SHOWN_KEY) || '0');
          localStorage.setItem(PWA_PROMPT_SHOWN_KEY, (shownCount + 1).toString());
        } else {
          console.log('[PWA] ⚠️ Cannot install - canInstall:', canInstallApp(), 'isInstalled:', isAppInstalled());
          setDebugInfo('Cannot show prompt');
        }
      }, 2000);
    };
    
    window.addEventListener('pwa-installable', handleInstallable);
    eventListenerAdded = true;
    console.log('[PWA] 👂 Registered pwa-installable listener');
    
    // Fallback: Poll for install prompt availability with shorter interval
    console.log('[PWA] 🔍 Starting poll for canInstallApp');
    let pollCount = 0;
    const maxPolls = 40; // 40 * 250ms = 10 seconds
    
    pollTimerId = setInterval(() => {
      pollCount++;
      if (canInstallApp()) {
        console.log(`[PWA] ✅ Install prompt available (poll #${pollCount})!`);
        setDebugInfo(`Available after ${pollCount * 250}ms`);
        
        if (pollTimerId) {
          clearInterval(pollTimerId);
          pollTimerId = null;
        }
        
        // Show after 2 seconds
        showPromptTimerId = setTimeout(() => {
          if (!isAppInstalled() && canInstallApp()) {
            console.log('[PWA] 🎉 Showing install prompt (via polling)');
            setShowPrompt(true);
            setDebugInfo('Prompt shown');
            
            // Track how many times we've shown this prompt
            const shownCount = parseInt(localStorage.getItem(PWA_PROMPT_SHOWN_KEY) || '0');
            localStorage.setItem(PWA_PROMPT_SHOWN_KEY, (shownCount + 1).toString());
          }
        }, 2000);
      } else if (pollCount >= maxPolls) {
        console.log(`[PWA] ⚠️ Install prompt not available after ${maxPolls} polls (${maxPolls * 250}ms)`);
        setDebugInfo('Prompt not available');
        if (pollTimerId) {
          clearInterval(pollTimerId);
          pollTimerId = null;
        }
      }
    }, 250); // Check every 250ms (more responsive)

    // Cleanup timer
    cleanupTimerId = setTimeout(() => {
      if (pollTimerId) {
        clearInterval(pollTimerId);
        pollTimerId = null;
      }
    }, 10000);

    return () => {
      console.log('[PWA] PWAInstallPrompt cleanup');
      if (eventListenerAdded) {
        window.removeEventListener('pwa-installable', handleInstallable);
      }
      if (pollTimerId) {
        clearInterval(pollTimerId);
      }
      if (cleanupTimerId) {
        clearTimeout(cleanupTimerId);
      }
      if (showPromptTimerId) {
        clearTimeout(showPromptTimerId);
      }
    };
  }, []);

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setShowPrompt(false);
      setIsInstalled(true);
      // Clear dismiss count on successful install
      localStorage.removeItem(PWA_DISMISSED_KEY);
      localStorage.removeItem(PWA_DISMISSED_COUNT_KEY);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    // Track dismissal count
    const currentCount = parseInt(localStorage.getItem(PWA_DISMISSED_COUNT_KEY) || '0');
    const newCount = currentCount + 1;
    
    localStorage.setItem(PWA_DISMISSED_KEY, new Date().toISOString());
    localStorage.setItem(PWA_DISMISSED_COUNT_KEY, newCount.toString());
    
    console.log(`[PWA] Prompt dismissed (${newCount}/${MAX_DISMISSALS})`);
    
    if (newCount >= MAX_DISMISSALS) {
      console.log('[PWA] Max dismissals reached, will not show prompt again');
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Show prompt or debug info
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      {showPrompt ? (
        <div className="max-w-96 ml-auto mr-auto md:ml-0 md:mr-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border-primary/30 shadow-2xl relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/20 p-3 flex-shrink-0">
                <Download className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold mb-1 text-foreground">Install Dreamcatcher AI</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Add to your home screen for quick access and offline use
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="flex-1"
                  >
                    Install App
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                  >
                    Not Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        // Dev debug info - only show in development or if explicitly enabled
        process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="max-w-96 ml-auto mr-auto md:ml-0 md:mr-4">
            <Card className="p-3 bg-slate-900/90 border-slate-700 text-slate-100 text-xs">
              <div className="flex justify-between items-center">
                <span>[PWA Debug] {debugInfo}</span>
                <button
                  onClick={() => setDebugInfo('')}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </Card>
          </div>
        )
      )}
    </div>
  );
}
