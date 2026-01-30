import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { useReauthRetry } from '../contexts/ReauthRetryContext'
import { clearTokenCache } from '../utils/authTokenManager'

interface ReauthState {
  needsReauth: boolean
  userEmail?: string
  lastActivity: number
}

/**
 * Hook to detect token expiration and trigger inline re-authentication
 * Monitors auth state changes and API errors to determine when reauth is needed
 * Integrated with retry mechanism to automatically retry failed API calls after reauth
 */
export function useInlineReauth() {
  const [reauthState, setReauthState] = useState<ReauthState>({
    needsReauth: false,
    lastActivity: Date.now()
  })

  const { retryPendingCalls, clearQueue } = useReauthRetry()

  // Track auth state changes
  useEffect(() => {
    let hasHadUser = false // Track if we've ever had an authenticated user
    
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (state.user) {
        // User is authenticated - clear reauth state
        hasHadUser = true
        setReauthState({
          needsReauth: false,
          userEmail: state.user.email,
          lastActivity: Date.now()
        })
      } else if (!state.user && !state.isLoading && hasHadUser) {
        // User was authenticated but is now logged out - trigger reauth
        // This prevents triggering reauth on initial page load when user was never logged in
        setReauthState({
          needsReauth: true,
          userEmail: undefined,
          lastActivity: Date.now()
        })
      }
      // If !state.user && !hasHadUser, this is initial page load - do nothing
    })

    return unsubscribe
  }, [])

  // Manual trigger for reauth (can be called when API returns 401)
  const triggerReauth = useCallback((email?: string) => {
    setReauthState({
      needsReauth: true,
      userEmail: email,
      lastActivity: Date.now()
    })
  }, [])

  // Reset reauth state after successful login and retry pending calls
  const clearReauth = useCallback(async () => {
    setReauthState({
      needsReauth: false,
      userEmail: undefined,
      lastActivity: Date.now()
    })

    // Automatically retry all pending API calls
    await retryPendingCalls()
  }, [retryPendingCalls])

  // Cancel reauth and clear retry queue
  const cancelReauth = useCallback(() => {
    setReauthState({
      needsReauth: false,
      userEmail: undefined,
      lastActivity: Date.now()
    })
    
    // Clear retry queue without executing
    clearQueue()
  }, [clearQueue])

  // Check if token is still valid
  const checkTokenValidity = useCallback(async () => {
    try {
      const raw = await blink.auth.getValidToken() as any
      const token = typeof raw === 'string' ? raw : (raw?.accessToken || raw?.token || raw?.jwt)
      return typeof token === 'string' && token.trim().length > 0
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }, [])

  return {
    needsReauth: reauthState.needsReauth,
    userEmail: reauthState.userEmail,
    triggerReauth,
    clearReauth,
    cancelReauth,
    checkTokenValidity
  }
}

/**
 * Hook to wrap API calls with automatic reauth detection and retry
 * Detects 401 errors, queues the API call for retry, and triggers inline reauth flow
 */
export function useApiWithReauth() {
  const { triggerReauth } = useInlineReauth()
  const { queueApiCall } = useReauthRetry()

  const apiCallWithReauth = useCallback(
    async <T>(apiCall: () => Promise<T>): Promise<T> => {
      try {
        return await apiCall()
      } catch (error: any) {
        // Check if error is related to authentication
        const message = String(error?.message || '')
        const code = String(error?.code || '')
        const lower = message.toLowerCase()
        const lowerCode = code.toLowerCase()

        // First, check if this is a network/service unavailable error
        // These should NOT trigger reauth - they are temporary server issues
        const isNetworkError =
          lower.includes('service_unavailable') ||
          lower.includes('503') ||
          lower.includes('temporarily unavailable') ||
          lower.includes('dns error') ||
          lower.includes('network error') ||
          lower.includes('enotfound') ||
          lower.includes('econnrefused') ||
          lower.includes('etimedout') ||
          lowerCode.includes('service_unavailable')
        
        if (isNetworkError) {
          console.log('🌐 Network/service error detected, NOT triggering reauth:', message)
          throw error // Re-throw so UI can show appropriate message
        }

        // Special case: AUTHENTICATION_FAILED_AFTER_RETRY means we already tried twice
        // with fresh tokens and both failed - MUST trigger full reauth immediately
        const isDoubleAuthFailure = message === 'AUTHENTICATION_FAILED_AFTER_RETRY'

        const isAuthError =
          isDoubleAuthFailure ||
          lower.includes('401') ||
          lower.includes('unauthorized') ||
          lower.includes('not authenticated') ||
          lower.includes('authentication required') ||
          lower.includes('no access-token') ||
          lower.includes('session expired') ||
          lower.includes('token expired') ||
          lower.includes('auth_failed') ||
          lower.includes('auth_header_missing') ||
          lower.includes('jwt') ||
          lowerCode.includes('auth') ||
          lowerCode.includes('401')

        if (isAuthError) {
          console.log('🔐 Authentication error detected, clearing token cache:', message)
          
          // Clear the token cache to force fresh token on retry
          clearTokenCache()
          
          // If we've already tried twice with fresh tokens and both failed,
          // the session is definitely invalid - trigger immediate reauth
          if (isDoubleAuthFailure) {
            console.log('❌ Double auth failure detected - session is invalid, triggering immediate reauth')
            triggerReauth()
            // Queue the API call for retry after successful reauth
            return await queueApiCall(apiCall)
          }
          
          // For other auth errors, verify user is still authenticated
          // Wait a moment to let any background refresh complete
          await new Promise(resolve => setTimeout(resolve, 500))
          
          try {
            const user = await blink.auth.me()
            if (!user) {
              console.log('❌ User not authenticated, triggering reauth flow')
              triggerReauth()
              // Queue the API call for automatic retry after successful reauth
              return await queueApiCall(apiCall)
            } else {
              console.log('✅ User still authenticated, will retry with fresh token')
              // Try the API call again with a fresh token before queuing
              // The next call to executeWithFreshToken should get a new token
              try {
                return await apiCall()
              } catch (retryError: any) {
                const retryMessage = String(retryError?.message || '')
                if (retryMessage === 'AUTHENTICATION_FAILED_AFTER_RETRY' || 
                    retryMessage.toLowerCase().includes('401') ||
                    retryMessage.toLowerCase().includes('not authenticated')) {
                  console.log('❌ Retry also failed with auth error, triggering reauth')
                  triggerReauth()
                  return await queueApiCall(apiCall)
                }
                throw retryError
              }
            }
          } catch (checkError) {
            console.log('❌ Auth check failed, triggering reauth flow')
            triggerReauth()
            return await queueApiCall(apiCall)
          }
        }
        
        // Re-throw non-auth errors
        throw error
      }
    },
    [triggerReauth, queueApiCall]
  )

  return { apiCallWithReauth }
}

/**
 * Hook to monitor session activity and detect potential token expiration
 * Useful for proactively refreshing tokens before they expire
 */
export function useSessionMonitor(checkIntervalMs: number = 60000) {
  const [sessionValid, setSessionValid] = useState(true)
  const { checkTokenValidity, triggerReauth } = useInlineReauth()

  useEffect(() => {
    // Check token validity periodically
    const interval = setInterval(async () => {
      const isValid = await checkTokenValidity()
      setSessionValid(isValid)

      if (!isValid) {
        try {
          const user = await blink.auth.me()
          triggerReauth(user?.email)
        } catch {
          triggerReauth()
        }
      }
    }, checkIntervalMs)

    return () => clearInterval(interval)
  }, [checkIntervalMs, checkTokenValidity, triggerReauth])

  return { sessionValid }
}