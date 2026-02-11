/**
 * E2E Tests for Subscription Tier Access Control
 * Tests all features for Free, Pro, Premium, and VIP tiers
 * Validates tier logic and access restrictions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { SubscriptionTier } from '../types/subscription'
import { 
  getSubscriptionLimits, 
  canPerformAction, 
  canCreateDreamAnalysis,
  canGenerateVideo,
  shouldApplyWatermark
} from '../utils/subscriptionHelpers'
import {
  canGenerateVideos,
  getMaxVideoDuration,
  getVideoGenerationLimit,
  getDreamworldsGenerationLimit,
  getVideoQuality,
  getVideoTierSpec
} from '../utils/videoTierCapabilities'
import { SUBSCRIPTION_PLANS, ADD_ONS } from '../types/subscription'

describe('Free Tier E2E Tests', () => {
  const tier: SubscriptionTier = 'free'
  
  it('should have correct subscription limits', () => {
    const limits = getSubscriptionLimits(tier)
    expect(limits.dreamsPerMonth).toBe(2)
    expect(limits.videoGenerationsPerMonth).toBe(0)
    expect(limits.canUseAI).toBe(true)
    expect(limits.canGenerateVideos).toBe(false)
    expect(limits.canAccessLeaderboard).toBe(false)
    expect(limits.maxDreamStories).toBe(0)
  })

  it('should have correct subscription plan details', () => {
    const plan = SUBSCRIPTION_PLANS[tier]
    expect(plan.monthlyPrice).toBe(0)
    expect(plan.annualPrice).toBe(0)
    expect(plan.monthlyCredits).toBe(2)
    expect(plan.dreamworldsAccess).toBe('purchase')
    expect(plan.maxDreamworldsPerMonth).toBe(0)
  })

  it('should allow AI interpretation', () => {
    expect(canPerformAction(tier, 'ai_interpretation')).toBe(true)
  })

  it('should NOT allow video generation', () => {
    expect(canPerformAction(tier, 'video_generation')).toBe(false)
    expect(canGenerateVideos(tier)).toBe(false)
    expect(canGenerateVideo({ subscriptionTier: tier })).toBe(false)
  })

  it('should NOT allow leaderboard access', () => {
    expect(canPerformAction(tier, 'leaderboard_access')).toBe(false)
  })

  it('should NOT allow dream story creation', () => {
    expect(canPerformAction(tier, 'dream_story_creation')).toBe(false)
  })

  it('should have video generation limit of 0', () => {
    expect(getVideoGenerationLimit(tier)).toBe(0)
  })

  it('should have dreamworlds limit of 0 (but can purchase)', () => {
    expect(getDreamworldsGenerationLimit(tier)).toBe(0)
  })

  it('should NOT apply watermarks', () => {
    expect(shouldApplyWatermark({ subscriptionTier: tier })).toBe(false)
  })

  it('should have 0 video duration', () => {
    expect(getMaxVideoDuration(tier, 'dreamcatcher')).toBe(0)
  })

  it('should allow creating 2 dream analyses (lifetime)', () => {
    const profile = { subscriptionTier: tier, dreamsAnalyzedThisMonth: 1 }
    expect(canCreateDreamAnalysis(profile)).toBe(true)
  })

  it('should prevent dream analysis after 2 lifetime uses', () => {
    const profile = { subscriptionTier: tier, dreamsAnalyzedThisMonth: 2 }
    expect(canCreateDreamAnalysis(profile)).toBe(false)
  })

  it('should be eligible for all add-ons', () => {
    expect(ADD_ONS.deep_dive_report.eligibleTiers).toContain(tier)
    expect(ADD_ONS.dreamworlds_pass.eligibleTiers).toContain(tier)
    expect(ADD_ONS.extra_dreamworld.eligibleTiers).toContain(tier)
  })

  it('should have correct video tier spec', () => {
    const spec = getVideoTierSpec(tier, 'dreamcatcher')
    expect(spec.durationSeconds).toBe(0)
    expect(spec.maxFrames).toBe(0)
    expect(spec.quality).toBe('low')
    expect(spec.allowCustomAudio).toBe(false)
    expect(spec.allowWatermark).toBe(false)
  })
})

describe('Pro Tier E2E Tests', () => {
  const tier: SubscriptionTier = 'pro'
  
  it('should have correct subscription limits', () => {
    const limits = getSubscriptionLimits(tier)
    expect(limits.dreamsPerMonth).toBe(10)
    expect(limits.videoGenerationsPerMonth).toBe(0)
    expect(limits.canUseAI).toBe(true)
    expect(limits.canGenerateVideos).toBe(false)
    expect(limits.canAccessLeaderboard).toBe(true)
    expect(limits.maxDreamStories).toBe(5)
  })

  it('should have correct subscription plan details', () => {
    const plan = SUBSCRIPTION_PLANS[tier]
    expect(plan.monthlyPrice).toBe(9.99)
    expect(plan.annualPrice).toBe(99.90)
    expect(plan.monthlyCredits).toBe(10)
    expect(plan.dreamworldsAccess).toBe('purchase')
    expect(plan.dreamworldsPrice).toBe(6.99)
    expect(plan.maxDreamworldsPerMonth).toBe(0)
  })

  it('should allow AI interpretation', () => {
    expect(canPerformAction(tier, 'ai_interpretation')).toBe(true)
  })

  it('should NOT allow video generation', () => {
    expect(canPerformAction(tier, 'video_generation')).toBe(false)
    expect(canGenerateVideos(tier)).toBe(false)
    expect(canGenerateVideo({ subscriptionTier: tier })).toBe(false)
  })

  it('should allow leaderboard access', () => {
    expect(canPerformAction(tier, 'leaderboard_access')).toBe(true)
  })

  it('should allow dream story creation', () => {
    expect(canPerformAction(tier, 'dream_story_creation')).toBe(true)
  })

  it('should have video generation limit of 0', () => {
    expect(getVideoGenerationLimit(tier)).toBe(0)
  })

  it('should have dreamworlds limit of 0 (but can purchase)', () => {
    expect(getDreamworldsGenerationLimit(tier)).toBe(0)
  })

  it('should NOT apply watermarks', () => {
    expect(shouldApplyWatermark({ subscriptionTier: tier })).toBe(false)
  })

  it('should have 0 video duration', () => {
    expect(getMaxVideoDuration(tier, 'dreamcatcher')).toBe(0)
  })

  it('should allow creating dream analyses up to monthly limit', () => {
    const profile = { subscriptionTier: tier, dreamsAnalyzedThisMonth: 9 }
    expect(canCreateDreamAnalysis(profile)).toBe(true)
  })

  it('should prevent dream analysis after monthly limit', () => {
    const profile = { subscriptionTier: tier, dreamsAnalyzedThisMonth: 10 }
    expect(canCreateDreamAnalysis(profile)).toBe(false)
  })

  it('should be eligible for all add-ons', () => {
    expect(ADD_ONS.deep_dive_report.eligibleTiers).toContain(tier)
    expect(ADD_ONS.dreamworlds_pass.eligibleTiers).toContain(tier)
    expect(ADD_ONS.extra_dreamworld.eligibleTiers).toContain(tier)
  })

  it('should have correct video tier spec', () => {
    const spec = getVideoTierSpec(tier, 'dreamcatcher')
    expect(spec.durationSeconds).toBe(0)
    expect(spec.maxFrames).toBe(0)
    expect(spec.quality).toBe('medium')
    expect(spec.allowCustomAudio).toBe(false)
    expect(spec.allowWatermark).toBe(false)
  })

  it('should have correct features list', () => {
    const plan = SUBSCRIPTION_PLANS[tier]
    expect(plan.features).toContain('10 personalised dream analyses per month')
    expect(plan.features).toContain('Symbolic tags')
    expect(plan.features).toContain('Deep insights')
  })
})

describe('Premium Tier E2E Tests', () => {
  const tier: SubscriptionTier = 'premium'
  
  it('should have correct subscription limits', () => {
    const limits = getSubscriptionLimits(tier)
    expect(limits.dreamsPerMonth).toBe(20)
    expect(limits.videoGenerationsPerMonth).toBe(0) // No 6-sec videos
    expect(limits.canUseAI).toBe(true)
    expect(limits.canGenerateVideos).toBe(false) // No 6-sec videos
    expect(limits.canAccessLeaderboard).toBe(true)
    expect(limits.maxDreamStories).toBe(10)
  })

  it('should have correct subscription plan details', () => {
    const plan = SUBSCRIPTION_PLANS[tier]
    expect(plan.monthlyPrice).toBe(19.99)
    expect(plan.annualPrice).toBe(199.90)
    expect(plan.monthlyCredits).toBe(20)
    expect(plan.dreamworldsAccess).toBe('purchase')
    expect(plan.dreamworldsPrice).toBe(6.99)
    expect(plan.maxDreamworldsPerMonth).toBe(0)
  })

  it('should allow AI interpretation', () => {
    expect(canPerformAction(tier, 'ai_interpretation')).toBe(true)
  })

  it('should NOT allow video generation (no 6-sec videos)', () => {
    expect(canPerformAction(tier, 'video_generation')).toBe(false)
    expect(canGenerateVideos(tier)).toBe(false)
    expect(canGenerateVideo({ subscriptionTier: tier })).toBe(false)
  })

  it('should allow leaderboard access', () => {
    expect(canPerformAction(tier, 'leaderboard_access')).toBe(true)
  })

  it('should allow dream story creation', () => {
    expect(canPerformAction(tier, 'dream_story_creation')).toBe(true)
  })

  it('should have video generation limit of 0 (no 6-sec videos)', () => {
    expect(getVideoGenerationLimit(tier)).toBe(0)
  })

  it('should have dreamworlds limit of 0 (but can purchase)', () => {
    expect(getDreamworldsGenerationLimit(tier)).toBe(0)
  })

  it('should NOT apply watermarks', () => {
    expect(shouldApplyWatermark({ subscriptionTier: tier })).toBe(false)
  })

  it('should have 0 video duration (no 6-sec videos)', () => {
    expect(getMaxVideoDuration(tier, 'dreamcatcher')).toBe(0)
  })

  it('should have high video quality spec (but no generation)', () => {
    expect(getVideoQuality(tier, 'dreamcatcher')).toBe('high')
  })

  it('should allow creating dream analyses up to monthly limit', () => {
    const profile = { subscriptionTier: tier, dreamsAnalyzedThisMonth: 19 }
    expect(canCreateDreamAnalysis(profile)).toBe(true)
  })

  it('should prevent dream analysis after monthly limit', () => {
    const profile = { subscriptionTier: tier, dreamsAnalyzedThisMonth: 20 }
    expect(canCreateDreamAnalysis(profile)).toBe(false)
  })

  it('should be eligible for all add-ons', () => {
    expect(ADD_ONS.deep_dive_report.eligibleTiers).toContain(tier)
    expect(ADD_ONS.dreamworlds_pass.eligibleTiers).toContain(tier)
    expect(ADD_ONS.extra_dreamworld.eligibleTiers).toContain(tier)
  })

  it('should have correct video tier spec (disabled)', () => {
    const spec = getVideoTierSpec(tier, 'dreamcatcher')
    expect(spec.durationSeconds).toBe(0) // No videos
    expect(spec.maxFrames).toBe(0) // No frames
    expect(spec.quality).toBe('high')
    expect(spec.fps).toBe(24)
    expect(spec.bitrate).toBe('0k')
    expect(spec.allowCustomAudio).toBe(false)
    expect(spec.allowWatermark).toBe(false)
    expect(spec.branding.text).toBe('') // No branding (no videos)
  })

  it('should have correct features list', () => {
    const plan = SUBSCRIPTION_PLANS[tier]
    expect(plan.features).toContain('20 personalised dream analyses per month')
    expect(plan.features).toContain('Symbolic tags')
    expect(plan.features).toContain('Deep Insights')
    expect(plan.features).toContain('Reflection Journal (ReflectAI) Access')
    expect(plan.features).toContain('Symbol Orchard (Symbolica AI) Access')
  })

  it('should NOT allow dreamworlds generation (must purchase)', () => {
    expect(getDreamworldsGenerationLimit(tier)).toBe(0)
    expect(getMaxVideoDuration(tier, 'dreamworlds')).toBe(0)
  })
})

describe('VIP Tier E2E Tests', () => {
  const tier: SubscriptionTier = 'vip'
  
  it('should have correct subscription limits', () => {
    const limits = getSubscriptionLimits(tier)
    expect(limits.dreamsPerMonth).toBe(25)
    expect(limits.videoGenerationsPerMonth).toBe(0) // No 6-sec videos, only Dreamworlds
    expect(limits.canUseAI).toBe(true)
    expect(limits.canGenerateVideos).toBe(false) // No 6-sec videos
    expect(limits.canAccessLeaderboard).toBe(true)
    expect(limits.maxDreamStories).toBe(999)
  })

  it('should have correct subscription plan details', () => {
    const plan = SUBSCRIPTION_PLANS[tier]
    expect(plan.monthlyPrice).toBe(29.99)
    expect(plan.annualPrice).toBe(299.90)
    expect(plan.monthlyCredits).toBe(25)
    expect(plan.dreamworldsAccess).toBe('included')
    expect(plan.dreamworldsPrice).toBe(6.99)
    expect(plan.maxDreamworldsPerMonth).toBe(1)
  })

  it('should allow AI interpretation', () => {
    expect(canPerformAction(tier, 'ai_interpretation')).toBe(true)
  })

  it('should NOT allow 6-sec video generation (only Dreamworlds)', () => {
    expect(canPerformAction(tier, 'video_generation')).toBe(false)
    expect(canGenerateVideos(tier)).toBe(false)
    expect(canGenerateVideo({ subscriptionTier: tier })).toBe(false)
  })

  it('should allow leaderboard access', () => {
    expect(canPerformAction(tier, 'leaderboard_access')).toBe(true)
  })

  it('should allow dream story creation', () => {
    expect(canPerformAction(tier, 'dream_story_creation')).toBe(true)
  })

  it('should have video generation limit of 0 (no 6-sec videos)', () => {
    expect(getVideoGenerationLimit(tier)).toBe(0)
  })

  it('should have dreamworlds limit of 1 per month', () => {
    expect(getDreamworldsGenerationLimit(tier)).toBe(1)
  })

  it('should NOT apply watermarks', () => {
    expect(shouldApplyWatermark({ subscriptionTier: tier })).toBe(false)
  })

  it('should have 0-second video duration for dreamcatcher (no 6-sec videos)', () => {
    expect(getMaxVideoDuration(tier, 'dreamcatcher')).toBe(0)
  })

  it('should have 45-second video duration for dreamworlds (1 per month)', () => {
    expect(getMaxVideoDuration(tier, 'dreamworlds')).toBe(45)
  })

  it('should have 45-second video duration for extended dreamworlds', () => {
    expect(getMaxVideoDuration(tier, 'dreamworlds-vip')).toBe(45)
  })

  it('should have ultra video quality', () => {
    expect(getVideoQuality(tier, 'dreamcatcher')).toBe('ultra')
    expect(getVideoQuality(tier, 'dreamworlds')).toBe('ultra')
  })

  it('should allow creating dream analyses up to monthly limit', () => {
    const profile = { subscriptionTier: tier, dreamsAnalyzedThisMonth: 24 }
    expect(canCreateDreamAnalysis(profile)).toBe(true)
  })

  it('should prevent dream analysis after monthly limit', () => {
    const profile = { subscriptionTier: tier, dreamsAnalyzedThisMonth: 25 }
    expect(canCreateDreamAnalysis(profile)).toBe(false)
  })

  it('should be eligible for all add-ons', () => {
    expect(ADD_ONS.deep_dive_report.eligibleTiers).toContain(tier)
    expect(ADD_ONS.dreamworlds_pass.eligibleTiers).toContain(tier)
    expect(ADD_ONS.extra_dreamworld.eligibleTiers).toContain(tier)
  })

  it('should have correct dreamcatcher video tier spec (disabled)', () => {
    const spec = getVideoTierSpec(tier, 'dreamcatcher')
    expect(spec.durationSeconds).toBe(0) // No 6-sec videos
    expect(spec.maxFrames).toBe(0) // No frames
    expect(spec.quality).toBe('ultra')
    expect(spec.fps).toBe(30)
    expect(spec.bitrate).toBe('0k')
    expect(spec.allowCustomAudio).toBe(false)
    expect(spec.allowWatermark).toBe(false)
    expect(spec.branding.text).toBe('') // No branding
  })

  it('should have correct dreamworlds video tier spec', () => {
    const spec = getVideoTierSpec(tier, 'dreamworlds')
    expect(spec.durationSeconds).toBe(45)
    expect(spec.maxFrames).toBe(15)
    expect(spec.quality).toBe('ultra')
    expect(spec.fps).toBe(30)
    expect(spec.bitrate).toBe('8000k')
    expect(spec.allowCustomAudio).toBe(true)
    expect(spec.allowWatermark).toBe(false)
    expect(spec.branding.text).toBe('Dreamworlds')
  })

  it('should have correct features list', () => {
    const plan = SUBSCRIPTION_PLANS[tier]
    expect(plan.features).toContain('25 personalised dream analyses per month')
    expect(plan.features).toContain('AI Narrated Interpretation')
    expect(plan.features).toContain('1 x Dreamworlds cinematic video generation')
  })
})

describe('Cross-Tier Comparison Tests', () => {
  it('should have increasing dream analysis limits', () => {
    const free = getSubscriptionLimits('free').dreamsPerMonth
    const pro = getSubscriptionLimits('pro').dreamsPerMonth
    const premium = getSubscriptionLimits('premium').dreamsPerMonth
    const vip = getSubscriptionLimits('vip').dreamsPerMonth
    
    expect(free).toBeLessThan(pro)
    expect(pro).toBeLessThan(premium)
    expect(premium).toBeLessThan(vip)
  })

  it('should have no 6-sec video generation limits (all tiers)', () => {
    const free = getVideoGenerationLimit('free')
    const pro = getVideoGenerationLimit('pro')
    const premium = getVideoGenerationLimit('premium')
    const vip = getVideoGenerationLimit('vip')
    
    expect(free).toBe(0)
    expect(pro).toBe(0)
    expect(premium).toBe(0) // No 6-sec videos
    expect(vip).toBe(0) // No 6-sec videos, only Dreamworlds
  })

  it('should have increasing video quality', () => {
    const freeSpec = getVideoTierSpec('free', 'dreamcatcher')
    const proSpec = getVideoTierSpec('pro', 'dreamcatcher')
    const premiumSpec = getVideoTierSpec('premium', 'dreamcatcher')
    const vipSpec = getVideoTierSpec('vip', 'dreamcatcher')
    
    expect(freeSpec.quality).toBe('low')
    expect(proSpec.quality).toBe('medium')
    expect(premiumSpec.quality).toBe('high')
    expect(vipSpec.quality).toBe('ultra')
  })

  it('should have no watermarks on any tier', () => {
    expect(shouldApplyWatermark({ subscriptionTier: 'free' })).toBe(false)
    expect(shouldApplyWatermark({ subscriptionTier: 'pro' })).toBe(false)
    expect(shouldApplyWatermark({ subscriptionTier: 'premium' })).toBe(false)
    expect(shouldApplyWatermark({ subscriptionTier: 'vip' })).toBe(false)
  })

  it('should only allow dreamworlds on VIP tier', () => {
    expect(getDreamworldsGenerationLimit('free')).toBe(0)
    expect(getDreamworldsGenerationLimit('pro')).toBe(0)
    expect(getDreamworldsGenerationLimit('premium')).toBe(0)
    expect(getDreamworldsGenerationLimit('vip')).toBe(1)
  })

  it('should have correct pricing structure', () => {
    expect(SUBSCRIPTION_PLANS.free.monthlyPrice).toBe(0)
    expect(SUBSCRIPTION_PLANS.pro.monthlyPrice).toBe(9.99)
    expect(SUBSCRIPTION_PLANS.premium.monthlyPrice).toBe(19.99)
    expect(SUBSCRIPTION_PLANS.vip.monthlyPrice).toBe(29.99)
  })

  it('should have consistent annual pricing discount (~17%)', () => {
    const proMonthly = SUBSCRIPTION_PLANS.pro.monthlyPrice * 12
    const proAnnual = SUBSCRIPTION_PLANS.pro.annualPrice
    const proDiscount = ((proMonthly - proAnnual) / proMonthly) * 100
    expect(proDiscount).toBeGreaterThan(15)
    expect(proDiscount).toBeLessThan(20)

    const premiumMonthly = SUBSCRIPTION_PLANS.premium.monthlyPrice * 12
    const premiumAnnual = SUBSCRIPTION_PLANS.premium.annualPrice
    const premiumDiscount = ((premiumMonthly - premiumAnnual) / premiumMonthly) * 100
    expect(premiumDiscount).toBeGreaterThan(15)
    expect(premiumDiscount).toBeLessThan(20)

    const vipMonthly = SUBSCRIPTION_PLANS.vip.monthlyPrice * 12
    const vipAnnual = SUBSCRIPTION_PLANS.vip.annualPrice
    const vipDiscount = ((vipMonthly - vipAnnual) / vipMonthly) * 100
    expect(vipDiscount).toBeGreaterThan(15)
    expect(vipDiscount).toBeLessThan(20)
  })
})
