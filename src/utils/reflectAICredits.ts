/**
 * ReflectAI Credit System
 * Manages credit allocation and usage for ReflectAI (Premium: 50 credits/month, VIP: unlimited)
 * 
 * ⚠️ IMPORTANT: Uses centralized tier capabilities config for access control
 * Cost values are imported from src/config/tierCosts.ts (SINGLE SOURCE OF TRUTH)
 */

import { blink } from '../blink/client'
import type { SubscriptionTier } from '../config/tierCapabilities'
import { canAccessReflectAI } from '../config/tierCapabilities'
import type { ReflectAICredits, ReflectAICreditsRow } from '../types/reflectAI'
import { REFLECT_AI_COSTS, calculateReflectAICost } from '../config/tierCosts'

/**
 * Premium tier: 50 messages per month
 * VIP tier: unlimited (999999 for practical purposes)
 */
const PREMIUM_CREDITS_PER_MONTH = 50
const VIP_CREDITS_PER_MONTH = 999999

/**
 * Check if monthly reset is needed based on reset date
 */
function shouldResetMonthlyUsage(resetDate: string): boolean {
  const last = new Date(resetDate)
  const now = new Date()
  return (
    last.getFullYear() !== now.getFullYear() ||
    last.getMonth() !== now.getMonth()
  )
}

/**
 * Get ReflectAI credits for a user by tier
 * Returns null if user is on free/pro tier (no access)
 */
export async function getReflectAICredits(
  userId: string,
  tier: SubscriptionTier
): Promise<ReflectAICredits | null> {
  try {
    // VIP: Always unlimited
    if (tier === 'vip') {
      return {
        userId,
        tier: 'vip',
        creditsTotal: VIP_CREDITS_PER_MONTH,
        creditsUsed: 0,
        creditsRemaining: VIP_CREDITS_PER_MONTH,
        resetDate: new Date().toISOString()
      }
    }

    // Premium: Check credits from DB
    if (tier === 'premium') {
      const results = await blink.db.reflectAiCredits.list({
        where: { userId },
        limit: 1
      })

      if (!Array.isArray(results) || results.length === 0) {
        // First time: Create credits record
        return await createReflectAICredits(userId, 'premium')
      }

      const record = results[0] as ReflectAICreditsRow

      // Check if monthly reset needed
      if (shouldResetMonthlyUsage(record.resetDate)) {
        await resetReflectAICredits(userId)
        return await getReflectAICredits(userId, tier) // Recursive call after reset
      }

      return {
        userId: record.userId,
        tier: 'premium',
        creditsTotal: Number(record.creditsTotal),
        creditsUsed: Number(record.creditsUsed),
        creditsRemaining: Number(record.creditsRemaining),
        resetDate: record.resetDate
      }
    }

    // Free/Pro: No access
    return null
  } catch (error) {
    console.error('Error fetching ReflectAI credits:', error)
    return null
  }
}

/**
 * Create initial ReflectAI credits record for a user
 */
