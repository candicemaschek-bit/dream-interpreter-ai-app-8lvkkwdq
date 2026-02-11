/**
 * Image Generation Error Handler
 * Provides specific error messages and recovery suggestions for image generation failures
 */

export interface ImageGenerationError {
  code: string
  userMessage: string
  technicalMessage: string
  suggestion: string
  isRetryable: boolean
}

/**
 * Parse image generation errors and provide user-friendly guidance
 */
export function parseImageGenerationError(error: any): ImageGenerationError {
  const errorStr = error?.message || error?.toString() || String(error)
  const errorLower = errorStr.toLowerCase()

  // Authentication/Permission errors
  if (errorLower.includes('unauthorized') || errorLower.includes('forbidden') || errorLower.includes('401') || errorLower.includes('403')) {
    return {
      code: 'AUTH_ERROR',
      userMessage: 'Authentication expired. Please sign in again.',
      technicalMessage: 'Authentication failed for image generation',
      suggestion: 'Refresh the page and try again',
      isRetryable: true
    }
  }

  // Rate limiting errors
  if (errorLower.includes('rate limit') || errorLower.includes('429') || errorLower.includes('too many requests')) {
    return {
      code: 'RATE_LIMIT',
      userMessage: 'Too many requests. Please wait a moment and try again.',
      technicalMessage: 'Rate limit exceeded for image generation',
      suggestion: 'Wait 30-60 seconds before generating another image',
      isRetryable: true
    }
  }

  // Timeout errors
  if (errorLower.includes('timeout') || errorLower.includes('timed out') || errorLower.includes('408')) {
    return {
      code: 'TIMEOUT',
      userMessage: 'Image generation took too long. Please try again.',
      technicalMessage: 'Request timeout during image generation',
      suggestion: 'This can happen with complex prompts. Try a shorter description.',
      isRetryable: true
    }
  }

  // Invalid prompt/content errors
  if (errorLower.includes('invalid') || errorLower.includes('content') || errorLower.includes('inappropriate')) {
    return {
      code: 'INVALID_CONTENT',
      userMessage: 'The dream description contains content that cannot be visualized.',
      technicalMessage: 'Invalid content for image generation',
      suggestion: 'Try describing your dream with different words or focus on different elements',
      isRetryable: false
    }
  }

  // API service errors
  if (errorLower.includes('service unavailable') || errorLower.includes('503') || errorLower.includes('502') || errorLower.includes('500')) {
    return {
      code: 'SERVICE_ERROR',
      userMessage: 'Image generation service is temporarily unavailable.',
      technicalMessage: 'Image generation service returned an error',
      suggestion: 'Please try again in a few moments',
      isRetryable: true
    }
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('connection')) {
    return {
      code: 'NETWORK_ERROR',
      userMessage: 'Network connection issue. Please check your internet and try again.',
      technicalMessage: 'Network error during image generation',
      suggestion: 'Check your internet connection and try again',
      isRetryable: true
    }
  }

  // Billing/quota errors
  if (errorLower.includes('quota') || errorLower.includes('billing') || errorLower.includes('credit')) {
    return {
      code: 'QUOTA_ERROR',
      userMessage: 'You have reached your image generation quota.',
      technicalMessage: 'Quota exceeded or billing issue',
      suggestion: 'Upgrade your plan to generate more images',
      isRetryable: false
    }
  }

  // Generic fallback
  return {
    code: 'UNKNOWN_ERROR',
    userMessage: 'Unable to generate dream image. Please try again.',
    technicalMessage: `Image generation failed: ${errorStr}`,
    suggestion: 'Try again or describe your dream differently',
    isRetryable: true
  }
}

/**
 * Get retry delay based on error type (exponential backoff)
 */
export function getRetryDelay(error: ImageGenerationError, attemptNumber: number): number {
  // Rate limit: longer delay
  if (error.code === 'RATE_LIMIT') {
    return 30000 + (attemptNumber * 10000) // 30s + 10s per attempt
  }
  
  // Timeout: moderate delay
  if (error.code === 'TIMEOUT') {
    return 5000 * Math.pow(2, attemptNumber)
  }

  // Service error: moderate delay with backoff
  if (error.code === 'SERVICE_ERROR') {
    return 3000 * Math.pow(2, attemptNumber)
  }

  // Default backoff
  return 1000 * Math.pow(2, attemptNumber)
}

/**
 * Determine if error is worth retrying
 */
export function shouldRetryImageGeneration(error: ImageGenerationError, attemptCount: number, maxRetries: number = 3): boolean {
  if (attemptCount >= maxRetries) {
    return false
  }

  // Don't retry non-retryable errors
  if (!error.isRetryable) {
    return false
  }

  // Don't retry invalid content
  if (error.code === 'INVALID_CONTENT' || error.code === 'QUOTA_ERROR') {
    return false
  }

  return true
}

/**
 * Format error message for toast notification with suggestion
 */
export function formatImageErrorForUser(error: ImageGenerationError, attemptNumber: number = 1, maxRetries: number = 3): string {
  let message = error.userMessage

  if (error.isRetryable && attemptNumber < maxRetries) {
    message += ` (Attempt ${attemptNumber}/${maxRetries})`
  }

  if (error.suggestion) {
    message += ` — ${error.suggestion}`
  }

  return message
}

/**
 * Log image generation error for debugging
 */
export function logImageGenerationError(error: ImageGenerationError, context: {
  userId?: string
  dreamId?: string
  attemptNumber?: number
  promptLength?: number
}): void {
  console.error('🎨 Image Generation Error:', {
    code: error.code,
    technical: error.technicalMessage,
    user: error.userMessage,
    isRetryable: error.isRetryable,
    context
  })
}
