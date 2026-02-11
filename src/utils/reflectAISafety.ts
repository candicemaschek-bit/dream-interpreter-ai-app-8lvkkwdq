/**
 * ReflectAI Safety Module
 * Implements rate limiting and crisis detection for the reflection feature
 */

import { blink } from '../blink/client'

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  MAX_MESSAGES_PER_MINUTE: 5,
  MAX_MESSAGES_PER_HOUR: 30,
  MIN_COOLDOWN_SECONDS: 2
}

/**
 * Crisis detection keywords
 * Used to identify potentially dangerous content
 */
const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it all',
  'self harm',
  'self-harm',
  'overdose',
  'worthless',
  'better off dead',
  'nobody cares',
  'want to die',
  'should die',
  'cut myself',
  'hurt myself',
  'harm myself',
  'harm others',
  'hurt others',
  'emergency',
  'crisis',
  'desperate'
]

/**
 * Track message timestamps for rate limiting
 * Key: userId
 * Value: Array of message timestamps
 */
const userMessageTimestamps = new Map<string, number[]>()

/**
 * Check if user has exceeded rate limits
 */
export function checkRateLimit(userId: string): {
  allowed: boolean
  reason?: string
  retryAfterSeconds?: number
} {
  const now = Date.now()
  const timestamps = userMessageTimestamps.get(userId) || []

  // Remove timestamps older than 1 hour
  const recentTimestamps = timestamps.filter(ts => now - ts < 3600000)

  // Check minute limit
  const messagesLastMinute = recentTimestamps.filter(
    ts => now - ts < 60000
  ).length

  if (messagesLastMinute >= RATE_LIMITS.MAX_MESSAGES_PER_MINUTE) {
    const oldestMessageTime = recentTimestamps.find(
      ts => now - ts < 60000
    ) || now
    const retryAfter = Math.ceil((oldestMessageTime + 60000 - now) / 1000)

    return {
      allowed: false,
      reason: `Too many messages. Please wait ${retryAfter} seconds.`,
      retryAfterSeconds: retryAfter
    }
  }

  // Check hour limit
  if (recentTimestamps.length >= RATE_LIMITS.MAX_MESSAGES_PER_HOUR) {
    const oldestMessage = recentTimestamps[0]
    const retryAfter = Math.ceil((oldestMessage + 3600000 - now) / 1000)

    return {
      allowed: false,
      reason: `Daily message limit reached. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      retryAfterSeconds: retryAfter
    }
  }

  // Update timestamps
  recentTimestamps.push(now)
  userMessageTimestamps.set(userId, recentTimestamps)

  return { allowed: true }
}

/**
 * Clear rate limit for user (useful for testing/admin)
 */
export function clearRateLimit(userId: string): void {
  userMessageTimestamps.delete(userId)
}

/**
 * Detect crisis language in user message
 */
export function detectCrisisLanguage(text: string): {
  detected: boolean
  keywords: string[]
} {
  const lowerText = text.toLowerCase()
  const detectedKeywords: string[] = []

  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      detectedKeywords.push(keyword)
    }
  }

  return {
    detected: detectedKeywords.length > 0,
    keywords: detectedKeywords
  }
}

/**
 * Get crisis support message
 */
export function getCrisisSupportMessage(): string {
  return `I'm concerned about what you've shared. If you're experiencing a crisis or having thoughts of self-harm, please reach out to professionals who can help:

🆘 **Immediate Support:**
• **National Suicide Prevention Lifeline**: 988 (US)
• **Crisis Text Line**: Text HOME to 741741
• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/
• **Emergency Services**: 911 (US) or your local emergency number

❤️ Your safety and wellbeing matter. Please reach out for help.

I'm here to support your emotional exploration, but for immediate crisis support, these resources are better equipped to help.`
}

/**
 * Log crisis detection event for monitoring
 */
export async function logCrisisDetection(params: {
  userId: string
  sessionId: string
  messageContent: string
  detectedKeywords: string[]
}): Promise<void> {
  try {
    // Log to API usage for monitoring
    await blink.db.apiUsageLogs.create({
      id: `crisis_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: params.userId,
      operationType: 'text_generation',
      modelUsed: 'crisis_detection',
      tokensUsed: 0,
      estimatedCostUsd: 0,
      success: 1,
      metadata: JSON.stringify({
        feature: 'reflect_ai',
        type: 'crisis_detection',
        sessionId: params.sessionId,
        detectedKeywords: params.detectedKeywords
      }) as any,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging crisis detection:', error)
  }
}

/**
 * Check message safety before processing
 */
export async function checkMessageSafety(params: {
  userId: string
  sessionId: string
  message: string
}): Promise<{
  safe: boolean
  reason?: string
  supportMessage?: string
  crisisDetected?: boolean
}> {
  try {
    // Check rate limit
    const rateLimitCheck = checkRateLimit(params.userId)
    if (!rateLimitCheck.allowed) {
      return {
        safe: false,
        reason: rateLimitCheck.reason
      }
    }

    // Check for crisis language
    const crisisCheck = detectCrisisLanguage(params.message)
    if (crisisCheck.detected) {
      // Log crisis detection
      await logCrisisDetection({
        userId: params.userId,
        sessionId: params.sessionId,
        messageContent: params.message,
        detectedKeywords: crisisCheck.keywords
      })

      // Show support message ONLY and PAUSE conversation
      // Do NOT continue processing the message - safety takes priority
      return {
        safe: false, // PAUSE conversation - do not process message
        crisisDetected: true,
        conversationPaused: true,
        supportMessage: getCrisisSupportMessage(),
        reason: 'Your message has been received. Please see the support resources below. When you\'re ready to continue, you can send a new message.'
      }
    }

    return { safe: true }
  } catch (error) {
    console.error('Error checking message safety:', error)
    return {
      safe: true // Fail open to avoid blocking legitimate messages
    }
  }
}
