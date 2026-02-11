/**
 * Video Generation Security Utilities
 * Helpers for validating video generation permissions and payloads
 * 
 * ⚠️ IMPORTANT: Uses centralized tier capabilities config
 */

import type { SubscriptionTier } from '../config/tierCapabilities'

// Tiers that can generate videos
export const ALLOWED_VIDEO_GENERATION_TIERS: Set<SubscriptionTier> = new Set(['premium', 'vip'])

/**
 * Check if a subscription tier can generate videos
 */
export function canGenerateVideoForTier(tier: SubscriptionTier): boolean {
  return ALLOWED_VIDEO_GENERATION_TIERS.has(tier)
}

/**
 * Get video duration limits for subscription tier
 */
export function getVideoDurationForTier(tier: SubscriptionTier): number {
  switch (tier) {
    case 'premium':
      return 6 // 6 seconds
    case 'vip':
      return 45 // 45 seconds
    default:
      return 0 // No video generation
  }
}

/**
 * Get max frames allowed for subscription tier
 */
export function getMaxFramesForTier(tier: SubscriptionTier): number {
  switch (tier) {
    case 'premium':
      return 3 // 3 frames for 6-second video
    case 'vip':
      return 15 // 15 frames for 45-second video
    default:
      return 0 // No video generation
  }
}

/**
 * Validate video generation request payload structure
 */
export interface VideoGenerationPayloadValidation {
  valid: boolean
  error?: string
  sanitized?: {
    imageUrl: string
    prompt: string
    userId: string
    subscriptionTier: SubscriptionTier
    durationSeconds?: number
  }
}

export function validateVideoGenerationPayload(
  payload: unknown
): VideoGenerationPayloadValidation {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Payload must be an object'
    }
  }

  const data = payload as Record<string, unknown>

  // Validate imageUrl
  if (!data.imageUrl || typeof data.imageUrl !== 'string' || data.imageUrl.trim() === '') {
    return {
      valid: false,
      error: 'imageUrl is required and must be a non-empty string'
    }
  }

  // Validate imageUrl format
  try {
    const url = new URL(data.imageUrl)
    if (!url.protocol.startsWith('http')) {
      return {
        valid: false,
        error: 'imageUrl must use HTTP or HTTPS protocol'
      }
    }
  } catch {
    return {
      valid: false,
      error: 'imageUrl must be a valid URL'
    }
  }

  // Validate prompt
  if (!data.prompt || typeof data.prompt !== 'string' || data.prompt.trim() === '') {
    return {
      valid: false,
      error: 'prompt is required and must be a non-empty string'
    }
  }

  if (data.prompt.length > 5000) {
    return {
      valid: false,
      error: 'prompt exceeds maximum length of 5000 characters'
    }
  }

  // Validate userId
  if (!data.userId || typeof data.userId !== 'string' || data.userId.trim() === '') {
    return {
      valid: false,
      error: 'userId is required and must be a non-empty string'
    }
  }

  // Validate subscriptionTier
  const validTiers: SubscriptionTier[] = ['free', 'pro', 'premium', 'vip']
  if (!data.subscriptionTier || !validTiers.includes(data.subscriptionTier as SubscriptionTier)) {
    return {
      valid: false,
      error: 'subscriptionTier must be one of: free, pro, premium, vip'
    }
  }

  const tier = data.subscriptionTier as SubscriptionTier

  // Check if tier allows video generation
  if (!canGenerateVideoForTier(tier)) {
    return {
      valid: false,
      error: `Video generation is only available for Premium and VIP tiers. Current tier: ${tier}`
    }
  }

  // Validate durationSeconds if provided
  if (data.durationSeconds !== undefined) {
    if (typeof data.durationSeconds !== 'number' || data.durationSeconds <= 0) {
      return {
        valid: false,
        error: 'durationSeconds must be a positive number'
      }
    }

    const maxDuration = getVideoDurationForTier(tier)
    if (data.durationSeconds > maxDuration) {
      return {
        valid: false,
        error: `durationSeconds exceeds maximum of ${maxDuration} seconds for ${tier} tier`
      }
    }
  }

  return {
    valid: true,
    sanitized: {
      imageUrl: data.imageUrl.trim(),
      prompt: data.prompt.trim(),
      userId: data.userId.trim(),
      subscriptionTier: tier,
      durationSeconds: data.durationSeconds as number | undefined
    }
  }
}

