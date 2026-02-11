/**
 * Dream Input Checkpoints - Session 2 & 3
 * Coordinates subscription validation, title generation, image validation, and record integrity checks
 */

import { blink } from '../blink/client'
import { AI_PROMPTS } from '../config/aiPrompts'
import {
  guardSubscriptionUsageLimit,
  guardDreamTitle,
  guardImageUrl,
  guardDreamRecord,
} from './typeGuards'
import { calculateTextGenerationCost, calculateImageGenerationCost, logApiUsage } from './costTracking'
import {
  parseImageGenerationError,
  shouldRetryImageGeneration,
  formatImageErrorForUser,
  logImageGenerationError,
} from './imageGenerationErrors'
import {
  preprocessDreamImagePrompt,
  optimizePromptLength,
  validatePromptQuality,
} from './promptPreprocessor'
import type {
  CheckpointContext,
  TitleGenerationResult,
  ImageGenerationResult,
  DreamRecordIntegrity,
} from '../types/dream'
import type { ValidationRecommendation } from './inputValidationCheckpoint'
import { checkAndGrantLaunchOffer } from './launchOfferManager'

const MAX_IMAGE_RETRIES = 3
const MAX_TITLE_RETRIES = 2

/**
 * Checkpoint 3: Subscription Tier Validation
 * Validates user subscription and usage limits using type guards
 */
export async function validateSubscriptionLimits(
  context: CheckpointContext
): Promise<{
  passed: boolean
  canProceed: boolean
  message: string
  recommendations: ValidationRecommendation[]
  metadata?: Record<string, any>
}> {
  const recommendations: ValidationRecommendation[] = []

  // Use type guard to validate subscription limits
  const limitCheck = guardSubscriptionUsageLimit(
    context.dreamsUsedThisMonth,
    context.dreamLimit,
    context.subscriptionTier
  )

  if (!limitCheck.valid) {
    recommendations.push({
      checkpointId: 'checkpoint_3_subscription',
      checkpointName: 'Subscription Validation',
      severity: 'error',
      message: 'Failed to validate subscription limits',
      suggestion: 'Please refresh the page and try again. If the issue persists, contact support.',
      autoFixAvailable: false,
    })

    return {
      passed: false,
      canProceed: false,
      message: limitCheck.error || 'Invalid subscription data',
      recommendations,
    }
  }

  const limitData = limitCheck.value as {
    canCreate: boolean
    reason?: string
    dreamsRemaining?: number
    dreamsUsed: number
    dreamLimit: number
    subscriptionTier: string
  }

  if (!limitData.canCreate) {
    recommendations.push({
      checkpointId: 'checkpoint_3_subscription',
      checkpointName: 'Subscription Validation',
      severity: 'error',
      message: 'Monthly dream analysis limit reached',
      suggestion: limitData.reason || 'Upgrade your subscription to create more dream analyses.',
      autoFixAvailable: false,
    })

    return {
      passed: false,
      canProceed: false,
      message: limitData.reason || 'Usage limit reached',
      recommendations,
      metadata: {
        dreamsUsed: limitData.dreamsUsed,
        dreamLimit: limitData.dreamLimit,
        subscriptionTier: limitData.subscriptionTier,
      },
    }
  }

  // User can proceed
  return {
    passed: true,
    canProceed: true,
    message: `Subscription validated: ${limitData.dreamsRemaining} analyses remaining`,
    recommendations,
    metadata: {
      dreamsRemaining: limitData.dreamsRemaining,
      dreamsUsed: limitData.dreamsUsed,
      dreamLimit: limitData.dreamLimit,
      subscriptionTier: limitData.subscriptionTier,
    },
  }
}

/**
 * Checkpoint 4: AI Title Generation with Fallback
 * Generates dream title using AI with smart fallback handling
 */
