import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeWithFreshToken, clearTokenCache } from '../utils/authTokenManager'
import { blink } from '../blink/client'

// Mock blink client
vi.mock('../blink/client', () => ({
  blink: {
    auth: {
      me: vi.fn(),
      getValidToken: vi.fn()
    }
  }
}))

// Mock telemetry to avoid errors in tests
vi.mock('../utils/authTelemetry', () => ({
  logTokenFailure: vi.fn().mockResolvedValue(undefined),
  logTokenRefresh: vi.fn().mockResolvedValue(undefined)
}))

// Helper to create a valid-looking JWT
const createToken = (id: string) => `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, id }))}.signature`

describe('executeWithFreshToken Retry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearTokenCache()
    
    // Default mock setup
    ;(blink.auth.me as any).mockResolvedValue({ id: 'user_123', email: 'test@example.com' } as any)
    ;(blink.auth.getValidToken as any).mockResolvedValue(createToken('initial'))
  })

  it('should retry on 503 status code', async () => {
    const apiCall = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Service Unavailable', isRetryable: true }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'Success' }), { status: 200 }))

    vi.useFakeTimers()
    
    const promise = executeWithFreshToken(apiCall)
    
    // First attempt happens immediately, then 503 triggers retry
    // We need to advance enough to cover INITIAL_DELAY_MS (1500ms) + some jitter
    await vi.advanceTimersByTimeAsync(3000) 
    
    const result = await promise
    
    expect(apiCall).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ text: 'Success' })
    
    vi.useRealTimers()
  })

  it('should retry on 502 status code', async () => {
    const apiCall = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Bad Gateway', isRetryable: true }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'Success' }), { status: 200 }))

    vi.useFakeTimers()
    
    const promise = executeWithFreshToken(apiCall)
    
    await vi.advanceTimersByTimeAsync(3000) 
    
    const result = await promise
    
    expect(apiCall).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ text: 'Success' })
    
    vi.useRealTimers()
  })

  it('should retry on 504 status code', async () => {
    const apiCall = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Gateway Timeout', isRetryable: true }), { status: 504 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'Success' }), { status: 200 }))

    vi.useFakeTimers()
    
    const promise = executeWithFreshToken(apiCall)
    
    await vi.advanceTimersByTimeAsync(3000) 
    
    const result = await promise
    
    expect(apiCall).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ text: 'Success' })
    
    vi.useRealTimers()
  })

  it('should retry up to MAX_RETRIES (5) on 503', async () => {
    const apiCall = vi.fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: 'Service Unavailable', isRetryable: true }), { status: 503 }))

    vi.useFakeTimers()
    
    const promise = executeWithFreshToken(apiCall)
    
    // Advance timers for all 5 retries
    // 1.5s, 3s, 6s, 12s, 24s
    for (let i = 0; i < 6; i++) {
      await vi.advanceTimersByTimeAsync(30000)
    }
    
    await expect(promise).rejects.toThrow('SERVICE_UNAVAILABLE')
    
    expect(apiCall).toHaveBeenCalledTimes(6) 
    
    vi.useRealTimers()
  })

  it('should handle 401 by clearing cache and retrying once', async () => {
    const apiCall = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'Success after reauth' }), { status: 200 }))

    const token1 = createToken('token_1')
    const token2 = createToken('token_2')

    // Mock getValidToken to return different tokens
    ;(blink.auth.getValidToken as any)
      .mockResolvedValueOnce(token1)
      .mockResolvedValueOnce(token2)

    const result = await executeWithFreshToken(apiCall)
    
    expect(apiCall).toHaveBeenCalledTimes(2)
    expect(apiCall).toHaveBeenNthCalledWith(1, token1)
    expect(apiCall).toHaveBeenNthCalledWith(2, token2)
    expect(result).toEqual({ text: 'Success after reauth' })
  })

  it('should throw AUTHENTICATION_FAILED_AFTER_RETRY if 401 persists', async () => {
    const apiCall = vi.fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))

    const token1 = createToken('token_1')
    const token2 = createToken('token_2')
    const token3 = createToken('token_3')

    // Mock getValidToken to return DIFFERENT tokens so it actually retries the API call
    ;(blink.auth.getValidToken as any)
      .mockResolvedValueOnce(token1)
      .mockResolvedValueOnce(token2)
      .mockResolvedValueOnce(token3)

    await expect(executeWithFreshToken(apiCall)).rejects.toThrow('AUTHENTICATION_FAILED_AFTER_RETRY')
    
    // Initial call + 1 retry = 2 calls
    expect(apiCall).toHaveBeenCalledTimes(2)
  })
})
