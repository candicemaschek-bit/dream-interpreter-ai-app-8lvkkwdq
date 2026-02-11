/**
 * Subscription Helper Functions
 * Handles subscription tier logic and feature access
 * 
 * ⚠️ IMPORTANT: This file now imports from the centralized tier capabilities config
 * All tier logic is defined in src/config/tierCapabilities.ts
 * 
 * Pattern Tracking Features by Tier:
 * - All tiers: Basic pattern detection (nightmare/recurring identification)
 * - Premium: Advanced cycle detection with AI insights
 * - VIP: Advanced cycle detection + psychological insights + evolution tracking
 */

import { supabaseService } from '../lib/supabaseService'
import {
  type SubscriptionTier,
  type SubscriptionLimits,
  getSubscriptionLimits,
  canPerformAction,
  formatTierName,
  canCreateDreamAnalysis as canCreateDreamAnalysisCore,
  canGenerateVideo as canGenerateVideoCore,
  canAccessReflectAI as canAccessReflectAICore,
  shouldApplyWatermark as shouldApplyWatermarkCore,
  canTranscribeAudio as canTranscribeAudioCore,
} from '../config/tierCapabilities'

// Re-export types and functions from centralized config
export type { SubscriptionTier, SubscriptionLimits }
export { getSubscriptionLimits, canPerformAction, formatTierName }

/**
 * Determine whether monthly usage counters should be reset based on last reset date
 */
export function shouldResetMonthlyUsage(lastResetDate?: string): boolean {
  if (!lastResetDate) return true
  const last = new Date(lastResetDate)
  const now = new Date()
  return last.getFullYear() !== now.getFullYear() || last.getMonth() !== now.getMonth()
}

/**
 * Reset monthly usage counters for all features (dreams, TTS, transcription)
 * Should be called when shouldResetMonthlyUsage() returns true
 */
export async function resetMonthlyUsageCounters(blink: any, userId: string): Promise<void> {
  try {
    const profile = await supabaseService.getProfile(userId)
    
    if (!profile) return
    
    const now = new Date().toISOString()
    
    await supabaseService.upsertProfile({
      ...profile,
      dreams_analyzed_this_month: 0,
      tts_generations_this_month: 0,
      tts_cost_this_month_usd: 0,
      transcriptions_this_month: 0,
      last_reset_date: now,
      tts_last_reset_date: now,
      transcription_last_reset_date: now,
      updated_at: now
    } as any)
  } catch (error) {
    console.error('Failed to reset monthly usage counters:', error)
  }
}

/**
 * Determine if the user can create a new dream analysis based on their profile and tier limits
 * Now uses centralized tier capabilities config
 */
export function canCreateDreamAnalysis(profile?: { 
  subscriptionTier?: SubscriptionTier
  dreamsAnalyzedThisMonth?: number
  dreamsAnalyzedLifetime?: number
}): boolean {
  if (!profile) return true
  const tier = (profile.subscriptionTier || 'free') as SubscriptionTier
  const monthly = typeof profile.dreamsAnalyzedThisMonth === 'number' ? profile.dreamsAnalyzedThisMonth : 0
  const lifetime = typeof profile.dreamsAnalyzedLifetime === 'number' ? profile.dreamsAnalyzedLifetime : undefined
  
  return canCreateDreamAnalysisCore(tier, monthly, lifetime)
}

/**
 * Whether the user can generate a video for a dream based on their tier
 * Now uses centralized tier capabilities config
 */
export function canGenerateVideo(profile?: { subscriptionTier?: SubscriptionTier }): boolean {
  if (!profile) return false
  const tier = (profile.subscriptionTier || 'free') as SubscriptionTier
  return canGenerateVideoCore(tier)
}

/**
 * Decide whether generated images should be watermarked for this tier
 * NOTE: As of new pricing model, NO tiers have watermarked images
 * Now uses centralized tier capabilities config
 */
export function shouldApplyWatermark(profile?: { subscriptionTier?: SubscriptionTier }): boolean {
  if (!profile) return false
  const tier = (profile.subscriptionTier || 'free') as SubscriptionTier
  return shouldApplyWatermarkCore(tier)
}

/**
 * Whether the user can access Reflect AI (Reflection Journal) feature
 * Only Premium and VIP tiers have access to Reflect AI
 * Now uses centralized tier capabilities config
 */
export function canAccessReflectAI(profile?: { subscriptionTier?: SubscriptionTier }): boolean {
  if (!profile) return false
  const tier = (profile.subscriptionTier || 'free') as SubscriptionTier
  return canAccessReflectAICore(tier)
}

/**
 * Whether the user can transcribe audio (voice-to-text)
 * All subscription tiers have access with per-tier limits (see tierCapabilities.ts).
 * NOTE: Launch offer does NOT include free transcription.
 */
export function canTranscribeAudio(profile?: { 
  subscriptionTier?: SubscriptionTier
  hasLaunchOffer?: boolean
}): boolean {
  if (!profile) return false
  const tier = (profile.subscriptionTier || 'free') as SubscriptionTier
  return canTranscribeAudioCore(tier, profile.hasLaunchOffer)
}
