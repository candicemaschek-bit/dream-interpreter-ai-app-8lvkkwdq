import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

/**
 * Represents a queued API call that should retry after successful reauth
 */
interface RetryableApiCall {
  id: string
  apiCall: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  timestamp: number
}

interface ReauthRetryContextType {
  queueApiCall: <T>(apiCall: () => Promise<T>) => Promise<T>
  retryPendingCalls: () => Promise<void>
  clearQueue: () => void
  hasPendingCalls: boolean
}

const ReauthRetryContext = createContext<ReauthRetryContextType | undefined>(undefined)

/**
 * Provider component that manages the retry queue for API calls
 * that need to be retried after successful reauth
 */
export function ReauthRetryProvider({ children }: { children: ReactNode }) {
  const [retryQueue, setRetryQueue] = useState<RetryableApiCall[]>([])

  /**
   * Queue an API call to be retried after successful reauth
   * Returns a promise that resolves/rejects when the retry executes
   */
  const queueApiCall = useCallback(<T,>(apiCall: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const id = `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const retryItem: RetryableApiCall = {
        id,
        apiCall,
        resolve,
        reject,
        timestamp: Date.now()
      }

      setRetryQueue(prev => [...prev, retryItem])
      console.log('API call queued for retry:', id)
    })
  }, [])

  /**
   * Retry all pending API calls after successful reauth
   * Called by InlineReauthDialog on successful login
   */
  const retryPendingCalls = useCallback(async () => {
    if (retryQueue.length === 0) {
      console.log('No pending API calls to retry')
      return
    }

    console.log(`Retrying ${retryQueue.length} pending API calls...`)
    
    const callsToRetry = [...retryQueue]
    setRetryQueue([]) // Clear queue immediately to prevent duplicate retries

    // Execute all queued API calls
    const results = await Promise.allSettled(
      callsToRetry.map(async (item) => {
        try {
          console.log('Retrying API call:', item.id)
          const result = await item.apiCall()
          item.resolve(result)
          return { success: true, id: item.id }
        } catch (error) {
          console.error('Retry failed for:', item.id, error)
          item.reject(error)
          return { success: false, id: item.id, error }
        }
      })
    )

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failureCount = results.length - successCount

    console.log(`Retry complete: ${successCount} succeeded, ${failureCount} failed`)
  }, [retryQueue])

  /**
   * Clear the retry queue without executing
   * Used when user cancels reauth
   */
  const clearQueue = useCallback(() => {
    retryQueue.forEach(item => {
      item.reject(new Error('Reauth cancelled by user'))
    })
    setRetryQueue([])
    console.log('Retry queue cleared')
  }, [retryQueue])

  const hasPendingCalls = retryQueue.length > 0

  return (
    <ReauthRetryContext.Provider
      value={{
        queueApiCall,
        retryPendingCalls,
        clearQueue,
        hasPendingCalls
      }}
    >
      {children}
    </ReauthRetryContext.Provider>
  )
}

// Configuration constants for reauth retry system
export const REAUTH_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
  queueTimeoutMs: 60000
}

/**
 * Hook to access the reauth retry context
 * Must be used within a ReauthRetryProvider
 */
export function useReauthRetry() {
  const context = useContext(ReauthRetryContext)
  if (!context) {
    throw new Error('useReauthRetry must be used within a ReauthRetryProvider')
  }
  return context
}
