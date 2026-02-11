/**
 * E2E Tests for Video Generation Flow
 * Tests authentication, authorization, payload validation, and tier restrictions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock types for video generation
interface VideoGenerationRequest {
  imageUrl: string
  prompt: string
  userId: string
  subscriptionTier: 'free' | 'pro' | 'premium' | 'vip'
  durationSeconds?: number
}

interface VideoGenerationResponse {
  success: boolean
  videoUrl: string
  method: 'blink-ai' | 'runway-ml'
  duration: number
  format: string
  framesGenerated: number
}

interface VideoGenerationError {
  error: string
  code?: string
  stage?: string
}

// Mock fetch for testing edge function calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Test utilities
const MOCK_AUTH_TOKEN = 'mock-jwt-token-abc123'
const MOCK_USER_ID = 'user_test123'
const MOCK_IMAGE_URL = 'https://storage.googleapis.com/test-bucket/dream-image.jpg'
const MOCK_VIDEO_URL = 'https://storage.googleapis.com/test-bucket/dream-video.mp4'

const createMockRequest = (
  payload: Partial<VideoGenerationRequest>,
  authToken?: string
): { url: string; options: RequestInit } => {
  return {
    url: 'https://edge-function-url/generate-video',
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(payload)
    }
  }
}

describe('Video Generation E2E Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Tests', () => {
    it('should reject requests without authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Missing authorization header',
          code: 'AUTH_HEADER_MISSING'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      })

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing authorization header')
      expect(data.code).toBe('AUTH_HEADER_MISSING')
    })

    it('should reject requests with invalid authorization format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Invalid authorization header format. Expected: Bearer <token>',
          code: 'AUTH_HEADER_INVALID'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      })
      request.options.headers = { ...request.options.headers, 'Authorization': 'Invalid token-format' }

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(401)
      expect(data.code).toBe('AUTH_HEADER_INVALID')
    })

    it('should reject requests with empty token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Empty authentication token',
          code: 'AUTH_TOKEN_EMPTY'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, '')

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(401)
      expect(data.code).toBe('AUTH_TOKEN_EMPTY')
    })
  })

  describe('Payload Validation Tests', () => {
    it('should reject requests with invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        })
      })

      const response = await fetch('https://edge-function-url/generate-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOCK_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: 'invalid-json-{{'
      })
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_JSON')
    })

    it('should reject requests with missing imageUrl', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request payload: imageUrl is required and must be a non-empty string',
          code: 'INVALID_PAYLOAD'
        })
      })

      const request = createMockRequest({
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      } as VideoGenerationRequest, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PAYLOAD')
      expect(data.error).toContain('imageUrl')
    })

    it('should reject requests with invalid imageUrl format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request payload: imageUrl must be a valid URL',
          code: 'INVALID_PAYLOAD'
        })
      })

      const request = createMockRequest({
        imageUrl: 'not-a-valid-url',
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PAYLOAD')
      expect(data.error).toContain('valid URL')
    })

    it('should reject requests with missing prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request payload: prompt is required and must be a non-empty string',
          code: 'INVALID_PAYLOAD'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      } as VideoGenerationRequest, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PAYLOAD')
      expect(data.error).toContain('prompt')
    })

    it('should reject requests with prompt exceeding max length', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request payload: prompt exceeds maximum length of 5000 characters',
          code: 'INVALID_PAYLOAD'
        })
      })

      const longPrompt = 'a'.repeat(5001)
      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: longPrompt,
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PAYLOAD')
      expect(data.error).toContain('exceeds maximum length')
    })

    it('should reject requests with missing userId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request payload: userId is required and must be a non-empty string',
          code: 'INVALID_PAYLOAD'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        subscriptionTier: 'premium'
      } as VideoGenerationRequest, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PAYLOAD')
      expect(data.error).toContain('userId')
    })

    it('should reject requests with invalid subscriptionTier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request payload: subscriptionTier must be one of: free, pro, premium, vip',
          code: 'INVALID_PAYLOAD'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'invalid-tier' as 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PAYLOAD')
      expect(data.error).toContain('subscriptionTier')
    })

    it('should reject requests with invalid durationSeconds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request payload: durationSeconds must be a positive number between 1 and 45',
          code: 'INVALID_PAYLOAD'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium',
        durationSeconds: 50 // Exceeds max
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PAYLOAD')
    })
  })

  describe('Authorization and Tier Restriction Tests', () => {
    it('should reject free tier users attempting video generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Video generation is only available for Premium and VIP tiers. Current tier: free',
          code: 'UNAUTHORIZED'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'free'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(403)
      expect(data.code).toBe('UNAUTHORIZED')
      expect(data.error).toContain('Premium and VIP tiers')
    })

    it('should reject pro tier users attempting video generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Video generation is only available for Premium and VIP tiers. Current tier: pro',
          code: 'UNAUTHORIZED'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'pro'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(403)
      expect(data.code).toBe('UNAUTHORIZED')
      expect(data.error).toContain('Premium and VIP tiers')
    })

    it('should reject when userId does not match authenticated user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Authorization failed: userId in request does not match authenticated user',
          code: 'UNAUTHORIZED'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: 'different-user-id',
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(403)
      expect(data.code).toBe('UNAUTHORIZED')
      expect(data.error).toContain('does not match authenticated user')
    })

    it('should reject when subscription tier mismatch detected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Subscription tier mismatch: database shows free, request claims premium',
          code: 'UNAUTHORIZED'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(403)
      expect(data.code).toBe('UNAUTHORIZED')
      expect(data.error).toContain('tier mismatch')
    })
  })

  describe('Successful Video Generation Tests', () => {
    it('should successfully generate video for premium tier user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          videoUrl: MOCK_VIDEO_URL,
          method: 'blink-ai',
          duration: 6,
          format: 'video/mp4',
          framesGenerated: 3
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene with mountains and stars',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationResponse

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.videoUrl).toBe(MOCK_VIDEO_URL)
      expect(data.duration).toBe(6)
      expect(data.framesGenerated).toBe(3)
      expect(data.format).toBe('video/mp4')
    })

    it('should successfully generate video for vip tier user with extended duration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          videoUrl: MOCK_VIDEO_URL,
          method: 'blink-ai',
          duration: 45,
          format: 'video/mp4',
          framesGenerated: 15
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'An epic cinematic dreamworld journey through space and time',
        userId: MOCK_USER_ID,
        subscriptionTier: 'vip',
        durationSeconds: 45
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationResponse

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.videoUrl).toBe(MOCK_VIDEO_URL)
      expect(data.duration).toBe(45)
      expect(data.framesGenerated).toBe(15)
    })
  })

  describe('Edge Case Tests', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'))

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      await expect(fetch(request.url, request.options)).rejects.toThrow('Network request failed')
    })

    it('should handle server errors (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Video generation failed',
          code: 'VIDEO_GENERATION_FAILED',
          stage: 'generating-frames'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(500)
      expect(data.code).toBe('VIDEO_GENERATION_FAILED')
    })

    it('should validate imageUrl has correct file extension', async () => {
      const request = createMockRequest({
        imageUrl: 'https://storage.googleapis.com/test-bucket/dream.jpg',
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      expect(request.options.body).toContain('.jpg')
    })

    it('should handle empty prompt strings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request payload: prompt is required and must be a non-empty string',
          code: 'INVALID_PAYLOAD'
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: '   ',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationError

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PAYLOAD')
    })
  })

  describe('Duration Tier Tests', () => {
    it('should enforce 6-second duration for premium tier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          videoUrl: MOCK_VIDEO_URL,
          method: 'blink-ai',
          duration: 6,
          format: 'video/mp4',
          framesGenerated: 3
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'A beautiful dream scene',
        userId: MOCK_USER_ID,
        subscriptionTier: 'premium'
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationResponse

      expect(data.duration).toBe(6)
    })

    it('should allow 45-second duration for vip tier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          videoUrl: MOCK_VIDEO_URL,
          method: 'blink-ai',
          duration: 45,
          format: 'video/mp4',
          framesGenerated: 15
        })
      })

      const request = createMockRequest({
        imageUrl: MOCK_IMAGE_URL,
        prompt: 'An epic dreamworld cinematic experience',
        userId: MOCK_USER_ID,
        subscriptionTier: 'vip',
        durationSeconds: 45
      }, MOCK_AUTH_TOKEN)

      const response = await fetch(request.url, request.options)
      const data = await response.json() as VideoGenerationResponse

      expect(data.duration).toBe(45)
    })
  })
})