/**
 * Validate authorization token format
 */
export function validateAuthorizationToken(token: string | null): {
  valid: boolean
  error?: string
  token?: string
} {
  if (!token) {
    return {
      valid: false,
      error: 'Authorization token is missing'
    }
  }

  if (!token.startsWith('Bearer ')) {
    return {
      valid: false,
      error: 'Authorization token must use Bearer format'
    }
  }

  const extractedToken = token.replace('Bearer ', '').trim()
  
  if (extractedToken === '') {
    return {
      valid: false,
      error: 'Authorization token is empty'
    }
  }

  return {
    valid: true,
    token: extractedToken
  }
}

/**
 * Sanitize prompt text (remove potentially harmful content)
 */
export function sanitizePrompt(prompt: string): string {
  // Remove excessive whitespace
  let sanitized = prompt.trim().replace(/\s+/g, ' ')
  
  // Remove any script tags or HTML
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
  sanitized = sanitized.replace(/<[^>]+>/g, '')
  
  // Limit length
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000)
  }
  
  return sanitized
}

/**
 * Validate image URL format and extension
 */
export function validateImageUrl(url: string): {
  valid: boolean
  error?: string
} {
  try {
    const parsedUrl = new URL(url)
    
    // Check protocol
    if (!parsedUrl.protocol.startsWith('http')) {
      return {
        valid: false,
        error: 'Image URL must use HTTP or HTTPS protocol'
      }
    }
    
    // Check for valid image extension
    const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase()
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    
    if (!extension || !validExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Image URL must have a valid extension: ${validExtensions.join(', ')}`
      }
    }
    
    return { valid: true }
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format'
    }
  }
}

/**
 * Calculate estimated cost for video generation
 */
export function calculateVideoGenerationCost(
  tier: SubscriptionTier,
  durationSeconds: number,
  framesGenerated: number
): number {
  const baseCost = 0.20
  const perFrameCost = 0.004
  const perSecondCost = 0.05
  const storageCost = 0.001 * durationSeconds
  
  return baseCost + (framesGenerated * perFrameCost) + (durationSeconds * perSecondCost) + storageCost
}

/**
 * Get user-friendly error message for tier restriction
 */
export function getTierRestrictionMessage(currentTier: SubscriptionTier): string {
  switch (currentTier) {
    case 'free':
      return 'Video generation is not available on the Free plan. Upgrade to Premium or VIP to generate dream videos.'
    case 'pro':
      return 'Video generation is not available on the Pro plan. Upgrade to Premium or VIP to generate dream videos.'
    case 'premium':
      return 'Premium plan includes 6-second dream videos.'
    case 'vip':
      return 'VIP plan includes 45-second cinematic DreamWorlds videos.'
  }
}

/**
 * Type guard: check if error is a video generation authorization error
 */
export function isVideoAuthorizationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as Record<string, unknown>
  return (
    typeof err.code === 'string' &&
    (err.code === 'UNAUTHORIZED' || 
     err.code === 'AUTH_HEADER_MISSING' || 
     err.code === 'AUTH_HEADER_INVALID' ||
     err.code === 'AUTH_TOKEN_EMPTY')
  )
}

/**
 * Type guard: check if error is a video generation validation error
 */
export function isVideoValidationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as Record<string, unknown>
  return typeof err.code === 'string' && err.code === 'INVALID_PAYLOAD'
}
