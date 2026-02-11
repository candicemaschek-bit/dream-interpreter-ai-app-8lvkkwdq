import { blink } from '../blink/client'
import { logTokenFailure, logTokenRefresh } from './authTelemetry'

export interface TokenValidationResult {
  success: boolean
  token: string | null
  error?: string
  userId?: string
  expiresIn?: number
}

// Token cache with expiration tracking
let cachedToken: string | null = null
let tokenExpiresAt: number | null = null

/**
 * Get a valid authentication token using Blink SDK
 * 
 * This function wraps blink.auth.getValidToken() which handles:
 * - Token caching
 * - Automatic refreshing
 * - Expiration tracking
 */
export async function getValidAuthToken(
  forceRefresh: boolean = false
): Promise<TokenValidationResult> {
  try {
    // Check if we have a cached token that's still valid (with 60s buffer for safety)
    const now = Date.now()
    if (!forceRefresh && cachedToken && tokenExpiresAt && tokenExpiresAt > now + 60000) {
      console.log('✅ Using cached valid token (expires in', Math.floor((tokenExpiresAt - now) / 1000), 'seconds)')
      // Quick validation - try to get user without forcing SDK refresh
      try {
        const user = await blink.auth.me()
        if (user) {
          return {
            success: true,
            token: cachedToken,
            userId: user.id,
            expiresIn: Math.floor((tokenExpiresAt - now) / 1000)
          }
        }
      } catch (meError) {
        // If me() fails, the cached token is invalid - clear cache and get fresh token
        console.warn('⚠️ Cached token failed me() check, clearing cache and refreshing...')
        cachedToken = null
        tokenExpiresAt = null
      }
    } else if (!forceRefresh && cachedToken && tokenExpiresAt) {
      // Token exists but is close to expiration or expired
      console.log('🔄 Cached token expired or close to expiration, refreshing...')
      cachedToken = null
      tokenExpiresAt = null
    }

    // First verify user is authenticated
    const user = await blink.auth.me()
    if (!user) {
      cachedToken = null
      tokenExpiresAt = null
      return {
        success: false,
        token: null,
        error: 'Authentication required'
      }
    }

    // Clear cache if forcing refresh
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - clearing cache and getting fresh token from SDK')
      cachedToken = null
      tokenExpiresAt = null
    }

    // Get token from SDK - this should return a JWT string
    // Retry up to 3 times with backoff since SDK may not be fully initialized yet
    let rawToken: any = null
    const TOKEN_FETCH_MAX_RETRIES = 3
    
    for (let attempt = 0; attempt < TOKEN_FETCH_MAX_RETRIES; attempt++) {
      try {
        rawToken = await blink.auth.getValidToken()
      } catch (fetchError) {
        // "Failed to fetch" is a transient network error - retry with backoff
        const isNetworkError = fetchError instanceof Error && 
          (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError'))
        
        if (isNetworkError && attempt < TOKEN_FETCH_MAX_RETRIES - 1) {
          const delay = (attempt + 1) * 1000 // 1s, 2s, 3s
          console.warn(`⚠️ Token fetch network error (attempt ${attempt + 1}/${TOKEN_FETCH_MAX_RETRIES}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw fetchError // Re-throw on final attempt or non-network errors
      }
      
      // Extract token string
      let extractedToken: string | null = null
      if (typeof rawToken === 'string') {
        extractedToken = rawToken.trim()
      } else if (rawToken && typeof rawToken === 'object') {
        const tokenObj = rawToken as any
        extractedToken = tokenObj.accessToken || tokenObj.token || tokenObj.jwt || null
      }
      
      // If we got a valid token, break out of retry loop
      if (extractedToken && extractedToken !== '') {
        break
      }
      
      // Token is empty - SDK may not be ready yet, retry with backoff
      if (attempt < TOKEN_FETCH_MAX_RETRIES - 1) {
        const delay = (attempt + 1) * 1000 // 1s, 2s, 3s
        console.warn(`⚠️ Token empty from SDK (attempt ${attempt + 1}/${TOKEN_FETCH_MAX_RETRIES}), retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // SDK v2+ returns the token directly as a string
    // But handle legacy formats just in case
    let token: string | null = null
    
    if (typeof rawToken === 'string') {
      token = rawToken.trim()
    } else if (rawToken && typeof rawToken === 'object') {
      // Legacy SDK versions might return an object
      const tokenObj = rawToken as any
      token = tokenObj.accessToken || tokenObj.token || tokenObj.jwt || null
    }
    
    // Validate token format (JWT should have 3 parts separated by dots)
    if (!token || token === '') {
      // Use warn instead of error - this can be a transient state during auth initialization
      console.warn('Token is empty or undefined after retries')
      // Only log telemetry failure silently - don't block the app
      logTokenFailure({
        userId: user.id,
        errorType: 'token_empty',
        errorMessage: 'Token returned from SDK was empty or invalid format after retries',
        context: 'getValidAuthToken',
        attemptedRetries: TOKEN_FETCH_MAX_RETRIES
      }).catch(() => {}) // Fire and forget telemetry
      
      return {
        success: false,
        token: null,
        error: 'Failed to retrieve valid token'
      }
    }

    // Verify JWT format (should have 3 parts: header.payload.signature)
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.warn('Token is not a valid JWT format, parts:', parts.length)
      logTokenFailure({
        userId: user.id,
        errorType: 'token_invalid_format',
        errorMessage: `Token has ${parts.length} parts instead of 3 (not a valid JWT)`,
        context: 'getValidAuthToken',
        attemptedRetries: 0
      }).catch(() => {})
      
      cachedToken = null
      tokenExpiresAt = null
      
      return {
        success: false,
        token: null,
        error: 'Invalid token format'
      }
    }

    // Parse the JWT payload to get expiration time
    try {
      // JWT payloads are base64url encoded. Standard atob might fail due to lack of padding or invalid characters.
      // Replace base64url characters with standard base64 and add padding if necessary.
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padLength = (4 - (base64.length % 4)) % 4;
      const paddedBase64 = base64 + '='.repeat(padLength);
      
      const payload = JSON.parse(atob(paddedBase64));
      if (payload.exp) {
        // JWT exp is in seconds, convert to milliseconds
        tokenExpiresAt = payload.exp * 1000;
        console.log('✅ Valid JWT token obtained, expires in', Math.floor((tokenExpiresAt - Date.now()) / 1000), 'seconds');
      } else {
        // If no exp claim, assume 1 hour validity
        tokenExpiresAt = Date.now() + 3600000;
        console.log('✅ Valid JWT token obtained (no exp claim, assuming 1h validity)');
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse JWT payload, assuming 1h validity:', parseError);
      tokenExpiresAt = Date.now() + 3600000;
    }

    // Cache the token
    cachedToken = token
    
    console.log('✅ Token cached, length:', token.length, 'parts:', parts.length)
    
    return {
      success: true,
      token,
      userId: user.id,
      expiresIn: tokenExpiresAt ? Math.floor((tokenExpiresAt - Date.now()) / 1000) : undefined
    }
  } catch (error) {
    cachedToken = null
    tokenExpiresAt = null
    
    // Downgrade "Failed to fetch" network errors to warnings - they are transient
    const isNetworkError = error instanceof Error && 
      (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))
    if (isNetworkError) {
      console.warn('Token refresh network error (transient):', error.message)
    } else {
      console.error('Error getting valid token:', error)
    }
    
    // Fire-and-forget telemetry to avoid cascading failures
    logTokenFailure({
      errorType: isNetworkError ? 'network_error' : 'sdk_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown SDK error',
      context: 'getValidAuthToken',
      attemptedRetries: 0
    }).catch(() => {})

    return {
      success: false,
      token: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if a token string appears valid (format check only)
 */
export function isTokenValid(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false
  return token.split('.').length === 3
}

/**
 * Create authorization header
 */
export function createAuthHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`
  }
}

/**
 * Clear token cache - call this on logout or when token is known to be invalid
 */
export function clearTokenCache(): void {
  cachedToken = null
  tokenExpiresAt = null
  console.log('🗑️ Token cache cleared')
}

/**
 * Strategy 2: Get a fresh token directly from SDK with NO caching.
 * 
 * This bypasses all client-side token caching and calls blink.auth.getValidToken()
 * fresh on every request. The SDK internally manages token refresh.
 * 
 * Use this for critical operations like transcription where stale tokens
 * can cause 401 errors.
 * 
 * @returns TokenValidationResult with fresh token
 */
export async function getFreshTokenNoCache(): Promise<TokenValidationResult> {
  const timestamp = new Date().toISOString()
  console.log(`🔑 [${timestamp}] getFreshTokenNoCache: Requesting fresh token from SDK (no cache)`)
  
  try {
    // First verify user is authenticated
    const user = await blink.auth.me()
    if (!user) {
      console.warn(`🔒 [${timestamp}] getFreshTokenNoCache: User not authenticated`)
      return {
        success: false,
        token: null,
        error: 'Authentication required'
      }
    }

    // Get token directly from SDK with retry for network errors
    // Note: The SDK's getValidToken() should handle refresh internally
    let rawToken: any = null
    const FRESH_TOKEN_MAX_RETRIES = 2
    
    for (let attempt = 0; attempt < FRESH_TOKEN_MAX_RETRIES; attempt++) {
      try {
        rawToken = await blink.auth.getValidToken()
        break // Success - exit retry loop
      } catch (fetchError) {
        const isNetworkError = fetchError instanceof Error && 
          (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError'))
        
        if (isNetworkError && attempt < FRESH_TOKEN_MAX_RETRIES - 1) {
          const delay = (attempt + 1) * 1500
          console.warn(`⚠️ [${timestamp}] getFreshTokenNoCache: Network error (attempt ${attempt + 1}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw fetchError
      }
    }
    
    // Extract token string
    let token: string | null = null
    
    if (typeof rawToken === 'string') {
      token = rawToken.trim()
    } else if (rawToken && typeof rawToken === 'object') {
      const tokenObj = rawToken as any
      token = tokenObj.accessToken || tokenObj.token || tokenObj.jwt || null
    }
    
    // Validate token format
    if (!token || token === '') {
      console.warn(`⚠️ [${timestamp}] getFreshTokenNoCache: Token is empty`)
      logTokenFailure({
        userId: user.id,
        errorType: 'token_empty_no_cache',
        errorMessage: 'Fresh token from SDK was empty',
        context: 'getFreshTokenNoCache',
        attemptedRetries: 0
      }).catch(() => {})
      
      return {
        success: false,
        token: null,
        error: 'Failed to retrieve fresh token'
      }
    }

    // Verify JWT format
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.warn(`⚠️ [${timestamp}] getFreshTokenNoCache: Invalid JWT format, parts:`, parts.length)
      logTokenFailure({
        userId: user.id,
        errorType: 'token_invalid_format_no_cache',
        errorMessage: `Fresh token has ${parts.length} parts (not valid JWT)`,
        context: 'getFreshTokenNoCache',
        attemptedRetries: 0
      }).catch(() => {})
      
      return {
        success: false,
        token: null,
        error: 'Invalid token format'
      }
    }

    // Parse expiration for logging only (not for caching)
    let expiresIn: number | undefined
    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padLength = (4 - (base64.length % 4)) % 4;
      const paddedBase64 = base64 + '='.repeat(padLength);
      
      const payload = JSON.parse(atob(paddedBase64));
      if (payload.exp) {
        expiresIn = Math.floor((payload.exp * 1000 - Date.now()) / 1000)
      }
    } catch (parseError) {
      // Non-critical - just for logging
    }

    console.log(`✅ [${timestamp}] getFreshTokenNoCache: Fresh token obtained, length:`, token.length, 'expires in:', expiresIn ? `${expiresIn}s` : 'unknown')
    
    // Log successful token refresh for telemetry
    await logTokenRefresh({
      userId: user.id,
      tokenLength: token.length,
      expiresIn,
      context: 'getFreshTokenNoCache'
    })
    
    return {
      success: true,
      token,
      userId: user.id,
      expiresIn
    }
  } catch (error) {
    const ts = new Date().toISOString()
    
    // Downgrade network errors to warnings - they are transient
    const isNetworkError = error instanceof Error && 
      (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))
    if (isNetworkError) {
      console.warn(`⚠️ [${ts}] getFreshTokenNoCache: Network error (transient):`, error.message)
    } else {
      console.error(`❌ [${ts}] getFreshTokenNoCache: Error getting fresh token:`, error)
    }
    
    logTokenFailure({
      errorType: isNetworkError ? 'network_error_no_cache' : 'sdk_error_no_cache',
      errorMessage: error instanceof Error ? error.message : 'Unknown SDK error',
      context: 'getFreshTokenNoCache',
      attemptedRetries: 0
    }).catch(() => {})

    return {
      success: false,
      token: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Strategy 2: Execute an API call with fresh token and automatic retry logic.
 * 
 * This method:
 * 1. Gets a fresh token (no cache)
 * 2. Executes the API call
 * 3. On 401, clears cache, gets another fresh token, and retries ONCE
 * 4. On 503 (Service Unavailable), retries up to 5 times with exponential backoff
 * 5. If retry also fails with 401, triggers reauth flow
 * 
 * @param apiCall - Function that receives the token and returns a Response
 * @returns The parsed JSON response
 * @throws Error if auth fails after retry
 */
export async function executeWithFreshToken<T>(
  apiCall: (token: string) => Promise<Response>
): Promise<T> {
  const timestamp = new Date().toISOString()
  console.log(`🚀 [${timestamp}] executeWithFreshToken: Starting API call with fresh token strategy`)
  
  // Step 1: Get fresh token
  const tokenResult = await getFreshTokenNoCache()
  if (!tokenResult.success || !tokenResult.token) {
    throw new Error(tokenResult.error || 'Failed to get authentication token')
  }
  
  // Step 2: Execute the API call with retry logic for transient errors
  // Increased retries for 503 (DNS/network errors) which are common in edge functions
  const MAX_RETRIES = 5
  const INITIAL_DELAY_MS = 1500 // 1.5 seconds - slightly longer to allow DNS resolution
  
  let lastError: Error | null = null
  let currentToken = tokenResult.token
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await apiCall(currentToken)
      
      // If successful, return the result
      if (response.ok) {
        if (attempt > 0) {
          console.log(`✅ [${timestamp}] executeWithFreshToken: Retry ${attempt} successful!`)
        }
        return response.json()
      }
      
      // Handle 401 (authentication error)
      if (response.status === 401) {
        const errorBody = await response.json().catch(() => ({}));
        console.warn(`🔄 [${timestamp}] executeWithFreshToken: Got 401, clearing cache and retrying with fresh token...`, {
          code: errorBody.code,
          details: errorBody.details,
          projectId: errorBody.projectId
        });
        
        // Clear any cached token in our manager
        clearTokenCache()
        
        // Check if user session is actually valid
        // Note: me() may return cached data, so we also check for user.id
        const user = await blink.auth.me()
        if (!user || !user.id) {
          console.error(`❌ [${timestamp}] executeWithFreshToken: User session invalid or expired`)
          throw new Error('Authentication required - session expired')
        }
        
        console.log(`✅ [${timestamp}] executeWithFreshToken: User session exists (id: ${user.id.substring(0, 8)}...)`)
        
        // Wait for SDK to potentially refresh token in background
        // The SDK may have triggered a refresh when it detected the 401
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try to get a genuinely fresh token
        // The SDK's getValidToken() may return a cached token even after 401
        // We need to detect this and handle appropriately
        let newToken: string | null = null;
        let sameTokenCount = 0;
        
        // Try multiple approaches to get a genuinely fresh token
        for (let refreshAttempt = 0; refreshAttempt < 3; refreshAttempt++) {
          console.log(`🔄 [${timestamp}] executeWithFreshToken: Token refresh attempt ${refreshAttempt + 1}/3`);
          
          // Clear our local cache
          clearTokenCache();
          
          // Increasing delay between attempts to allow SDK internal refresh to happen
          if (refreshAttempt > 0) {
            const delayMs = refreshAttempt * 1000; // 1s, then 2s
            console.log(`⏳ [${timestamp}] Waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          
          // Get fresh token
          const retryTokenResult = await getFreshTokenNoCache()
          if (!retryTokenResult.success || !retryTokenResult.token) {
            console.warn(`⚠️ [${timestamp}] executeWithFreshToken: Refresh attempt ${refreshAttempt + 1} failed to get token`);
            
            // If we can't get a token at all, user session is likely expired
            // Check if user is still authenticated
            const user = await blink.auth.me();
            if (!user) {
              console.error(`❌ [${timestamp}] executeWithFreshToken: User session expired - reauth required`);
              throw new Error('AUTHENTICATION_FAILED_AFTER_RETRY');
            }
            continue;
          }
          
          // Check if we got the same token again
          if (retryTokenResult.token === currentToken) {
            sameTokenCount++;
            console.warn(`⚠️ [${timestamp}] executeWithFreshToken: SDK returned the same token on attempt ${refreshAttempt + 1} (same token count: ${sameTokenCount})`);
            
            // If we get the same token 2 times in a row, the SDK cache is stale
            // The server rejected this token, so we need to force re-authentication
            if (sameTokenCount >= 2) {
              console.warn(`🔒 [${timestamp}] executeWithFreshToken: SDK keeps returning the same rejected token - session likely invalid`);
              // Even though SDK thinks we're authenticated, the server disagrees
              // This happens when session is invalidated server-side
              throw new Error('AUTHENTICATION_FAILED_AFTER_RETRY');
            }
            continue;
          }
          
          // We got a different token - use it
          newToken = retryTokenResult.token;
          console.log(`✅ [${timestamp}] executeWithFreshToken: Got new token on attempt ${refreshAttempt + 1}`);
          break;
        }
        
        // If we couldn't get a new token, throw auth error
        if (!newToken) {
          console.error(`❌ [${timestamp}] executeWithFreshToken: Could not obtain a fresh token after multiple attempts`);
          throw new Error('AUTHENTICATION_FAILED_AFTER_RETRY')
        }
        
        console.log(`🔄 [${timestamp}] executeWithFreshToken: Retrying API call with new fresh token...`)
        
        // Retry the API call with new token
        const retryResponse = await apiCall(newToken)
        
        if (retryResponse.ok) {
          console.log(`✅ [${timestamp}] executeWithFreshToken: Auth retry successful!`)
          return retryResponse.json()
        }
        
        // If retry also fails with 401, throw specific error to trigger reauth
        if (retryResponse.status === 401) {
          const retryErrorBody = await retryResponse.json().catch(() => ({}));
          console.error(`❌ [${timestamp}] executeWithFreshToken: Retry also failed with 401 - auth flow needed`, {
            code: retryErrorBody.code,
            details: retryErrorBody.details
          });
          throw new Error('AUTHENTICATION_FAILED_AFTER_RETRY')
        }
        
        // Handle other error responses on auth retry
        const errorData = await retryResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `API call failed: ${retryResponse.status}`)
      }
      
      // Handle 503 (Service Unavailable) - these are retryable transient errors
      // DNS errors typically resolve within a few seconds, so we use exponential backoff with jitter
      if (response.status === 503 || response.status === 502 || response.status === 504) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error', isRetryable: true }))
        
        // Check if we can retry
        if (attempt < MAX_RETRIES && errorData.isRetryable !== false) {
          // Exponential backoff with jitter: base * 2^attempt + random(0-500ms)
          // This helps avoid thundering herd problems
          const baseDelay = INITIAL_DELAY_MS * Math.pow(2, attempt) // 1.5s, 3s, 6s, 12s, 24s
          const jitter = Math.random() * 500 // 0-500ms random jitter
          const delayMs = Math.min(baseDelay + jitter, 30000) // Cap at 30 seconds
          
          console.warn(`🔄 [${timestamp}] executeWithFreshToken: Got ${response.status} (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${Math.round(delayMs)}ms...`, {
            code: errorData.code,
            hint: errorData.hint,
            details: typeof errorData.details === 'string' ? errorData.details.substring(0, 100) : JSON.stringify(errorData.details)
          })
          
          await new Promise(resolve => setTimeout(resolve, delayMs))
          continue // Retry with same token
        }
        
        // Max retries exceeded or not retryable
        const code = errorData.code || 'SERVICE_UNAVAILABLE'
        const errorMsg = typeof errorData.error === 'string' ? errorData.error : 'Service temporarily unavailable'
        throw new Error(`${code}: ${errorMsg}`)
      }
      
      // Handle other non-retryable errors
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `API call failed: ${response.status}`)
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry for authentication errors - let them bubble up immediately
      if (lastError.message.includes('AUTHENTICATION') || 
          lastError.message.includes('session expired') ||
          lastError.message.includes('Authentication required')) {
        throw lastError
      }
      
      // For network errors, retry if we have attempts left
      if (attempt < MAX_RETRIES && isRetryableNetworkError(lastError)) {
        // Exponential backoff with jitter for network errors
        const baseDelay = INITIAL_DELAY_MS * Math.pow(2, attempt)
        const jitter = Math.random() * 500
        const delayMs = Math.min(baseDelay + jitter, 30000)
        
        console.warn(`🔄 [${timestamp}] executeWithFreshToken: Network error (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${Math.round(delayMs)}ms...`, {
          error: lastError.message
        })
        
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }
      
      // Re-throw the error if we can't retry
      throw lastError
    }
  }
  
  // Should not reach here, but throw last error if we do
  throw lastError || new Error('Unknown error in executeWithFreshToken')
}

/**
 * Check if an error is a retryable network error
 */
function isRetryableNetworkError(error: Error): boolean {
  const msg = error.message.toLowerCase()
  return (
    msg.includes('dns error') ||
    msg.includes('name or service not known') ||
    msg.includes('failed to lookup') ||
    msg.includes('network') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    msg.includes('fetch failed') ||
    msg.includes('service_unavailable') ||
    msg.includes('503')
  )
}

/**
 * Get token cache info - SDK internal
 */
export function getTokenCacheInfo(): any {
  return { hasCache: true, isValid: true } // Mock response as SDK handles this
}

export function logRequestDetails(details: any): void {
  // Keep for debugging if needed
  console.log('[Auth] Request:', details.url)
}
