/**
 * Symbolica AI Credit System
 * Manages credit allocation and usage for Symbolica AI (Premium: 50 credits/month, VIP: unlimited)
 * 
 * ⚠️ IMPORTANT: Uses centralized tier capabilities config for access control
 * Cost values are imported from src/config/tierCosts.ts (SINGLE SOURCE OF TRUTH)
 */

import { blink } from '../blink/client'
import type { SubscriptionTier } from '../config/tierCapabilities'
import { canAccessSymbolicaAI } from '../config/tierCapabilities'
import type { SymbolicaAICredits, SymbolicaAICreditsRow } from '../types/symbolica'
import { SYMBOLICA_AI_COSTS, calculateSymbolicaAICost } from '../config/tierCosts'

/**
 * Premium tier: 50 interactions per month
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
 * Get Symbolica AI credits for a user by tier
 * Returns null if user is on free/pro tier (no access)
 */
export async function getSymbolicaAICredits(
  userId: string,
  tier: SubscriptionTier
): Promise<SymbolicaAICredits | null> {
  try {
    // Check tier access first
    if (!canAccessSymbolicaAI(tier)) {
      return null
    }

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
      // Try to find existing credits in reflect_ai_credits table 
      // (we'll reuse for symbolica since structure is same)
      const results = await blink.db.symbolicaAiCredits.list<SymbolicaAICreditsRow>({
        where: { userId },
        limit: 1
      })

      if (!results || results.length === 0) {
        // First time: Create credits record
        return await createSymbolicaAICredits(userId, 'premium')
      }

      const record = results[0]

      // Check if monthly reset needed
      if (shouldResetMonthlyUsage(record.resetDate)) {
        await resetSymbolicaAICredits(userId)
        return await getSymbolicaAICredits(userId, tier) // Recursive call after reset
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
    console.error('Error fetching Symbolica AI credits:', error)
    return null
  }
}

/**
 * Create initial Symbolica AI credits record for a user
 */
async function createSymbolicaAICredits(
  userId: string,
  tier: 'premium' | 'vip'
): Promise<SymbolicaAICredits> {
  try {
    const creditsTotal =
      tier === 'vip' ? VIP_CREDITS_PER_MONTH : PREMIUM_CREDITS_PER_MONTH

    const now = new Date().toISOString()
    const id = `symbolica_credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await blink.db.symbolicaAiCredits.create({
      id,
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
      userId,
      tier,
      creditsTotal,
      creditsUsed: 0,
      creditsRemaining: creditsTotal,
      resetDate: now
    }
  } catch (error) {
    console.error('Error creating Symbolica AI credits:', error)
    throw error
  }
}

/**
 * Reset monthly credits for a user (called when month changes)
 */
async function resetSymbolicaAICredits(userId: string): Promise<void> {
  try {
    const now = new Date().toISOString()

    // First get the record to find its ID (since update requires ID or we use updateMany)
    // We'll use updateMany to be safe by userId
    const credits = await blink.db.symbolicaAiCredits.list<SymbolicaAICreditsRow>({
      where: { userId },
      limit: 1
    })

    if (credits && credits.length > 0) {
      await blink.db.symbolicaAiCredits.update(credits[0].id, {
        creditsUsed: 0,
        creditsRemaining: Number(credits[0].creditsTotal), // Reset to total
        resetDate: now,
        updatedAt: now
      })
    }
  } catch (error) {
    console.error('Error resetting Symbolica AI credits:', error)
    throw error
  }
}

/**
 * Check if user can perform a Symbolica AI action
 * Returns object indicating whether action is allowed and reason if not
 */
export async function canPerformSymbolicaAction(
  userId: string,
  tier: SubscriptionTier
): Promise<{
  allowed: boolean
  reason?: string
  creditsRemaining?: number
}> {
  try {
    // Block Free/Pro tiers
    if (!canAccessSymbolicaAI(tier)) {
      return {
        allowed: false,
        reason: 'Upgrade to Premium or VIP to access the Symbol Orchard'
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
    const credits = await getSymbolicaAICredits(userId, tier)

    if (!credits) {
      return {
        allowed: false,
        reason: 'Error fetching Symbol Orchard access'
      }
    }

    if (credits.creditsRemaining <= 0) {
      return {
        allowed: false,
        reason:
          'Monthly Symbol Orchard credit limit reached. Upgrade to VIP for unlimited access.',
        creditsRemaining: 0
      }
    }

    return {
      allowed: true,
      creditsRemaining: credits.creditsRemaining
    }
  } catch (error) {
    console.error('Error checking Symbolica AI access:', error)
    return {
      allowed: false,
      reason: 'Error checking Symbol Orchard access'
    }
  }
}

/**
 * Deduct one credit from user's Symbolica AI allocation
 * Returns true if successful, false otherwise
 */
export async function deductSymbolicaAICredit(
  userId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  try {
    // VIP: No deduction needed
    if (tier === 'vip') return true

    // Premium: Deduct 1 credit
    if (tier === 'premium') {
      const now = new Date().toISOString()

      // Fetch current credits
      const creditsList = await blink.db.symbolicaAiCredits.list<SymbolicaAICreditsRow>({
        where: { userId },
        limit: 1
      })

      if (!creditsList || creditsList.length === 0) return false
      
      const record = creditsList[0]
      const currentRemaining = Number(record.creditsRemaining)

      if (currentRemaining > 0) {
        await blink.db.symbolicaAiCredits.update(record.id, {
          creditsUsed: Number(record.creditsUsed) + 1,
          creditsRemaining: currentRemaining - 1,
          updatedAt: now
        })
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error deducting Symbolica AI credit:', error)
    return false
  }
}

/**
 * Get Symbolica AI access status for display
 */
export async function getSymbolicaAIAccessStatus(
  userId: string,
  tier: SubscriptionTier
): Promise<{
  hasAccess: boolean
  tier: 'premium' | 'vip' | 'none'
  creditsRemaining?: number
  message: string
}> {
  try {
    if (!canAccessSymbolicaAI(tier)) {
      return {
        hasAccess: false,
        tier: 'none',
        message: 'Symbol Orchard is available on Premium ($19.99/month) or VIP ($29.99/month) tiers'
      }
    }

    const credits = await getSymbolicaAICredits(userId, tier)

    if (!credits) {
      return {
        hasAccess: false,
        tier: 'none',
        message: 'Error accessing Symbol Orchard'
      }
    }

    if (tier === 'vip') {
      return {
        hasAccess: true,
        tier: 'vip',
        creditsRemaining: VIP_CREDITS_PER_MONTH,
        message: 'Unlimited Symbol Orchard Access'
      }
    }

    if (credits.creditsRemaining <= 0) {
      return {
        hasAccess: false,
        tier: 'premium',
        creditsRemaining: 0,
        message:
          'Monthly Symbol Orchard credit limit reached. Upgrade to VIP for unlimited access.'
      }
    }

    return {
      hasAccess: true,
      tier: 'premium',
      creditsRemaining: credits.creditsRemaining,
      message: `${credits.creditsRemaining} Symbol Orchard credits remaining this month`
    }
  } catch (error) {
    console.error('Error getting Symbolica AI access status:', error)
    return {
      hasAccess: false,
      tier: 'none',
      message: 'Error checking Symbol Orchard access'
    }
  }
}

/**
 * Estimate cost for a Symbolica AI analysis
 * Uses centralized costs from tierCosts.ts
 * 
 * @param inputTokens - Number of input tokens (defaults to average)
 * @param outputTokens - Number of output tokens (defaults to average)
 * @returns Estimated cost in USD
 */
export function estimateSymbolicaAIAnalysisCost(
  inputTokens: number = SYMBOLICA_AI_COSTS.AVG_INPUT_TOKENS,
  outputTokens: number = SYMBOLICA_AI_COSTS.AVG_OUTPUT_TOKENS
): number {
  return calculateSymbolicaAICost(inputTokens, outputTokens)
}

/**
 * Get average cost per Symbolica AI analysis
 * Uses centralized costs from tierCosts.ts
 */
export function getAverageSymbolicaAIAnalysisCost(): number {
  return SYMBOLICA_AI_COSTS.COST_PER_ANALYSIS
}