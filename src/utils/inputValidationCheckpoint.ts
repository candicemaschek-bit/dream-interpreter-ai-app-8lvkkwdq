/**
 * Input Validation Checkpoint System
 * Provides hybrid validation with type guards, AI-powered validation, and recommendation generation
 */

import { blink } from '../blink/client'
import { validateEmotionalContent, categorizeEmotions } from './emotionValidation'
import { AI_PROMPTS } from '../config/aiPrompts'
import { GLOBAL_DREAM_INPUT_CAP } from './inputBudget'

// Checkpoint status types
export type CheckpointStatus = 'pending' | 'validating' | 'passed' | 'failed' | 'skipped'

// Checkpoint recommendation types
export interface ValidationRecommendation {
  checkpointId: string
  checkpointName: string
  severity: 'error' | 'warning' | 'suggestion'
  message: string
  suggestion: string
  autoFixAvailable: boolean
  autoFixAction?: () => Promise<void>
}

// Individual checkpoint result
export interface CheckpointResult {
  id: string
  name: string
  status: CheckpointStatus
  passed: boolean
  message?: string
  recommendations: ValidationRecommendation[]
  metadata?: Record<string, any>
}

// Overall validation result
export interface ValidationCheckpointResult {
  isValid: boolean
  checkpoints: CheckpointResult[]
  recommendations: ValidationRecommendation[]
  overallMessage: string
}

/**
 * Checkpoint 1: Input Content Type Safety
 * Validates that input content matches expected type and has minimum quality
 */
