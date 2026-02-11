/**
 * AI Recommendation Generator
 * Generates contextual recommendations for dream input improvements
 */

import { blink } from '../blink/client'
import type { ValidationRecommendation } from './inputValidationCheckpoint'

export interface RecommendationContext {
  dreamContent: string
  inputType: 'text' | 'symbols' | 'image' | 'voice'
  validationIssues: string[]
  userTier: string
}

/**
 * Generate AI-powered recommendations for improving dream input
 */
export async function generateInputRecommendations(
  context: RecommendationContext
): Promise<ValidationRecommendation[]> {
  const recommendations: ValidationRecommendation[] = []

  try {
    // Build prompt for AI recommendations
    const prompt = `You are a dream analysis assistant. Review this dream input and provide recommendations.

Dream Content:
"${context.dreamContent}"

Input Type: ${context.inputType}
User Tier: ${context.userTier}
Issues Detected: ${context.validationIssues.join(', ')}

Generate 2-3 specific, actionable recommendations to improve this dream description for better interpretation. Focus on:
1. Adding emotional context if missing
2. Including sensory details (what they saw, heard, felt)
3. Describing key moments or transitions
4. Identifying familiar people or places

Return your response as a JSON array of recommendation objects with this structure:
[
  {
    "severity": "warning" | "suggestion",
    "message": "Brief issue description",
    "suggestion": "Specific action the user should take"
  }
]

Keep recommendations concise and practical. Maximum 3 recommendations.`

    const aiResponse = await blink.ai.generateText({
      prompt,
    })
    
    // Extract text from response (handles both text and steps formats)
    let responseText = ''
    if (aiResponse?.text) {
      responseText = aiResponse.text
    } else if ((aiResponse as any)?.steps && Array.isArray((aiResponse as any).steps)) {
      const steps = (aiResponse as any).steps
      const lastStep = steps[steps.length - 1]
      responseText = lastStep?.text || ''
    }

    // Safe check for AI response before processing
    if (!responseText || typeof responseText !== 'string') {
      console.warn('⚠️ AI returned invalid response for recommendations, using fallback')
      return generateFallbackRecommendations(context)
    }

    // Parse AI response
    const cleanResponse = (responseText || '')
      .trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    if (!cleanResponse) {
      console.warn('⚠️ AI response was empty, using fallback')
      return generateFallbackRecommendations(context)
    }

    const aiRecommendations = JSON.parse(cleanResponse) as Array<{
      severity: 'warning' | 'suggestion'
      message: string
      suggestion: string
    }>

    // Convert to ValidationRecommendation format
    for (const rec of aiRecommendations) {
      recommendations.push({
        checkpointId: 'ai_recommendation',
        checkpointName: 'Content Enhancement',
        severity: rec.severity,
        message: rec.message,
        suggestion: rec.suggestion,
        autoFixAvailable: false,
      })
    }

    return recommendations
  } catch (error) {
    console.error('Failed to generate AI recommendations:', error)

    // Return fallback recommendations
    return generateFallbackRecommendations(context)
  }
}

/**
 * Generate fallback recommendations when AI fails
 */
