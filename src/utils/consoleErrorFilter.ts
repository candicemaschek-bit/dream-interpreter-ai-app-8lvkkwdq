/**
 * Console Error Filter for External/Third-Party Noise
 * 
 * This utility filters out console errors from external sources like:
 * - Blink platform's session recording (rrweb-plugin-console-record.js)
 * - Firebase/Firestore errors from Blink infrastructure
 * - postMessage origin mismatches (iframe communication)
 * - Browser extension errors
 * 
 * These errors are external to the app and cannot be fixed in application code.
 */

// Patterns to filter out from console
const FILTER_PATTERNS = [
  // Firebase/Firestore errors from Blink platform
  /@firebase\/firestore/i,
  /WebChannelConnection/i,
  /RPC 'Listen' stream/i,
  /transport errored/i,
  
  // rrweb session recording noise
  /rrweb-plugin-console-record/i,
  /rrweb/i,

  // Platform analytics noise
  /DataFast/i,
  /syncUserWithDatabase/i,
  /Pageview ignored - throttled/i,
  /pageview tracked successfully/i,
  /Skipping sync for user/i,

  // Browser preload warnings (external scripts)
  /preloaded using link preload/i,
  /appropriate `as` value/i,
  
  // postMessage origin mismatch (iframe communication)
  /Failed to execute 'postMessage' on 'DOMWindow'/i,
  /target origin provided.*does not match/i,
  
  // DOM node resolution errors (from session recording)
  /deferred DOM Node could not be resolved/i,
  
  // Browser extension noise
  /chrome-extension:/i,
  /moz-extension:/i,
  
  // Network errors that are external/transient
  /BlinkNetworkError.*Network request failed/i,
  
  // SDK internal token refresh failures (transient network issues)
  /Token refresh failed.*Failed to fetch/i,
  /Token refresh failed.*NetworkError/i,
]

// Keep original console methods
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log
const originalConsoleInfo = console.info

/**
 * Check if a message should be filtered
 */
function shouldFilter(args: unknown[]): boolean {
  const messageString = args
    .map(arg => {
      if (typeof arg === 'string') return arg
      if (arg instanceof Error) return arg.message + ' ' + arg.stack
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    })
    .join(' ')

  return FILTER_PATTERNS.some(pattern => pattern.test(messageString))
}

/**
 * Install console filters to suppress external error noise
 * Call this in main.tsx before app initialization
 */
export function installConsoleFilters(): void {
  // Install in all environments to prevent user confusion from external noise
  // The filter patterns are specific enough to avoid hiding real application errors
  const shouldInstall = true
  
  if (!shouldInstall) {
    return
  }

  // Override console.error
  console.error = function(...args: unknown[]) {
    if (!shouldFilter(args)) {
      originalConsoleError.apply(console, args)
    }
  }

  // Override console.warn
  console.warn = function(...args: unknown[]) {
    if (!shouldFilter(args)) {
      originalConsoleWarn.apply(console, args)
    }
  }

  // Override console.log
  console.log = function(...args: unknown[]) {
    if (!shouldFilter(args)) {
      originalConsoleLog.apply(console, args)
    }
  }

  // Override console.info
  console.info = function(...args: unknown[]) {
    if (!shouldFilter(args)) {
      originalConsoleInfo.apply(console, args)
    }
  }

  // Log that filters are installed (once)
  originalConsoleLog.call(
    console,
    '[Console Filter] Filtering external noise (Firebase, rrweb, platform analytics)'
  )
}

/**
 * Remove console filters (restore original behavior)
 */
export function uninstallConsoleFilters(): void {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.log = originalConsoleLog
  console.info = originalConsoleInfo
}

/**
 * Add a window error handler to catch uncaught errors and filter them
 */
export function installWindowErrorHandler(): void {
  const shouldInstall = true
  
  if (!shouldInstall) {
    return
  }

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const messageString = event.message + ' ' + (event.filename || '') + ' ' + (event.error?.stack || '')
    
    if (FILTER_PATTERNS.some(pattern => pattern.test(messageString))) {
      event.preventDefault() // Prevent the error from appearing in console
      return true
    }
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const messageString = String(event.reason) + ' ' + (event.reason?.stack || '')
    
    if (FILTER_PATTERNS.some(pattern => pattern.test(messageString))) {
      event.preventDefault() // Prevent the rejection from appearing in console
    }
  })
}