export async function generateDreamTitle(
  context: CheckpointContext,
  userProfile?: { name?: string; age?: number }
): Promise<TitleGenerationResult> {
  const { userId, inputContent } = context

  let retries = 0
  let lastError: any = null

  while (retries < MAX_TITLE_RETRIES) {
    try {
      // Generate title using AI
      const titlePrompt = AI_PROMPTS.generateDreamTitle(inputContent)
      const titleResponse = await blink.ai.generateText({
        prompt: titlePrompt,
      })
      
      // Extract text from response (handles both text and steps formats)
      let generatedTitle = ''
      if (titleResponse?.text) {
        generatedTitle = titleResponse.text
      } else if ((titleResponse as any)?.steps && Array.isArray((titleResponse as any).steps)) {
        const steps = (titleResponse as any).steps
        const lastStep = steps[steps.length - 1]
        generatedTitle = lastStep?.text || ''
      }

      // Track AI usage
      await logApiUsage({
        userId,
        operationType: 'text_generation',
        modelUsed: 'gpt-4.1-mini',
        tokensUsed: titlePrompt.length + generatedTitle.length,
        estimatedCostUsd: calculateTextGenerationCost(
          'gpt-4.1-mini',
          titlePrompt.length,
          generatedTitle.length
        ),
        inputSize: titlePrompt.length,
        outputSize: generatedTitle.length,
        metadata: { operation: 'title_generation', dreamId: context.dreamId, attempt: retries + 1 },
      })

      // Validate and clean title using type guard
      let cleanTitle = generatedTitle.trim().replace(/["']/g, '')
      const titleGuard = guardDreamTitle(cleanTitle)

      if (!titleGuard.valid) {
        console.warn('AI generated invalid title, using fallback', titleGuard.error)
        return createFallbackTitle(inputContent, 'Invalid AI title format')
      }

      // Use validated title
      cleanTitle = titleGuard.value as string

      // Enforce 5-word maximum
      const words = cleanTitle.split(/\s+/)
      if (words.length > 5) {
        cleanTitle = words.slice(0, 5).join(' ')
      }

      return {
        title: cleanTitle,
        usedFallback: false,
        tokensUsed: titlePrompt.length + generatedTitle.length,
        costUsd: calculateTextGenerationCost('gpt-4.1-mini', titlePrompt.length, generatedTitle.length),
      }
    } catch (error) {
      lastError = error
      retries++
      console.error(`Title generation attempt ${retries} failed:`, error)

      if (retries < MAX_TITLE_RETRIES) {
        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000))
      }
    }
  }

  // All retries failed, use fallback
  console.error('AI title generation failed after retries, using fallback')
  return createFallbackTitle(inputContent, lastError?.message || 'AI generation failed')
}

/**
 * Create fallback title from dream content
 */
function createFallbackTitle(content: string, reason: string): TitleGenerationResult {
  // Extract first meaningful words from content
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2) // Remove short words
    .slice(0, 5)

  let fallbackTitle = words.join(' ')

  // If too short, use generic title
  if (fallbackTitle.length < 10) {
    const timestamp = new Date().toLocaleDateString()
    fallbackTitle = `Dream from ${timestamp}`
  }

  // Capitalize first letter
  fallbackTitle = fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1)

  // Validate fallback title
  const titleGuard = guardDreamTitle(fallbackTitle)
  if (!titleGuard.valid) {
    // Last resort fallback
    fallbackTitle = `Dream ${Date.now().toString().slice(-6)}`
  } else {
    fallbackTitle = titleGuard.value as string
  }

  return {
    title: fallbackTitle,
    usedFallback: true,
    fallbackReason: reason,
    tokensUsed: 0,
    costUsd: 0,
  }
}

/**
 * Checkpoint 5: Image Generation with Validation
 * Generates dream image with comprehensive error recovery
 */
