import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkAndGrantLaunchOffer } from './launchOfferManager'
import { blink } from '../blink/client'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock blink client
vi.mock('../blink/client', () => ({
  blink: {
    auth: {
      getValidToken: vi.fn(),
    },
    db: {
      launchOfferUsers: {
        list: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      }
    }
  }
}))

describe('launchOfferManager', () => {
  const userId = 'user_123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default auth mock
    vi.mocked(blink.auth.getValidToken).mockResolvedValue('mock-token')
  })

  it('should grant offer if user is new and limit not reached', async () => {
    // Mock the edge function response for new user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        granted: true,
        signupNumber: 101,
        message: 'Launch offer granted.'
      })
    })

    const result = await checkAndGrantLaunchOffer(userId)

    expect(result.granted).toBe(true)
    expect(result.signupNumber).toBe(101)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://8lvkkwdq--grant-launch-offer.functions.blink.new',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    )
  })

  it('should return existing offer if user already has it', async () => {
    // Mock the edge function response for existing user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        granted: true,
        signupNumber: 50,
        message: 'Launch offer already active.'
      })
    })

    const result = await checkAndGrantLaunchOffer(userId)

    expect(result.granted).toBe(true)
    expect(result.signupNumber).toBe(50)
  })

  it('should deny offer if limit reached', async () => {
    // Mock the edge function response when limit is reached
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        granted: false,
        message: 'Launch offer limit reached (500 spots taken).'
      })
    })

    const result = await checkAndGrantLaunchOffer(userId)

    expect(result.granted).toBe(false)
    expect(result.message).toContain('limit reached')
  })

  it('should return not granted if no auth token available', async () => {
    // Mock no token available
    vi.mocked(blink.auth.getValidToken).mockResolvedValue(null)

    const result = await checkAndGrantLaunchOffer(userId)

    expect(result.granted).toBe(false)
    expect(result.message).toContain('Authentication required')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle edge function errors gracefully', async () => {
    // Mock edge function error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Service unavailable' })
    })

    const result = await checkAndGrantLaunchOffer(userId)

    expect(result.granted).toBe(false)
    expect(result.message).toContain('service unavailable')
  })
})
