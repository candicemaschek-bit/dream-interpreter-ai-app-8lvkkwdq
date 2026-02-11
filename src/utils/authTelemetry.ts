/**
 * Authentication Telemetry System
 * Tracks token failures, reauth attempts, and authentication events
 * for monitoring and debugging authentication issues
 */

import { blink } from '../blink/client'

export interface TokenFailureEvent {
  id: string
  userId?: string
  userEmail?: string
  errorType: 'token_refresh_failed' | 'token_validation_failed' | 'auth_expired' | 'api_401_error' | 'token_empty' | 'token_empty_no_cache' | 'token_invalid_format' | 'token_invalid_format_no_cache' | 'sdk_error' | 'sdk_error_no_cache' | 'network_error' | 'network_error_no_cache'
  errorMessage: string
  context: string // Where the error occurred (e.g., 'video_generation', 'dream_fetch')
  attemptedRetries: number
  tokenAge?: number // Time since last token refresh in ms
  timestamp: string
  userAgent: string
  url: string
}

export interface ReauthAttemptEvent {
  id: string
  userId?: string
  userEmail?: string
  method: 'password' | 'google' | 'apple' | 'github' | 'microsoft' | 'auto_retry'
  success: boolean
  errorMessage?: string
  durationMs: number
  retriedCalls?: number
  timestamp: string
}