function generateFallbackRecommendations(context: RecommendationContext): ValidationRecommendation[] {
  const recommendations: ValidationRecommendation[] = []

  // Check for emotional content
  const emotionWords = [
    'scared',
    'afraid',
    'happy',
    'sad',
    'anxious',
    'excited',
    'confused',
    'peaceful',
    'angry',
    'worried',
  ]
  const hasEmotions = emotionWords.some((word) => context.dreamContent.toLowerCase().includes(word))

  if (!hasEmotions) {
    recommendations.push({
      checkpointId: 'fallback_recommendation',
      checkpointName: 'Content Enhancement',
      severity: 'warning',
      message: 'No emotional context detected',
      suggestion:
        'Add how you felt during the dream. Include emotions like scared, happy, confused, or anxious to help with interpretation.',
      autoFixAvailable: false,
    })
  }

  // Check for length
  if (context.dreamContent.length < 50) {
    recommendations.push({
      checkpointId: 'fallback_recommendation',
      checkpointName: 'Content Enhancement',
      severity: 'suggestion',
      message: 'Dream description is brief',
      suggestion:
        'Provide more details about the setting, what you saw, and what happened during the dream for a richer interpretation.',
      autoFixAvailable: false,
    })
  }

  // Check for sensory details
  const sensoryWords = ['saw', 'heard', 'felt', 'touched', 'smelled', 'tasted', 'looked', 'sounded']
  const hasSensory = sensoryWords.some((word) => context.dreamContent.toLowerCase().includes(word))

  if (!hasSensory && recommendations.length < 3) {
    recommendations.push({
      checkpointId: 'fallback_recommendation',
      checkpointName: 'Content Enhancement',
      severity: 'suggestion',
      message: 'Consider adding sensory details',
      suggestion:
        'Describe what you saw, heard, or felt to make your dream more vivid and improve interpretation accuracy.',
      autoFixAvailable: false,
    })
  }

  return recommendations
}

/**
 * Generate recommendations for subscription upgrade
 */
export function generateUpgradeRecommendations(
  currentTier: string,
  requiredFeature: string
): ValidationRecommendation[] {
  const recommendations: ValidationRecommendation[] = []

  if (currentTier === 'free') {
    recommendations.push({
      checkpointId: 'upgrade_recommendation',
      checkpointName: 'Feature Access',
      severity: 'warning',
      message: `${requiredFeature} requires a paid subscription`,
      suggestion:
        'Upgrade to Pro ($6.99/month) for 10 monthly analyses with HD images, or Premium ($14.99/month) for 20 analyses with video generation.',
      autoFixAvailable: false,
    })
  } else if (currentTier === 'pro' && requiredFeature === 'video_generation') {
    recommendations.push({
      checkpointId: 'upgrade_recommendation',
      checkpointName: 'Feature Access',
      severity: 'suggestion',
      message: 'Video generation requires Premium or VIP',
      suggestion:
        'Upgrade to Premium ($14.99/month) for video generation on all 20 monthly dreams, or VIP ($29.99/month) for cinematic DreamWorlds.',
      autoFixAvailable: false,
    })
  }

  return recommendations
}

/**
 * Generate recommendations for dream content improvements
 */
export function generateContentRecommendations(
  content: string,
  detectedIssues: string[]
): ValidationRecommendation[] {
  const recommendations: ValidationRecommendation[] = []

  for (const issue of detectedIssues) {
    switch (issue) {
      case 'no_emotions':
        recommendations.push({
          checkpointId: 'content_improvement',
          checkpointName: 'Content Quality',
          severity: 'warning',
          message: 'No emotional content detected',
          suggestion:
            'Dreams are deeply connected to emotions. Describe how you felt - scared, happy, anxious, confused, or peaceful.',
          autoFixAvailable: false,
        })
        break

      case 'too_short':
        recommendations.push({
          checkpointId: 'content_improvement',
          checkpointName: 'Content Quality',
          severity: 'suggestion',
          message: 'Dream description is very brief',
          suggestion:
            'Provide more context about the setting, what happened, and who was there. More details lead to better interpretations.',
          autoFixAvailable: false,
        })
        break

      case 'no_structure':
        recommendations.push({
          checkpointId: 'content_improvement',
          checkpointName: 'Content Quality',
          severity: 'suggestion',
          message: 'Consider organizing your dream description',
          suggestion:
            'Try describing: (1) The setting/scene, (2) What happened, (3) How you felt, (4) Who was there.',
          autoFixAvailable: false,
        })
        break

      case 'gibberish':
        recommendations.push({
          checkpointId: 'content_improvement',
          checkpointName: 'Content Quality',
          severity: 'error',
          message: 'Dream content appears to be gibberish',
          suggestion: 'Please provide a meaningful description of your dream using regular words and sentences.',
          autoFixAvailable: false,
        })
        break
    }
  }

  return recommendations
}
