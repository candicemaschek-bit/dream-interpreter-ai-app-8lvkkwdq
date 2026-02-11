import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { isOnline, setupOnlineListeners } from '../utils/offlineStorage';
import { toast } from 'sonner';

export function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const cleanup = setupOnlineListeners(
      () => {
        setOnline(true);
        setShowIndicator(true);
        toast.success('Back online! Syncing your data...');
        
        // Hide indicator after 3 seconds
        setTimeout(() => setShowIndicator(false), 3000);
      },
      () => {
        setOnline(false);
        setShowIndicator(true);
        toast.warning('You are offline. Changes will be saved locally.');
      }
    );

    return cleanup;
  }, []);

  // Don't show if online and indicator should be hidden
  if (online && !showIndicator) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        showIndicator ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
          online
            ? 'bg-green-500/90 text-white'
            : 'bg-orange-500/90 text-white'
        }`}
      >
        {online ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Back Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline Mode</span>
          </>
        )}
      </div>
    </div>
  );
}