export interface TokenRefreshEvent {
  id: string
  userId?: string
  success: boolean
  errorMessage?: string
  expiresInMinutes?: number
  forceRefresh: boolean
  cached: boolean
  timestamp: string
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Log token failure event to database for telemetry
 */
export async function logTokenFailure(data: {
  userId?: string
  userEmail?: string
  errorType: TokenFailureEvent['errorType']
  errorMessage: string
  context: string
  attemptedRetries?: number
  tokenAge?: number
}): Promise<void> {
  const event: TokenFailureEvent = {
    id: generateEventId(),
    userId: data.userId,
    userEmail: data.userEmail,
    errorType: data.errorType,
    errorMessage: data.errorMessage,
    context: data.context,
    attemptedRetries: data.attemptedRetries || 0,
    tokenAge: data.tokenAge,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  // Log to console for visibility - use warn for transient issues, error for critical ones
  const isTransient = event.errorType === 'token_empty' || 
    event.errorType === 'network_error' || 
    event.errorType === 'network_error_no_cache' ||
    event.errorType === 'token_empty_no_cache' ||
    event.errorMessage?.includes('Failed to fetch')
  const logFn = isTransient ? console.warn : console.error
  logFn(`${isTransient ? '⚠️' : '🔴'} [Auth Telemetry] Token Failure:`, {
    type: event.errorType,
    context: event.context,
    message: event.errorMessage,
    userId: event.userId,
    retries: event.attemptedRetries
  })

  // Store in database for analytics
  try {
    // Write to auth_telemetry table
    await blink.db.authTelemetry.create({
      userId: event.userId || 'anonymous',
      eventType: 'token_failure',
      context: event.context,
      metadata: JSON.stringify({
        errorType: event.errorType,
        errorMessage: event.errorMessage,
        attemptedRetries: event.attemptedRetries,
        tokenAge: event.tokenAge,
        userAgent: event.userAgent,
        url: event.url
      }),
      createdAt: event.timestamp
    })
    
    // Also log to analytics as backup
    await blink.analytics.log('auth_token_failure', {
      event_id: event.id,
      user_id: event.userId || 'anonymous',
      user_email: event.userEmail || 'unknown',
      error_type: event.errorType,
      error_message: event.errorMessage,
      context: event.context,
      attempted_retries: event.attemptedRetries,
      token_age_ms: event.tokenAge,
      user_agent: event.userAgent,
      page_url: event.url
    })
    
    console.log('✅ [Auth Telemetry] Token failure logged to analytics')
  } catch (error) {
    // Don't throw - telemetry should never break the app
    console.warn('⚠️ [Auth Telemetry] Failed to log token failure:', error)
  }
}

/**
 * Log reauth attempt event
 */
export async function logReauthAttempt(data: {
  userId?: string
  userEmail?: string
  method: ReauthAttemptEvent['method']
  success: boolean
  errorMessage?: string
  durationMs: number
  retriedCalls?: number
}): Promise<void> {
  const event: ReauthAttemptEvent = {
    id: generateEventId(),
    userId: data.userId,
    userEmail: data.userEmail,
    method: data.method,
    success: data.success,
    errorMessage: data.errorMessage,
    durationMs: data.durationMs,
    retriedCalls: data.retriedCalls,
    timestamp: new Date().toISOString()
  }

  // Log to console
  console.log(`${data.success ? '✅' : '❌'} [Auth Telemetry] Reauth Attempt:`, {
    method: event.method,
    success: event.success,
    duration: `${event.durationMs}ms`,
    retriedCalls: event.retriedCalls,
    userId: event.userId
  })

  // Store in database
  try {
    // Write to auth_telemetry table
    await blink.db.authTelemetry.create({
      userId: event.userId || 'anonymous',
      eventType: data.success ? 'reauth_success' : 'reauth_attempt',
      context: 'reauth_flow',
      metadata: JSON.stringify({
        method: event.method,
        success: event.success,
        errorMessage: event.errorMessage,
        durationMs: event.durationMs,
        retriedCalls: event.retriedCalls
      }),
      createdAt: event.timestamp
    })

    await blink.analytics.log('auth_reauth_attempt', {
      event_id: event.id,
      user_id: event.userId || 'anonymous',
      user_email: event.userEmail || 'unknown',
      method: event.method,
      success: event.success,
      error_message: event.errorMessage || '',
      duration_ms: event.durationMs,
      retried_calls: event.retriedCalls || 0
    })
    
    console.log('✅ [Auth Telemetry] Reauth attempt logged to analytics')
  } catch (error) {
    console.warn('⚠️ [Auth Telemetry] Failed to log reauth attempt:', error)
  }
}

/**
 * Log token refresh event
 */
export async function logTokenRefresh(data: {
  userId?: string
  success: boolean
  errorMessage?: string
  expiresInMinutes?: number
  forceRefresh: boolean
  cached: boolean
}): Promise<void> {
  const event: TokenRefreshEvent = {
    id: generateEventId(),
    userId: data.userId,
    success: data.success,
    errorMessage: data.errorMessage,
    expiresInMinutes: data.expiresInMinutes,
    forceRefresh: data.forceRefresh,
    cached: data.cached,
    timestamp: new Date().toISOString()
  }

  // Log to console (only log failures or force refreshes to reduce noise)
  if (!data.success || data.forceRefresh) {
    console.log(`${data.success ? '🔄' : '❌'} [Auth Telemetry] Token Refresh:`, {
      success: event.success,
      forceRefresh: event.forceRefresh,
      cached: event.cached,
      expiresIn: event.expiresInMinutes ? `${event.expiresInMinutes}min` : 'unknown',
      userId: event.userId
    })
  }

  // Store in database (only log failures or force refreshes)
  if (!data.success || data.forceRefresh) {
    try {
      // Write to auth_telemetry table
      await blink.db.authTelemetry.create({
        userId: event.userId || 'anonymous',
        eventType: 'token_refresh',
        context: 'refresh_flow',
        metadata: JSON.stringify({
          success: event.success,
          errorMessage: event.errorMessage,
          expiresInMinutes: event.expiresInMinutes,
          forceRefresh: event.forceRefresh,
          cached: event.cached
        }),
        createdAt: event.timestamp
      })

      await blink.analytics.log('auth_token_refresh', {
        event_id: event.id,
        user_id: event.userId || 'anonymous',
        success: event.success,
        error_message: event.errorMessage || '',
        expires_in_minutes: event.expiresInMinutes || 0,
        force_refresh: event.forceRefresh,
        cached: event.cached
      })
    } catch (error) {
      console.warn('⚠️ [Auth Telemetry] Failed to log token refresh:', error)
    }
  }
}

/**
 * Log session expiration event
 */
export async function logSessionExpiration(data: {
  userId?: string
  userEmail?: string
  lastActivityTimestamp?: number
  context: string
}): Promise<void> {
  const idleTimeMs = data.lastActivityTimestamp 
    ? Date.now() - data.lastActivityTimestamp 
    : undefined

  console.warn('⏰ [Auth Telemetry] Session Expired:', {
    context: data.context,
    userId: data.userId,
    idleTime: idleTimeMs ? `${Math.round(idleTimeMs / 1000 / 60)}min` : 'unknown'
  })

  try {
    // Write to auth_telemetry table
    await blink.db.authTelemetry.create({
      userId: data.userId || 'anonymous',
      eventType: 'session_expired',
      context: data.context,
      metadata: JSON.stringify({
        userEmail: data.userEmail,
        idleTimeMs: idleTimeMs,
        idleTimeMinutes: idleTimeMs ? Math.round(idleTimeMs / 1000 / 60) : 0
      }),
      createdAt: new Date().toISOString()
    })

    await blink.analytics.log('auth_session_expiration', {
      user_id: data.userId || 'anonymous',
      user_email: data.userEmail || 'unknown',
      context: data.context,
      idle_time_ms: idleTimeMs || 0,
      idle_time_minutes: idleTimeMs ? Math.round(idleTimeMs / 1000 / 60) : 0
    })
  } catch (error) {
    console.warn('⚠️ [Auth Telemetry] Failed to log session expiration:', error)
  }
}

/**
 * Get telemetry summary for debugging
 */
export function getTelemetrySummary(): {
  analyticsEnabled: boolean
  userAgent: string
  currentUrl: string
} {
  return {
    analyticsEnabled: blink.analytics.isEnabled(),
    userAgent: navigator.userAgent,
    currentUrl: window.location.href
  }
}