/**
 * Symbolica AI Offline Indicator Component
 * Shows offline status and pending sync items
 */

import { useState, useEffect } from 'react'
import { WifiOff, CloudOff, Cloud, RefreshCw } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { toast } from 'sonner'
import {
  getUnsyncedCount,
  isOffline,
  setupOfflineListeners,
  clearSyncedData
} from '../utils/symbolicaOffline'

interface SymbolicaOfflineIndicatorProps {
  userId: string
  onSyncComplete?: () => void
  compact?: boolean
}

export function SymbolicaOfflineIndicator({
  userId,
  onSyncComplete,
  compact = false
}: SymbolicaOfflineIndicatorProps) {
  const [offline, setOffline] = useState(isOffline())
  const [unsyncedCount, setUnsyncedCount] = useState({ symbols: 0, actions: 0 })
  const [syncing, setSyncing] = useState(false)

  // Check unsynced items
  const checkUnsyncedItems = async () => {
    const count = await getUnsyncedCount()
    setUnsyncedCount(count)
  }

  // Setup offline/online listeners
  useEffect(() => {
    checkUnsyncedItems()

    const cleanup = setupOfflineListeners(
      async () => {
        setOffline(false)
        toast.success('Back online!', {
          description: 'Your Symbol Orchard data will sync automatically.'
        })
        // Auto-sync when coming back online
        await handleSync()
      },
      () => {
        setOffline(true)
        toast.warning('You\'re offline', {
          description: 'Your symbol changes will be saved locally and synced when you\'re back online.'
        })
      }
    )

    return cleanup
  }, [])

  // Sync offline data to server
  const handleSync = async () => {
    if (offline || syncing) return

    try {
      setSyncing(true)

      // Clear synced data and refresh
      await clearSyncedData()
      await checkUnsyncedItems()
      
      if (unsyncedCount.symbols === 0 && unsyncedCount.actions === 0) {
        toast.success('All data synced!')
        onSyncComplete?.()
      }
    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Sync failed. Will retry later.')
    } finally {
      setSyncing(false)
    }
  }

  const totalUnsynced = unsyncedCount.symbols + unsyncedCount.actions

  // Don't show if online and nothing to sync
  if (!offline && totalUnsynced === 0) {
    return null
  }

  // Compact badge view
  if (compact) {
    return (
      <Badge 
        variant={offline ? 'destructive' : 'secondary'}
        className={`gap-1 ${offline ? 'bg-red-500/20 text-red-500 border-red-500/30' : ''}`}
      >
        {offline ? (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        ) : (
          <>
            <Cloud className="w-3 h-3" />
            {totalUnsynced} pending
          </>
        )}
      </Badge>
    )
  }

  // Full indicator view
  return (
    <div className={`rounded-lg p-3 flex items-center justify-between ${
      offline 
        ? 'bg-red-500/10 border border-red-500/30' 
        : 'bg-yellow-500/10 border border-yellow-500/30'
    }`}>
      <div className="flex items-center gap-3">
        {offline ? (
          <WifiOff className="w-5 h-5 text-red-500" />
        ) : (
          <CloudOff className="w-5 h-5 text-yellow-500" />
        )}
        <div>
          <p className={`text-sm font-medium ${offline ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
            {offline ? 'You\'re Offline' : 'Pending Sync'}
          </p>
          <p className="text-xs text-muted-foreground">
            {offline 
              ? 'Symbol changes will be saved locally' 
              : `${totalUnsynced} items waiting to sync`
            }
          </p>
        </div>
      </div>

      {!offline && totalUnsynced > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="gap-1.5"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5" />
              Sync Now
            </>
          )}
        </Button>
      )}
    </div>
  )
}

/**
 * Compact offline status for orchard header
 */
export function SymbolicaOfflineStatusBadge() {
  const [offline, setOffline] = useState(isOffline())

  useEffect(() => {
    const cleanup = setupOfflineListeners(
      () => setOffline(false),
      () => setOffline(true)
    )
    return cleanup
  }, [])

  if (!offline) return null

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
      <WifiOff className="w-3 h-3" />
      <span>Offline Mode</span>
    </div>
  )
}