export async function generateDreamImage(
  context: CheckpointContext,
  imagePrompt: string,
  subscriptionTier: string
): Promise<ImageGenerationResult> {
  const { userId, dreamId, hasLaunchOffer } = context

  // Only generate images for paid users OR launch offer users (free tier promo)
  const isPaidUser = subscriptionTier === 'pro' || subscriptionTier === 'premium' || subscriptionTier === 'vip'
  const canGenerate = isPaidUser || (subscriptionTier === 'free' && hasLaunchOffer)

  if (!canGenerate) {
    return {
      imageUrl: '',
      success: false,
      retryCount: 0,
      fallbackUsed: true,
      errorMessage: 'Image generation not available for free tier',
    }
  }

  let retries = 0
  let lastError: any = null
  const startTime = Date.now()

  while (retries < MAX_IMAGE_RETRIES) {
    try {
      console.log(`🎨 Image generation attempt ${retries + 1}/${MAX_IMAGE_RETRIES}`)

      // Preprocess and validate prompt for optimal image quality
      let enhancedPrompt = preprocessDreamImagePrompt(imagePrompt)
      const qualityValidation = validatePromptQuality(enhancedPrompt)
      
      if (!qualityValidation.isValid) {
        console.warn('⚠️ Prompt quality issues detected:', qualityValidation.issues)
      }

      // Optimize prompt length while preserving quality
      enhancedPrompt = optimizePromptLength(enhancedPrompt, 1000)
      
      console.log('📝 Enhanced prompt length:', enhancedPrompt.length, 'chars')

      const imageResponse = await blink.ai.generateImage({
        prompt: enhancedPrompt,
        n: 1,
      })

      // Validate response structure
      if (!imageResponse || !imageResponse.data || !Array.isArray(imageResponse.data)) {
        throw new Error('Invalid image generation response structure')
      }

      if (imageResponse.data.length === 0) {
        throw new Error('No images returned from AI generation')
      }

      const firstImage = imageResponse.data[0]
      if (!firstImage || !firstImage.url) {
        throw new Error('Image data missing URL')
      }

      // Validate image URL using type guard
      const urlGuard = guardImageUrl(firstImage.url)
      if (!urlGuard.valid) {
        throw new Error(urlGuard.error || 'Invalid image URL')
      }

      const imageUrl = urlGuard.value as string

      // Track successful generation
      await logApiUsage({
        userId,
        operationType: 'image_generation',
        modelUsed: 'gemini-2.5-flash-image',
        tokensUsed: 7500,
        estimatedCostUsd: calculateImageGenerationCost(1),
        inputSize: imagePrompt.length,
        outputSize: 1,
        metadata: {
          operation: 'dream_image_generation',
          dreamId,
          retries,
          durationMs: Date.now() - startTime,
        },
      })

      console.log('✅ Image generation successful')

      return {
        imageUrl,
        success: true,
        retryCount: retries,
        fallbackUsed: false,
        tokensUsed: 7500,
        costUsd: calculateImageGenerationCost(1),
      }
    } catch (error: any) {
      lastError = error
      const parsedError = parseImageGenerationError(error)

      // Log error details
      logImageGenerationError(parsedError, {
        userId,
        dreamId,
        attemptNumber: retries + 1,
        promptLength: imagePrompt.length,
      })

      // Determine if we should retry
      const shouldRetry = shouldRetryImageGeneration(parsedError, retries, MAX_IMAGE_RETRIES)

      if (shouldRetry) {
        retries++
        const delayMs = Math.pow(2, retries) * 1000
        console.log(`⏳ Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      } else {
        // Error is not retryable
        console.error('❌ Image generation failed (not retryable)')
        break
      }
    }
  }

  // All retries failed
  const parsedError = parseImageGenerationError(lastError)
  const userMessage = formatImageErrorForUser(parsedError, retries, MAX_IMAGE_RETRIES)

  // Track failed generation
  await logApiUsage({
    userId,
    operationType: 'image_generation',
    modelUsed: 'gemini-2.5-flash-image',
    tokensUsed: 0,
    estimatedCostUsd: 0,
    success: false,
    errorMessage: parsedError.technicalMessage,
    metadata: {
      operation: 'dream_image_generation',
      dreamId,
      errorCode: parsedError.code,
      totalRetries: retries,
    },
  })

  return {
    imageUrl: '',
    success: false,
    retryCount: retries,
    fallbackUsed: true,
    errorMessage: userMessage,
  }
}

/**
 * Checkpoint 6: Dream Record Integrity Check
 * Validates dream record before database write
 */
export function validateDreamIntegrity(dreamRecord: any): DreamRecordIntegrity {
  // Use type guard to validate record
  const recordGuard = guardDreamRecord(dreamRecord)

  if (!recordGuard.valid) {
    const guardValue = recordGuard.value as {
      canSave: boolean
      missingFields: string[]
      invalidFields: Record<string, string>
    }

    const recommendations: string[] = []

    // Generate recommendations for missing fields
    if (guardValue.missingFields.length > 0) {
      recommendations.push(
        `Missing required fields: ${guardValue.missingFields.join(', ')}. Please provide all required information.`
      )
    }

    // Generate recommendations for invalid fields
    const invalidFieldEntries = Object.entries(guardValue.invalidFields)
    if (invalidFieldEntries.length > 0) {
      for (const [field, error] of invalidFieldEntries) {
        recommendations.push(`${field}: ${error}`)
      }
    }

    return {
      isValid: false,
      missingFields: guardValue.missingFields,
      invalidFields: guardValue.invalidFields,
      canSave: false,
      recommendations,
    }
  }

  // Record is valid
  return {
    isValid: true,
    missingFields: [],
    invalidFields: {},
    canSave: true,
    recommendations: [],
  }
}

/**
 * Execute all checkpoints in sequence
 * Returns comprehensive result with all checkpoint data
 */
export async function executeAllCheckpoints(
  context: CheckpointContext,
  options: {
    generateTitle?: boolean
    generateImage?: boolean
    imagePrompt?: string
    userProfile?: { name?: string; age?: number }
  } = {}
): Promise<{
  subscriptionCheck: Awaited<ReturnType<typeof validateSubscriptionLimits>>
  titleGeneration?: TitleGenerationResult
  imageGeneration?: ImageGenerationResult
  overallSuccess: boolean
}> {
  // Checkpoint 3: Subscription validation
  const subscriptionCheck = await validateSubscriptionLimits(context)

  if (!subscriptionCheck.canProceed) {
    return {
      subscriptionCheck,
      overallSuccess: false,
    }
  }

  // Checkpoint 4: Title generation (optional)
  let titleGeneration: TitleGenerationResult | undefined
  if (options.generateTitle) {
    titleGeneration = await generateDreamTitle(context, options.userProfile)
  }

  // Checkpoint 5: Image generation (optional)
  let imageGeneration: ImageGenerationResult | undefined
  if (options.generateImage && options.imagePrompt) {
    imageGeneration = await generateDreamImage(context, options.imagePrompt, context.subscriptionTier)
  }

  return {
    subscriptionCheck,
    titleGeneration,
    imageGeneration,
    overallSuccess: true,
  }
}