export async function validateInputContentType(
  content: string,
  inputType: 'text' | 'voice' | 'symbols' | 'image'
): Promise<CheckpointResult> {
  const checkpointId = 'checkpoint_1_type_safety'
  const checkpointName = 'Input Content Type Safety'
  const recommendations: ValidationRecommendation[] = []

  // Type guard: Ensure content is a string
  if (typeof content !== 'string') {
    return {
      id: checkpointId,
      name: checkpointName,
      status: 'failed',
      passed: false,
      message: 'Content must be a string',
      recommendations: [{
        checkpointId,
        checkpointName,
        severity: 'error',
        message: 'Invalid content type detected',
        suggestion: 'Content must be text or converted to text. Please try again with valid text input.',
        autoFixAvailable: false
      }],
      metadata: { actualType: typeof content }
    }
  }

  // Validate content is not empty
  const trimmedContent = content.trim()
  if (trimmedContent.length === 0) {
    return {
      id: checkpointId,
      name: checkpointName,
      status: 'failed',
      passed: false,
      message: 'Content cannot be empty',
      recommendations: [{
        checkpointId,
        checkpointName,
        severity: 'error',
        message: 'No content provided',
        suggestion: 'Please describe your dream in detail. Include scenes, feelings, and any memorable moments.',
        autoFixAvailable: false
      }],
      metadata: { contentLength: trimmedContent.length }
    }
  }

  // Minimum length validation (at least 20 characters for meaningful analysis)
  if (trimmedContent.length < 20) {
    recommendations.push({
      checkpointId,
      checkpointName,
      severity: 'warning',
      message: 'Content is too brief for detailed interpretation',
      suggestion: 'For better dream interpretation, please provide at least 20 characters. Describe what you saw, how you felt, and any significant details.',
      autoFixAvailable: false
    })
  }

  // Maximum length validation (prevent abuse)
  if (trimmedContent.length > GLOBAL_DREAM_INPUT_CAP) {
    return {
      id: checkpointId,
      name: checkpointName,
      status: 'failed',
      passed: false,
      message: 'Content exceeds maximum length',
      recommendations: [{
        checkpointId,
        checkpointName,
        severity: 'error',
        message: 'Dream description is too long',
        suggestion: `Please keep your dream description under ${GLOBAL_DREAM_INPUT_CAP.toLocaleString()} characters. Focus on the most significant moments and emotions.`,
        autoFixAvailable: false
      }],
      metadata: { contentLength: trimmedContent.length, maxLength: GLOBAL_DREAM_INPUT_CAP }
    }
  }

  // Check for mostly special characters (spam detection)
  const specialCharRatio = (trimmedContent.match(/[^a-zA-Z0-9\s.,!?'-]/g) || []).length / trimmedContent.length
  if (specialCharRatio > 0.3) {
    recommendations.push({
      checkpointId,
      checkpointName,
      severity: 'warning',
      message: 'Content contains many special characters',
      suggestion: 'Your dream description contains many special characters. Please use standard words and punctuation for better interpretation.',
      autoFixAvailable: false
    })
  }

  // Check for repeated characters (spam/gibberish detection)
  if (/(.)\\1{9,}/.test(trimmedContent)) {
    return {
      id: checkpointId,
      name: checkpointName,
      status: 'failed',
      passed: false,
      message: 'Content appears to contain gibberish',
      recommendations: [{
        checkpointId,
        checkpointName,
        severity: 'error',
        message: 'Repeated characters detected',
        suggestion: 'Please provide a meaningful description of your dream using regular words and sentences.',
        autoFixAvailable: false
      }],
      metadata: { detectedPattern: 'repeated_characters' }
    }
  }

  // All checks passed
  return {
    id: checkpointId,
    name: checkpointName,
    status: 'passed',
    passed: true,
    message: 'Input content is valid',
    recommendations,
    metadata: {
      contentLength: trimmedContent.length,
      inputType
    }
  }
}

/**
 * Checkpoint 2: Emotion Validation with AI Fallback
 * First attempts rule-based emotion detection, falls back to AI if needed
 */
export async function validateEmotionalContentCheckpoint(
  content: string,
  useAIFallback: boolean = true
): Promise<CheckpointResult> {
  const checkpointId = 'checkpoint_2_emotion_validation'
  const checkpointName = 'Emotion Validation'
  const recommendations: ValidationRecommendation[] = []

  // Step 1: Rule-based emotion validation
  const ruleBasedValidation = validateEmotionalContent(content)

  if (ruleBasedValidation.isValid) {
    // Rule-based validation passed
    const categorized = categorizeEmotions(ruleBasedValidation.detectedEmotions)
    
    return {
      id: checkpointId,
      name: checkpointName,
      status: 'passed',
      passed: true,
      message: `Detected ${ruleBasedValidation.emotionCount} emotion(s)`,
      recommendations,
      metadata: {
        method: 'rule_based',
        detectedEmotions: ruleBasedValidation.detectedEmotions,
        emotionCategories: categorized
      }
    }
  }

  // Step 2: AI Fallback with Timeout (STRATEGY 2)
  // Try AI validation with 5-second timeout - if it fails, gracefully degrade
  if (useAIFallback) {
    try {
      const aiEmotionPrompt = AI_PROMPTS.detectEmotionalContent(content)

      // STRATEGY 2 KEY: Wrap AI call in Promise.race with 5-second timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI validation timeout (5s exceeded)')), 5000)
      )

      const aiPromise = blink.ai.generateText({
        prompt: aiEmotionPrompt
      })

      // Race: whoever finishes first wins
      // If timeout wins, we catch error and degrade gracefully to rule-based
      const aiResponse = await Promise.race([aiPromise, timeoutPromise])

      // DEFENSIVE: Try multiple fallback paths to extract text
      const responseText = aiResponse?.text || 
                          (aiResponse as any)?.steps?.[0]?.text ||
                          null

      if (!responseText || typeof responseText !== 'string') {
        console.warn('⚠️ AI emotion validation: Response text not found, gracefully degrading to rule-based', {
          hasText: !!aiResponse?.text,
          hasSteps: !!aiResponse?.steps,
          responsePreview: JSON.stringify(aiResponse).substring(0, 150)
        })
        // SILENT FALLBACK - throw graceful error, don't block user
        throw new Error('GRACEFUL_FALLBACK_NO_TEXT')
      }

      // Parse response
      const cleanResponse = responseText.trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      if (!cleanResponse) {
        console.warn('⚠️ AI emotion validation: Empty response after cleaning, gracefully degrading')
        throw new Error('GRACEFUL_FALLBACK_EMPTY')
      }
      
      let aiResult: {
        hasEmotionalContent: boolean
        detectedEmotions: string[]
        confidence: number
        suggestion?: string
      }
      
      try {
        aiResult = JSON.parse(cleanResponse)
      } catch (parseError) {
        console.warn('⚠️ AI emotion validation: JSON parse error, gracefully degrading', {
          responsePreview: cleanResponse.substring(0, 100)
        })
        throw new Error('GRACEFUL_FALLBACK_PARSE_ERROR')
      }
      
      // Validate parsed result
      if (typeof aiResult?.hasEmotionalContent !== 'boolean') {
        console.warn('⚠️ AI emotion validation: Invalid structure, gracefully degrading')
        throw new Error('GRACEFUL_FALLBACK_INVALID_STRUCTURE')
      }
      
      // Ensure arrays and numbers are correct types
      if (!Array.isArray(aiResult.detectedEmotions)) {
        aiResult.detectedEmotions = []
      }
      if (typeof aiResult.confidence !== 'number') {
        aiResult.confidence = aiResult.hasEmotionalContent ? 0.7 : 0.3
      }

      // If AI detected sufficient emotions, return AI success
      if (aiResult.hasEmotionalContent && aiResult.confidence >= 0.6) {
        console.log('✅ AI emotion validation succeeded:', {
          emotionCount: aiResult.detectedEmotions.length,
          confidence: `${Math.round(aiResult.confidence * 100)}%`
        })
        
        return {
          id: checkpointId,
          name: checkpointName,
          status: 'passed',
          passed: true,
          message: `AI detected ${aiResult.detectedEmotions.length} emotion(s) (${Math.round(aiResult.confidence * 100)}% confidence)`,
          recommendations,
          metadata: {
            method: 'ai_fallback_success',
            detectedEmotions: aiResult.detectedEmotions,
            confidence: aiResult.confidence
          }
        }
      }

      // AI found insufficient emotions - still fail with AI suggestion
      console.log('⚠️ AI validation: Insufficient emotional content, returning failure with AI suggestion')
      
      recommendations.push({
        checkpointId,
        checkpointName,
        severity: 'error',
        message: 'Insufficient emotional content detected',
        suggestion: aiResult.suggestion || 'Please describe how you felt during the dream. Include emotions like fear, joy, confusion, anxiety, sadness, or excitement.',
        autoFixAvailable: false
      })

      return {
        id: checkpointId,
        name: checkpointName,
        status: 'failed',
        passed: false,
        message: 'No emotional content detected',
        recommendations,
        metadata: {
          method: 'ai_fallback_insufficient_emotions',
          confidence: aiResult.confidence
        }
      }

    } catch (aiError: any) {
      // STRATEGY 2 KEY: SILENT FALLBACK on ANY AI error
      // Never throw - always degrade gracefully
      const errorMsg = aiError?.message || String(aiError)
      
      console.warn('⚠️ AI emotion validation failed, gracefully falling back to rule-based:', {
        error: errorMsg,
        reason: errorMsg.includes('timeout') ? 'Timeout exceeded' :
                errorMsg.includes('GRACEFUL_FALLBACK') ? 'Response parsing issue' :
                'Network or AI service error'
      })
      
      // DON'T re-throw - just continue to rule-based fallback below
    }
  }

  // FALLBACK: Use rule-based result (either AI was disabled or failed)
  if (ruleBasedValidation.isValid) {
    return {
      id: checkpointId,
      name: checkpointName,
      status: 'passed',
      passed: true,
      message: `Detected ${ruleBasedValidation.emotionCount} emotion(s) (rule-based validation)`,
      recommendations,
      metadata: {
        method: 'rule_based_fallback_pass',
        detectedEmotions: ruleBasedValidation.detectedEmotions
      }
    }
  }

  // Rule-based also failed
  recommendations.push({
    checkpointId,
    checkpointName,
    severity: 'error',
    message: 'Insufficient emotional content detected',
    suggestion: ruleBasedValidation.suggestionMessage || 'Please describe how you felt during the dream. Include emotions like fear, joy, confusion, anxiety, sadness, or excitement.',
    autoFixAvailable: false
  })

  return {
    id: checkpointId,
    name: checkpointName,
    status: 'failed',
    passed: false,
    message: 'No emotional content detected',
    recommendations,
    metadata: {
      method: 'rule_based_fallback_fail',
      detectedEmotions: ruleBasedValidation.detectedEmotions
    }
  }
}

/**
 * Execute Checkpoints 1-2 (Session 1: Foundation)
 * Returns validation result with checkpoint tracking and recommendations
 */
export async function executeSession1Checkpoints(
  content: string,
  inputType: 'text' | 'voice' | 'symbols' | 'image',
  options: {
    useAIFallback?: boolean
  } = {}
): Promise<ValidationCheckpointResult> {
  const { useAIFallback = true } = options
  const checkpoints: CheckpointResult[] = []
  const allRecommendations: ValidationRecommendation[] = []

  // Checkpoint 1: Input Content Type Safety
  const checkpoint1 = await validateInputContentType(content, inputType)
  checkpoints.push(checkpoint1)
  allRecommendations.push(...checkpoint1.recommendations)

  // Only proceed to Checkpoint 2 if Checkpoint 1 passed
  if (checkpoint1.passed) {
    // Checkpoint 2: Emotion Validation
    const checkpoint2 = await validateEmotionalContentCheckpoint(content, useAIFallback)
    checkpoints.push(checkpoint2)
    allRecommendations.push(...checkpoint2.recommendations)
  } else {
    // Checkpoint 1 failed, skip Checkpoint 2
    checkpoints.push({
      id: 'checkpoint_2_emotion_validation',
      name: 'Emotion Validation',
      status: 'skipped',
      passed: false,
      message: 'Skipped due to previous checkpoint failure',
      recommendations: []
    })
  }

  // Determine overall validation status
  const allPassed = checkpoints.every(cp => cp.passed)
  const criticalFailures = allRecommendations.filter(r => r.severity === 'error')

  let overallMessage = ''
  if (allPassed) {
    overallMessage = '✓ All validation checkpoints passed'
  } else if (criticalFailures.length > 0) {
    overallMessage = `✗ Validation failed: ${criticalFailures.length} critical issue(s) found`
  } else {
    overallMessage = `⚠ Validation passed with ${allRecommendations.length} warning(s)`
  }

  return {
    isValid: allPassed && criticalFailures.length === 0,
    checkpoints,
    recommendations: allRecommendations,
    overallMessage
  }
}

/**
 * Type guard for ValidationCheckpointResult
 */
export function isValidationCheckpointResult(obj: any): obj is ValidationCheckpointResult {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.isValid === 'boolean' &&
    Array.isArray(obj.checkpoints) &&
    Array.isArray(obj.recommendations) &&
    typeof obj.overallMessage === 'string'
  )
}

/**
 * Type guard for CheckpointResult
 */
export function isCheckpointResult(obj: any): obj is CheckpointResult {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.passed === 'boolean' &&
    Array.isArray(obj.recommendations)
  )
}