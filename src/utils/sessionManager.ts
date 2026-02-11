/**
 * SOLUTION 3: Persistent Session Manager with Sliding Expiration
 * 
 * This module provides automatic session management with:
 * - Persistent storage of authentication state
 * - Automatic token refresh before expiration
 * - Sliding expiration window (activity-based renewal)
 * - Background token refresh to prevent interruptions
 * - Session recovery after page reload
 */

import { blink } from '../blink/client'
import { clearTokenCache, getValidAuthToken } from './authTokenManager'

const SESSION_CHECK_INTERVAL = 15 * 60 * 1000 // Check every 15 minutes
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000 // Refresh if less than 10 minutes remaining
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']

interface SessionState {
  isActive: boolean
  lastActivity: number
  lastTokenRefresh: number
  refreshIntervalId?: number
  authUnsubscribe?: () => void
}

const sessionState: SessionState = {
  isActive: false,
  lastActivity: Date.now(),
  lastTokenRefresh: Date.now()
}

/**
 * Update last activity timestamp (for sliding window)
 */
function updateActivity(): void {
  sessionState.lastActivity = Date.now()
  
  // Store in localStorage for cross-tab sync
  try {
    localStorage.setItem('dreamcatcher_last_activity', sessionState.lastActivity.toString())
  } catch (error) {
    console.warn('Failed to store activity timestamp:', error)
  }
}

/**
 * Check if user has been recently active
 */
function isUserActive(): boolean {
  const now = Date.now()
  const inactivityThreshold = 30 * 60 * 1000 // 30 minutes of inactivity
  
  // Check localStorage for activity from other tabs
  try {
    const storedActivity = localStorage.getItem('dreamcatcher_last_activity')
    if (storedActivity) {
      const lastActivity = parseInt(storedActivity, 10)
      if (now - lastActivity < inactivityThreshold) {
        sessionState.lastActivity = lastActivity
        return true
      }
    }
  } catch (error) {
    console.warn('Failed to read activity timestamp:', error)
  }
  
  return (now - sessionState.lastActivity) < inactivityThreshold
}

/**
 * Proactively refresh token if approaching expiration
 * OPTIMIZATION: Cached user check to avoid redundant API calls
 */
async function refreshTokenIfNeeded(): Promise<void> {
  const now = Date.now()
  
  // OPTIMIZATION: Skip auth check if we're not active (reduces API calls)
  if (!sessionState.isActive) {
    return
  }
  
  // Check if user is active
  if (!isUserActive()) {
    console.log('⏸️ [SessionManager] User inactive, skipping token refresh')
    return
  }
  
  // Check if we recently refreshed
  if (now - sessionState.lastTokenRefresh < TOKEN_REFRESH_THRESHOLD) {
    return // Silently skip if recently refreshed
  }
  
  try {
    // Check if user is still authenticated before attempting refresh
    const user = await blink.auth.me()
    if (!user) {
      // User is not authenticated - silently skip, don't log error
      return
    }
    
    // Force token refresh
    const result = await getValidAuthToken(true)
    
    if (result.success) {
      sessionState.lastTokenRefresh = now
    }
    // Silently handle failures - getValidAuthToken already logs appropriate warnings
  } catch (error) {
    // Silently handle - network errors and auth issues are transient
    // getValidAuthToken already handles logging appropriately
  }
}

/**
 * Set up automatic token refresh interval
 */
function startTokenRefreshInterval(): void {
  if (sessionState.refreshIntervalId) {
    console.log('⚠️ [SessionManager] Refresh interval already running')
    return
  }
  
  console.log('🔄 [SessionManager] Starting automatic token refresh interval')
  
  sessionState.refreshIntervalId = window.setInterval(() => {
    refreshTokenIfNeeded()
  }, SESSION_CHECK_INTERVAL)
}

/**
 * Stop automatic token refresh interval
 */
function stopTokenRefreshInterval(): void {
  if (sessionState.refreshIntervalId) {
    console.log('⏸️ [SessionManager] Stopping automatic token refresh interval')
    clearInterval(sessionState.refreshIntervalId)
    sessionState.refreshIntervalId = undefined
  }
}

/**
 * Set up activity listeners for sliding window
 */
function setupActivityListeners(): void {
  console.log('👂 [SessionManager] Setting up activity listeners')
  
  ACTIVITY_EVENTS.forEach(eventType => {
    window.addEventListener(eventType, updateActivity, { passive: true })
  })
  
  // Also listen for visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateActivity()
      // Refresh token when tab becomes visible
      refreshTokenIfNeeded()
    }
  })
}