async function createReflectAICredits(
  userId: string,
  tier: 'premium' | 'vip'
): Promise<ReflectAICredits> {
  try {
    const creditsTotal =
      tier === 'vip' ? VIP_CREDITS_PER_MONTH : PREMIUM_CREDITS_PER_MONTH

    const now = new Date().toISOString()

    const record = await blink.db.reflectAiCredits.create({
      id: `reflect_credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      subscriptionTier: tier,
      creditsTotal,
      creditsUsed: 0,
      creditsRemaining: creditsTotal,
      resetDate: now,
      createdAt: now,
      updatedAt: now
    })

    return {
      userId: (record as any).userId,
      tier,
      creditsTotal: Number((record as any).creditsTotal),
      creditsUsed: 0,
      creditsRemaining: creditsTotal,
      resetDate: (record as any).resetDate
    }
  } catch (error) {
    console.error('Error creating ReflectAI credits:', error)
    throw error
  }
}

/**
 * Reset monthly credits for a user (called when month changes)
 */
async function resetReflectAICredits(userId: string): Promise<void> {
  try {
    const results = await blink.db.reflectAiCredits.list({
      where: { userId },
      limit: 1
    })

    if (!Array.isArray(results) || results.length === 0) return

    const record = results[0] as ReflectAICreditsRow
    const creditsTotal = Number(record.creditsTotal)

    const now = new Date().toISOString()

    await blink.db.reflectAiCredits.update(record.id, {
      creditsUsed: 0,
      creditsRemaining: creditsTotal,
      resetDate: now,
      updatedAt: now
    })
  } catch (error) {
    console.error('Error resetting ReflectAI credits:', error)
    throw error
  }
}

/**
 * Check if user can send a reflection message
 * Returns object indicating whether action is allowed and reason if not
 */
export async function canSendReflectionMessage(
  userId: string,
  tier: SubscriptionTier
): Promise<{
  allowed: boolean
  reason?: string
  creditsRemaining?: number
}> {
  try {
    // Block Free/Pro tiers
    if (tier === 'free' || tier === 'pro') {
      return {
        allowed: false,
        reason: 'Upgrade to Premium or VIP to access ReflectAI'
      }
    }

    // VIP: Always allowed
    if (tier === 'vip') {
      return {
        allowed: true,
        creditsRemaining: VIP_CREDITS_PER_MONTH
      }
    }

    // Premium: Check credits
    const credits = await getReflectAICredits(userId, tier)

    if (!credits) {
      return {
        allowed: false,
        reason: 'Error fetching ReflectAI access'
      }
    }

    if (credits.creditsRemaining <= 0) {
      return {
        allowed: false,
        reason:
          'Monthly ReflectAI credit limit reached. Upgrade to VIP for unlimited access.',
        creditsRemaining: 0
      }
    }

    return {
      allowed: true,
      creditsRemaining: credits.creditsRemaining
    }
  } catch (error) {
    console.error('Error checking ReflectAI access:', error)
    return {
      allowed: false,
      reason: 'Error checking ReflectAI access'
    }
  }
}

/**
 * Deduct one credit from user's ReflectAI allocation
 * Returns true if successful, false otherwise
 */
export async function deductReflectAICredit(
  userId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  try {
    // VIP: No deduction needed
    if (tier === 'vip') return true

    // Premium: Deduct 1 credit
    if (tier === 'premium') {
      const results = await blink.db.reflectAiCredits.list({
        where: { userId },
        limit: 1
      })

      if (!Array.isArray(results) || results.length === 0) return false

      const record = results[0] as ReflectAICreditsRow
      const newUsed = Number(record.creditsUsed) + 1
      const newRemaining = Number(record.creditsTotal) - newUsed

      const now = new Date().toISOString()

      await blink.db.reflectAiCredits.update(record.id, {
        creditsUsed: newUsed,
        creditsRemaining: newRemaining,
        updatedAt: now
      })

      return true
    }

    return false
  } catch (error) {
    console.error('Error deducting ReflectAI credit:', error)
    return false
  }
}

/**
 * Get ReflectAI access status for a user
 */
export async function getReflectAIAccessStatus(
  userId: string,
  tier: SubscriptionTier
): Promise<{
  hasAccess: boolean
  tier: 'premium' | 'vip' | 'none'
  creditsRemaining?: number
  message: string
}> {
  try {
    if (tier === 'free' || tier === 'pro') {
      return {
        hasAccess: false,
        tier: 'none',
        message: 'ReflectAI is available on Premium ($19.99/month) or VIP ($29.99/month) tiers'
      }
    }

    const credits = await getReflectAICredits(userId, tier)

    if (!credits) {
      return {
        hasAccess: false,
        tier: 'none',
        message: 'Error accessing ReflectAI'
      }
    }

    if (tier === 'vip') {
      return {
        hasAccess: true,
        tier: 'vip',
        creditsRemaining: VIP_CREDITS_PER_MONTH,
        message: 'Unlimited ReflectAI Access'
      }
    }

    if (credits.creditsRemaining <= 0) {
      return {
        hasAccess: false,
        tier: 'premium',
        creditsRemaining: 0,
        message:
          'Monthly ReflectAI credit limit reached. Upgrade to VIP for unlimited access.'
      }
    }

    return {
      hasAccess: true,
      tier: 'premium',
      creditsRemaining: credits.creditsRemaining,
      message: `${credits.creditsRemaining} ReflectAI credits remaining this month`
    }
  } catch (error) {
    console.error('Error getting ReflectAI access status:', error)
    return {
      hasAccess: false,
      tier: 'none',
      message: 'Error checking ReflectAI access'
    }
  }
}

/**
 * Estimate cost for a ReflectAI message
 * Uses centralized costs from tierCosts.ts
 * 
 * @param inputTokens - Number of input tokens (defaults to average)
 * @param outputTokens - Number of output tokens (defaults to average)
 * @returns Estimated cost in USD
 */
export function estimateReflectAIMessageCost(
  inputTokens: number = REFLECT_AI_COSTS.AVG_INPUT_TOKENS,
  outputTokens: number = REFLECT_AI_COSTS.AVG_OUTPUT_TOKENS
): number {
  return calculateReflectAICost(inputTokens, outputTokens)
}

/**
 * Get average cost per ReflectAI message
 * Uses centralized costs from tierCosts.ts
 */
export function getAverageReflectAIMessageCost(): number {
  return REFLECT_AI_COSTS.COST_PER_MESSAGE
}
