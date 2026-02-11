/**
 * Unit Tests for Video Security Utilities
 */

import { describe, it, expect } from 'vitest'
import {
  canGenerateVideoForTier,
  getVideoDurationForTier,
  getMaxFramesForTier,
  validateVideoGenerationPayload,
  validateAuthorizationToken,
  sanitizePrompt,
  validateImageUrl,
  calculateVideoGenerationCost,
  getTierRestrictionMessage,
  isVideoAuthorizationError,
  isVideoValidationError,
  ALLOWED_VIDEO_GENERATION_TIERS
} from './videoSecurity'

describe('videoSecurity utilities', () => {
  describe('canGenerateVideoForTier', () => {
    it('should return false for free tier', () => {
      expect(canGenerateVideoForTier('free')).toBe(false)
    })

    it('should return false for pro tier', () => {
      expect(canGenerateVideoForTier('pro')).toBe(false)
    })

    it('should return true for premium tier', () => {
      expect(canGenerateVideoForTier('premium')).toBe(true)
    })

    it('should return true for vip tier', () => {
      expect(canGenerateVideoForTier('vip')).toBe(true)
    })
  })

  describe('getVideoDurationForTier', () => {
    it('should return 0 seconds for free tier', () => {
      expect(getVideoDurationForTier('free')).toBe(0)
    })

    it('should return 0 seconds for pro tier', () => {
      expect(getVideoDurationForTier('pro')).toBe(0)
    })

    it('should return 6 seconds for premium tier', () => {
      expect(getVideoDurationForTier('premium')).toBe(6)
    })

    it('should return 45 seconds for vip tier', () => {
      expect(getVideoDurationForTier('vip')).toBe(45)
    })
  })

  describe('getMaxFramesForTier', () => {
    it('should return 0 frames for free tier', () => {
      expect(getMaxFramesForTier('free')).toBe(0)
    })

    it('should return 0 frames for pro tier', () => {
      expect(getMaxFramesForTier('pro')).toBe(0)
    })

    it('should return 3 frames for premium tier', () => {
      expect(getMaxFramesForTier('premium')).toBe(3)
    })

    it('should return 15 frames for vip tier', () => {
      expect(getMaxFramesForTier('vip')).toBe(15)
    })
  })

  describe('validateVideoGenerationPayload', () => {
    const validPayload = {
      imageUrl: 'https://storage.googleapis.com/test/image.jpg',
      prompt: 'A beautiful dream scene',
      userId: 'user_123',
      subscriptionTier: 'premium' as const
    }

    it('should validate correct payload', () => {
      const result = validateVideoGenerationPayload(validPayload)
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBeDefined()
      expect(result.sanitized?.imageUrl).toBe(validPayload.imageUrl)
    })

    it('should reject null payload', () => {
      const result = validateVideoGenerationPayload(null)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('object')
    })

    it('should reject missing imageUrl', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, imageUrl: '' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('imageUrl')
    })

    it('should reject invalid URL format', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, imageUrl: 'not-a-url' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('valid URL')
    })

    it('should reject missing prompt', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, prompt: '' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('prompt')
    })

    it('should reject prompt exceeding max length', () => {
      const longPrompt = 'a'.repeat(5001)
      const result = validateVideoGenerationPayload({ ...validPayload, prompt: longPrompt })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum length')
    })

    it('should reject missing userId', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, userId: '' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('userId')
    })

    it('should reject invalid subscription tier', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, subscriptionTier: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('subscriptionTier')
    })

    it('should reject free tier attempting video generation', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, subscriptionTier: 'free' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Premium and VIP')
    })

    it('should reject pro tier attempting video generation', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, subscriptionTier: 'pro' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Premium and VIP')
    })

    it('should validate premium tier payload', () => {
      const result = validateVideoGenerationPayload(validPayload)
      expect(result.valid).toBe(true)
      expect(result.sanitized?.subscriptionTier).toBe('premium')
    })

    it('should validate vip tier payload', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, subscriptionTier: 'vip' })
      expect(result.valid).toBe(true)
      expect(result.sanitized?.subscriptionTier).toBe('vip')
    })

    it('should reject negative durationSeconds', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, durationSeconds: -1 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('positive number')
    })

    it('should reject durationSeconds exceeding tier limit', () => {
      const result = validateVideoGenerationPayload({ ...validPayload, durationSeconds: 10 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum')
    })

    it('should accept valid durationSeconds for vip tier', () => {
      const result = validateVideoGenerationPayload({
        ...validPayload,
        subscriptionTier: 'vip',
        durationSeconds: 45
      })
      expect(result.valid).toBe(true)
      expect(result.sanitized?.durationSeconds).toBe(45)
    })

    it('should trim whitespace from fields', () => {
      const result = validateVideoGenerationPayload({
        imageUrl: '  https://test.com/image.jpg  ',
        prompt: '  Test prompt  ',
        userId: '  user_123  ',
        subscriptionTier: 'premium'
      })
      expect(result.valid).toBe(true)
      expect(result.sanitized?.imageUrl).toBe('https://test.com/image.jpg')
      expect(result.sanitized?.prompt).toBe('Test prompt')
      expect(result.sanitized?.userId).toBe('user_123')
    })
  })

  describe('validateAuthorizationToken', () => {
    it('should validate correct Bearer token', () => {
      const result = validateAuthorizationToken('Bearer abc123token')
      expect(result.valid).toBe(true)
      expect(result.token).toBe('abc123token')
    })

    it('should reject null token', () => {
      const result = validateAuthorizationToken(null)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('missing')
    })

    it('should reject token without Bearer prefix', () => {
      const result = validateAuthorizationToken('abc123token')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Bearer format')
    })

    it('should reject empty token after Bearer', () => {
      const result = validateAuthorizationToken('Bearer ')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    it('should trim whitespace from token', () => {
      const result = validateAuthorizationToken('Bearer   abc123token   ')
      expect(result.valid).toBe(true)
      expect(result.token).toBe('abc123token')
    })
  })

  describe('sanitizePrompt', () => {
    it('should remove excessive whitespace', () => {
      const prompt = 'A   dream   with    many    spaces'
      expect(sanitizePrompt(prompt)).toBe('A dream with many spaces')
    })

    it('should remove script tags', () => {
      const prompt = 'Dream <script>alert("xss")</script> scene'
      expect(sanitizePrompt(prompt)).not.toContain('<script>')
      expect(sanitizePrompt(prompt)).not.toContain('alert')
    })

    it('should remove HTML tags', () => {
      const prompt = '<div>Dream</div> <span>scene</span>'
      expect(sanitizePrompt(prompt)).toBe('Dream scene')
    })

    it('should limit length to 5000 characters', () => {
      const longPrompt = 'a'.repeat(6000)
      const sanitized = sanitizePrompt(longPrompt)
      expect(sanitized.length).toBe(5000)
    })

    it('should trim leading and trailing whitespace', () => {
      const prompt = '   Dream scene   '
      expect(sanitizePrompt(prompt)).toBe('Dream scene')
    })

    it('should handle empty string', () => {
      expect(sanitizePrompt('')).toBe('')
    })
  })

  describe('validateImageUrl', () => {
    it('should validate correct image URL', () => {
      const result = validateImageUrl('https://storage.googleapis.com/test/image.jpg')
      expect(result.valid).toBe(true)
    })

    it('should accept various image extensions', () => {
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      extensions.forEach(ext => {
        const result = validateImageUrl(`https://test.com/image.${ext}`)
        expect(result.valid).toBe(true)
      })
    })

    it('should reject non-HTTP protocols', () => {
      const result = validateImageUrl('ftp://test.com/image.jpg')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('HTTP or HTTPS')
    })

    it('should reject invalid extensions', () => {
      const result = validateImageUrl('https://test.com/file.pdf')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('valid extension')
    })

    it('should reject invalid URL format', () => {
      const result = validateImageUrl('not-a-url')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid URL format')
    })

    it('should be case insensitive for extensions', () => {
      const result = validateImageUrl('https://test.com/image.JPG')
      expect(result.valid).toBe(true)
    })
  })

  describe('calculateVideoGenerationCost', () => {
    it('should calculate cost for premium tier', () => {
      const cost = calculateVideoGenerationCost('premium', 6, 3)
      expect(cost).toBeGreaterThan(0)
      expect(cost).toBe(0.20 + (3 * 0.004) + (6 * 0.05) + (6 * 0.001))
    })

    it('should calculate cost for vip tier', () => {
      const cost = calculateVideoGenerationCost('vip', 45, 15)
      expect(cost).toBeGreaterThan(0)
      expect(cost).toBe(0.20 + (15 * 0.004) + (45 * 0.05) + (45 * 0.001))
    })

    it('should include base cost', () => {
      const cost = calculateVideoGenerationCost('premium', 1, 1)
      expect(cost).toBeGreaterThanOrEqual(0.20)
    })

    it('should scale with frame count', () => {
      const cost1 = calculateVideoGenerationCost('premium', 6, 3)
      const cost2 = calculateVideoGenerationCost('premium', 6, 10)
      expect(cost2).toBeGreaterThan(cost1)
    })

    it('should scale with duration', () => {
      const cost1 = calculateVideoGenerationCost('vip', 30, 10)
      const cost2 = calculateVideoGenerationCost('vip', 45, 10)
      expect(cost2).toBeGreaterThan(cost1)
    })
  })

  describe('getTierRestrictionMessage', () => {
    it('should return appropriate message for free tier', () => {
      const message = getTierRestrictionMessage('free')
      expect(message).toContain('Free plan')
      expect(message).toContain('Upgrade')
    })

    it('should return appropriate message for pro tier', () => {
      const message = getTierRestrictionMessage('pro')
      expect(message).toContain('Pro plan')
      expect(message).toContain('Upgrade')
    })

    it('should return appropriate message for premium tier', () => {
      const message = getTierRestrictionMessage('premium')
      expect(message).toContain('6-second')
    })

    it('should return appropriate message for vip tier', () => {
      const message = getTierRestrictionMessage('vip')
      expect(message).toContain('45-second')
    })
  })

  describe('isVideoAuthorizationError', () => {
    it('should identify authorization errors', () => {
      expect(isVideoAuthorizationError({ code: 'UNAUTHORIZED' })).toBe(true)
      expect(isVideoAuthorizationError({ code: 'AUTH_HEADER_MISSING' })).toBe(true)
      expect(isVideoAuthorizationError({ code: 'AUTH_HEADER_INVALID' })).toBe(true)
      expect(isVideoAuthorizationError({ code: 'AUTH_TOKEN_EMPTY' })).toBe(true)
    })

    it('should reject non-authorization errors', () => {
      expect(isVideoAuthorizationError({ code: 'INVALID_PAYLOAD' })).toBe(false)
      expect(isVideoAuthorizationError({ code: 'OTHER_ERROR' })).toBe(false)
    })

    it('should reject non-objects', () => {
      expect(isVideoAuthorizationError(null)).toBe(false)
      expect(isVideoAuthorizationError('error')).toBe(false)
      expect(isVideoAuthorizationError(123)).toBe(false)
    })
  })

  describe('isVideoValidationError', () => {
    it('should identify validation errors', () => {
      expect(isVideoValidationError({ code: 'INVALID_PAYLOAD' })).toBe(true)
    })

    it('should reject non-validation errors', () => {
      expect(isVideoValidationError({ code: 'UNAUTHORIZED' })).toBe(false)
      expect(isVideoValidationError({ code: 'OTHER_ERROR' })).toBe(false)
    })

    it('should reject non-objects', () => {
      expect(isVideoValidationError(null)).toBe(false)
      expect(isVideoValidationError('error')).toBe(false)
      expect(isVideoValidationError(123)).toBe(false)
    })
  })

  describe('ALLOWED_VIDEO_GENERATION_TIERS', () => {
    it('should contain only premium and vip tiers', () => {
      expect(ALLOWED_VIDEO_GENERATION_TIERS.size).toBe(2)
      expect(ALLOWED_VIDEO_GENERATION_TIERS.has('premium')).toBe(true)
      expect(ALLOWED_VIDEO_GENERATION_TIERS.has('vip')).toBe(true)
      expect(ALLOWED_VIDEO_GENERATION_TIERS.has('free')).toBe(false)
      expect(ALLOWED_VIDEO_GENERATION_TIERS.has('pro')).toBe(false)
    })
  })
})
