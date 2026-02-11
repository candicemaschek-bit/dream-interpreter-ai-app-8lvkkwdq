/**
 * Rate limit guard for Blink DB endpoints.
 *
 * Purpose:
 * - Prevent request storms when multiple components query Blink DB at once.
 * - Provide small, safe retry behavior on 429 (RATE_LIMIT_EXCEEDED).
 * - Deduplicate in-flight requests by a caller-provided key.
 */

type BlinkRateLimitDetails = {
  code?: string
  reset?: string
  message?: string
  type?: string
}

type BlinkNetworkErrorLike = {
  name?: string
  message?: string
  status?: number
  details?: BlinkRateLimitDetails
}

const inflight = new Map<string, Promise<unknown>>()
let globalBlockedUntilMs = 0

function isRateLimitError(error: unknown): error is BlinkNetworkErrorLike {
  if (!error || typeof error !== 'object') return false
  const e = error as BlinkNetworkErrorLike
  return e.status === 429 || e.details?.code === 'RATE_LIMIT_EXCEEDED' || /rate limit/i.test(e.message || '')
}

function getRetryDelayMs(error: BlinkNetworkErrorLike): number {
  // Prefer server-provided reset time
  const resetIso = error.details?.reset
  if (resetIso) {
    const resetMs = Date.parse(resetIso)
    if (!Number.isNaN(resetMs)) {
      return Math.max(0, resetMs - Date.now())
    }
  }

  // Fallback: parse "Try again in X seconds"
  const msg = error.message || error.details?.message || ''
  const match = msg.match(/try again in\s+(\d+)\s+seconds?/i)
  if (match) {
    const seconds = Number(match[1])
    if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000)
  }

  return 2000
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/**
 * Runs an async action with:
 * - in-flight dedupe via `key`
 * - global backoff if the app recently hit a DB rate limit
 * - a single retry when a 429 occurs
 */
export async function withDbRateLimitGuard<T>(
  key: string,
  action: () => Promise<T>,
  options?: { maxRetries?: number }
): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const maxRetries = options?.maxRetries ?? 1

  const promise = (async () => {
    // If we've recently hit a DB rate limit, avoid hammering until it clears.
    const waitMs = Math.max(0, globalBlockedUntilMs - Date.now())
    if (waitMs > 0) await sleep(waitMs)

    let attempt = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await action()
      } catch (err) {
        attempt += 1
        if (!isRateLimitError(err) || attempt > maxRetries) throw err

        const delay = getRetryDelayMs(err)
        globalBlockedUntilMs = Math.max(globalBlockedUntilMs, Date.now() + delay)
        await sleep(delay)
      }
    }
  })()

  inflight.set(key, promise)

  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}