/**
 * Remove activity listeners
 */
function removeActivityListeners(): void {
  console.log('🔇 [SessionManager] Removing activity listeners')
  
  ACTIVITY_EVENTS.forEach(eventType => {
    window.removeEventListener(eventType, updateActivity)
  })
}

/**
 * Initialize persistent session management
 * Call this once when the app starts
 */
export function initializeSessionManager(): void {
  if (sessionState.isActive) {
    console.log('⚠️ [SessionManager] Already initialized')
    return
  }
  
  console.log('🚀 [SessionManager] Initializing persistent session manager')
  
  sessionState.isActive = true
  sessionState.lastActivity = Date.now()
  // Set lastTokenRefresh to now so the first check waits the full interval
  // This prevents an immediate token refresh race condition with SDK initialization
  sessionState.lastTokenRefresh = Date.now()
  
  // Set up activity tracking
  setupActivityListeners()
  
  // Start automatic token refresh (delayed start to let SDK auth settle)
  // The first refresh will only happen after SESSION_CHECK_INTERVAL
  startTokenRefreshInterval()
  
  // Listen for auth state changes
  const authUnsubscribe = blink.auth.onAuthStateChanged((state) => {
    if (!state.user && sessionState.isActive) {
      console.log('👋 [SessionManager] User signed out detected')
      // Don't call stopSessionManager here to avoid recursion
      // Just mark as inactive
      sessionState.isActive = false
    } else if (state.user) {
      console.log('👤 [SessionManager] User signed in:', state.user.id)
      updateActivity()
      sessionState.lastTokenRefresh = Date.now()
    }
  })
  
  // Store unsubscribe function
  sessionState.authUnsubscribe = authUnsubscribe
  
  // Listen for storage events (cross-tab sync)
  window.addEventListener('storage', (event) => {
    if (event.key === 'dreamcatcher_last_activity') {
      const newActivity = event.newValue ? parseInt(event.newValue, 10) : Date.now()
      console.log('🔄 [SessionManager] Activity synced from another tab')
      sessionState.lastActivity = newActivity
    }
  })
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    updateActivity() // Save final activity timestamp
  })
  
  console.log('✅ [SessionManager] Persistent session manager initialized')
}

/**
 * Stop session management (call on logout)
 */
export function stopSessionManager(): void {
  console.log('🛑 [SessionManager] Stopping session manager')
  
  stopTokenRefreshInterval()
  removeActivityListeners()
  clearTokenCache()
  
  // Unsubscribe from auth state changes
  if (sessionState.authUnsubscribe) {
    sessionState.authUnsubscribe()
    sessionState.authUnsubscribe = undefined
  }
  
  // Clear session-related data from localStorage
  try {
    localStorage.removeItem('dreamcatcher_last_activity')
    console.log('🗑️ [SessionManager] Cleared localStorage session data')
  } catch (error) {
    console.warn('Failed to clear localStorage:', error)
  }
  
  sessionState.isActive = false
  sessionState.lastActivity = Date.now()
  sessionState.lastTokenRefresh = Date.now()
  
  console.log('✅ [SessionManager] Session manager stopped')
}

/**
 * Get current session state for debugging
 */
export function getSessionState(): {
  isActive: boolean
  lastActivity: Date
  lastTokenRefresh: Date
  isUserActive: boolean
  minutesSinceActivity: number
  minutesSinceRefresh: number
} {
  const now = Date.now()
  
  return {
    isActive: sessionState.isActive,
    lastActivity: new Date(sessionState.lastActivity),
    lastTokenRefresh: new Date(sessionState.lastTokenRefresh),
    isUserActive: isUserActive(),
    minutesSinceActivity: Math.round((now - sessionState.lastActivity) / 1000 / 60),
    minutesSinceRefresh: Math.round((now - sessionState.lastTokenRefresh) / 1000 / 60)
  }
}

/**
 * Manually trigger token refresh (useful for testing)
 */
export async function manualTokenRefresh(): Promise<boolean> {
  console.log('🔄 [SessionManager] Manual token refresh requested')
  
  try {
    await refreshTokenIfNeeded()
    return true
  } catch (error) {
    console.error('❌ [SessionManager] Manual refresh failed:', error)
    return false
  }
}
