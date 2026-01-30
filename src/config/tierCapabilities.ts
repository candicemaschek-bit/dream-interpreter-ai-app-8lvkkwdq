/**
 * Centralized Tier Capabilities Configuration
 * Single source of truth for all subscription tier logic
 * 
 * This file consolidates all tier-based permissions, limits, and feature access
 * to ensure consistency across the entire application.
 */

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'vip'

/**
 * Comprehensive tier capabilities definition
 */
export interface TierCapabilities {
  // Identification
  tier: SubscriptionTier
  displayName: string
  
  // Core Limits
  dreamsPerMonth: number
  isLifetimeLimit: boolean // true for free tier (lifetime, not monthly)
  
  // Dream Analysis Features
  canUseAI: boolean
  hasDeepInsights: boolean
  hasHDImages: boolean
  hasSymbolicTags: boolean
  hasVoiceRecording: boolean
  
  // Video Features
  canGenerateVideos: boolean // 6-second dreamcatcher videos
  videoGenerationsPerMonth: number
  canGenerateDreamworlds: boolean // 45-second cinematic videos
  dreamworldsPerMonth: number // Included in subscription
  dreamworldsPrice: number // Price for additional Dreamworlds
  canPurchaseDreamworlds: boolean
  
  // Advanced Analysis Features
  canAccessReflectAI: boolean // Reflection Journal
  canAccessSymbolicaAI: boolean // Symbol Orchard
  canAccessLumenAI: boolean // Emotional Guidance
  hasAdvancedPatternDetection: boolean // Nightmare/recurring cycle detection
  hasPsychologicalInsights: boolean // VIP-only deep insights
  
  // Pattern Recognition Features (Phase 2)
  hasEmotionHeatmap: boolean // Visual emotion tracking
  hasPatternInsights: boolean // AI-generated pattern insights
  maxHeatmapRange: number // Days of heatmap history (14, 30, or 90)
  hasSensitiveContentControl: boolean // On-device classification
  
  // Audio Features
  canUseTTS: boolean // Text-to-speech narration
  ttsMonthlyBudgetUSD: number
  canTranscribeAudio: boolean
  transcriptionsPerMonth: number
  transcriptionsLifetimeLimit?: number // Only for free tier: 2 lifetime max
  
  // Personalization
  hasPersonaAvatar: boolean // Custom avatar across dream visuals
  
  // Other Features
  canAccessLeaderboard: boolean
  maxDreamStories: number
  
  // Add-On Eligibility
  canPurchaseDeepDiveReport: boolean
  
  // UI Display
  showWatermark: boolean // Always false in current model
  badgeColor: string // For tier badge display
  isComingSoon: boolean
}

/**
 * Centralized tier capabilities configuration
 * ALL tier-based logic should reference this constant
 */
export const TIER_CAPABILITIES: Record<SubscriptionTier, TierCapabilities> = {
  free: {
    tier: 'free',
    displayName: 'Dreamer',
    
    // Core Limits
    dreamsPerMonth: 2,
    isLifetimeLimit: true, // 2 dreams LIFETIME, not monthly
    
    // Dream Analysis
    canUseAI: true,
    hasDeepInsights: false,
    hasHDImages: false,
    hasSymbolicTags: true,
    hasVoiceRecording: false,
    
    // Video
    canGenerateVideos: false,
    videoGenerationsPerMonth: 0,
    canGenerateDreamworlds: false,
    dreamworldsPerMonth: 0,
    dreamworldsPrice: 6.99,
    canPurchaseDreamworlds: true,
    
    // Advanced Features
    canAccessReflectAI: false,
    canAccessSymbolicaAI: false,
    canAccessLumenAI: false,
    hasAdvancedPatternDetection: false,
    hasPsychologicalInsights: false,
    
    // Pattern Recognition (Phase 2)
    hasEmotionHeatmap: false,
    hasPatternInsights: false,
    maxHeatmapRange: 14, // 2 weeks max for free
    hasSensitiveContentControl: true, // Always available for privacy
    
    // Audio
    canUseTTS: false,
    ttsMonthlyBudgetUSD: 0,
    canTranscribeAudio: true, // Enabled for free tier with limited quota
    transcriptionsPerMonth: 2,
    transcriptionsLifetimeLimit: 2, // 2 lifetime max for free tier

    
    // Personalization
    hasPersonaAvatar: false,
    
    // Other
    canAccessLeaderboard: false,
    maxDreamStories: 0,
    canPurchaseDeepDiveReport: true,
    
    // UI
    showWatermark: false,
    badgeColor: 'bg-gray-100 text-gray-700',
    isComingSoon: false,
  },
  
  pro: {
    tier: 'pro',
    displayName: 'Visionary',
    
    // Core Limits
    dreamsPerMonth: 10,
    isLifetimeLimit: false,
    
    // Dream Analysis
    canUseAI: true,
    hasDeepInsights: true,
    hasHDImages: true,
    hasSymbolicTags: true,
    hasVoiceRecording: true,
    
    // Video
    canGenerateVideos: false,
    videoGenerationsPerMonth: 0,
    canGenerateDreamworlds: false,
    dreamworldsPerMonth: 0,
    dreamworldsPrice: 6.99,
    canPurchaseDreamworlds: true,
    
    // Advanced Features
    canAccessReflectAI: false,
    canAccessSymbolicaAI: false,
    canAccessLumenAI: false,
    hasAdvancedPatternDetection: false,
    hasPsychologicalInsights: false,
    
    // Pattern Recognition (Phase 2)
    hasEmotionHeatmap: false, // Not available for Pro
    hasPatternInsights: false,
    maxHeatmapRange: 14,
    hasSensitiveContentControl: true,
    
    // Audio
    canUseTTS: false,
    ttsMonthlyBudgetUSD: 0,
    canTranscribeAudio: true,
    transcriptionsPerMonth: 10,
    // No lifetime limit for paid tiers (monthly reset instead)
    
    // Personalization
    hasPersonaAvatar: false,
    
    // Other
    canAccessLeaderboard: true,
    maxDreamStories: 5,
    canPurchaseDeepDiveReport: true,
    
    // UI
    showWatermark: false,
    badgeColor: 'bg-blue-100 text-blue-700',
    isComingSoon: false,
  },
  
  premium: {
    tier: 'premium',
    displayName: 'Architect',
    
    // Core Limits
    dreamsPerMonth: 20,
    isLifetimeLimit: false,
    
    // Dream Analysis
    canUseAI: true,
    hasDeepInsights: true,
    hasHDImages: true,
    hasSymbolicTags: true,
    hasVoiceRecording: true,
    
    // Video
    canGenerateVideos: false, // No 6-second videos
    videoGenerationsPerMonth: 0,
    canGenerateDreamworlds: false, // Can purchase but not included
    dreamworldsPerMonth: 0,
    dreamworldsPrice: 6.99,
    canPurchaseDreamworlds: true,
    
    // Advanced Features
    canAccessReflectAI: true, // Reflection Journal access
    canAccessSymbolicaAI: true, // Symbol Orchard access
    canAccessLumenAI: false,
    hasAdvancedPatternDetection: true, // Recurring & nightmare cycles
    hasPsychologicalInsights: false,
    
    // Pattern Recognition (Phase 2) - PREMIUM: Basic visualizations
    hasEmotionHeatmap: true, // Basic heatmap with 30-day view
    hasPatternInsights: false, // No AI insights (VIP only)
    maxHeatmapRange: 30, // 30 days of history
    hasSensitiveContentControl: true,
    
    // Audio
    canUseTTS: false,
    ttsMonthlyBudgetUSD: 0,
    canTranscribeAudio: true,
    transcriptionsPerMonth: 20,
    // No lifetime limit for paid tiers (monthly reset instead)
    
    // Personalization
    hasPersonaAvatar: false,
    
    // Other
    canAccessLeaderboard: true,
    maxDreamStories: 10,
    canPurchaseDeepDiveReport: true,
    
    // UI
    showWatermark: false,
    badgeColor: 'bg-purple-100 text-purple-700',
    isComingSoon: false,
  },
  
  vip: {
    tier: 'vip',
    displayName: 'Star',
    
    // Core Limits
    dreamsPerMonth: 25,
    isLifetimeLimit: false,
    
    // Dream Analysis
    canUseAI: true,
    hasDeepInsights: true,
    hasHDImages: true,
    hasSymbolicTags: true,
    hasVoiceRecording: true,
    
    // Video
    canGenerateVideos: false, // No 6-second videos
    videoGenerationsPerMonth: 0,
    canGenerateDreamworlds: true, // Included in subscription
    dreamworldsPerMonth: 1, // 1 included per month
    dreamworldsPrice: 6.99, // Additional after first
    canPurchaseDreamworlds: true,
    
    // Advanced Features
    canAccessReflectAI: true, // Full access
    canAccessSymbolicaAI: true, // Full access
    canAccessLumenAI: true, // Emotional Guidance & Mindfulness
    hasAdvancedPatternDetection: true,
    hasPsychologicalInsights: true, // VIP exclusive deep insights
    
    // Pattern Recognition (Phase 2) - VIP: Advanced with AI Insights
    hasEmotionHeatmap: true, // Full heatmap with 90-day view
    hasPatternInsights: true, // AI-generated pattern insights
    maxHeatmapRange: 90, // 90 days of history (3 months)
    hasSensitiveContentControl: true,
    
    // Audio
    canUseTTS: true, // AI narrated interpretation
    ttsMonthlyBudgetUSD: 0.94,
    canTranscribeAudio: true,
    transcriptionsPerMonth: 25,
    // No lifetime limit for paid tiers (monthly reset instead)
    
    // Personalization
    hasPersonaAvatar: true, // Custom avatar across dream visuals
    
    // Other
    canAccessLeaderboard: true,
    maxDreamStories: 999,
    canPurchaseDeepDiveReport: true,
    
    // UI
    showWatermark: false,
    badgeColor: 'bg-amber-100 text-amber-700',
    isComingSoon: true,
  },
}

/**
 * Helper Functions - Use these throughout the app
 */

export function getTierCapabilities(tier: SubscriptionTier): TierCapabilities {
  return TIER_CAPABILITIES[tier] || TIER_CAPABILITIES.free
}

export function canCreateDreamAnalysis(
  tier: SubscriptionTier,
  dreamsAnalyzedThisMonth: number,
  dreamsAnalyzedLifetime?: number
): boolean {
  const caps = getTierCapabilities(tier)
  
  // Free tier uses lifetime limit
  if (caps.isLifetimeLimit) {
    const lifetime = dreamsAnalyzedLifetime ?? dreamsAnalyzedThisMonth
    return lifetime < caps.dreamsPerMonth
  }
  
  // Paid tiers use monthly limit
  return dreamsAnalyzedThisMonth < caps.dreamsPerMonth
}

export function canGenerateVideo(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).canGenerateVideos
}

export function canGenerateDreamworlds(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).canGenerateDreamworlds
}

export function canAccessReflectAI(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).canAccessReflectAI
}

export function canAccessSymbolicaAI(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).canAccessSymbolicaAI
}

export function canAccessLumenAI(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).canAccessLumenAI
}

export function canUseTTS(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).canUseTTS
}

export function shouldApplyWatermark(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).showWatermark
}

export function hasAdvancedPatternDetection(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).hasAdvancedPatternDetection
}

export function hasPsychologicalInsights(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).hasPsychologicalInsights
}

export function hasEmotionHeatmap(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).hasEmotionHeatmap
}

export function hasPatternInsights(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).hasPatternInsights
}

export function getMaxHeatmapRange(tier: SubscriptionTier): number {
  return getTierCapabilities(tier).maxHeatmapRange
}

export function hasSensitiveContentControl(tier: SubscriptionTier): boolean {
  return getTierCapabilities(tier).hasSensitiveContentControl
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  return getTierCapabilities(tier).displayName
}

export function getTierBadgeColor(tier: SubscriptionTier): string {
  return getTierCapabilities(tier).badgeColor
}

export function getRemainingDreams(
  tier: SubscriptionTier,
  dreamsAnalyzedThisMonth: number,
  dreamsAnalyzedLifetime?: number
): number {
  const caps = getTierCapabilities(tier)
  
  if (caps.isLifetimeLimit) {
    const lifetime = dreamsAnalyzedLifetime ?? dreamsAnalyzedThisMonth
    return Math.max(0, caps.dreamsPerMonth - lifetime)
  }
  
  return Math.max(0, caps.dreamsPerMonth - dreamsAnalyzedThisMonth)
}

export function getDreamLimit(tier: SubscriptionTier): number {
  return getTierCapabilities(tier).dreamsPerMonth
}

export function getTTSMonthlyBudget(tier: SubscriptionTier): number {
  return getTierCapabilities(tier).ttsMonthlyBudgetUSD
}

export function canTranscribeAudio(_tier: SubscriptionTier, _hasLaunchOffer?: boolean): boolean {
  // Strategy A: Transcription is now available to ALL tiers with no restrictions
  // This aligns with the "Available to all Tiers with no cost limits" policy
  // The only limits are the per-tier monthly quotas (handled by the edge function)
  return true
}

export function getTranscriptionLimit(tier: SubscriptionTier): number {
  return getTierCapabilities(tier).transcriptionsPerMonth
}

/**
 * Check if user can transcribe based on lifetime limit (free tier only)
 * Free tier: 2 transcriptions LIFETIME
 * Paid tiers: monthly limits (no lifetime restriction)
 */
export function canTranscribeWithinLifetimeLimit(
  tier: SubscriptionTier,
  transcriptionsUsedLifetime: number
): boolean {
  const caps = getTierCapabilities(tier)
  
  // Only free tier has lifetime limit check (if defined)
  if (tier !== 'free') return true
  
  // If no lifetime limit is defined, allow unlimited
  if (caps.transcriptionsLifetimeLimit === undefined) return true
  
  // Free tier limit
  const lifetimeLimit = caps.transcriptionsLifetimeLimit
  return transcriptionsUsedLifetime < lifetimeLimit
}

/**
 * Get transcription limit info for display in UI
 */
export function getTranscriptionLimitInfo(tier: SubscriptionTier): {
  isLifetimeLimit: boolean
  limit: number
  description: string
} {
  const caps = getTierCapabilities(tier)
  
  if (tier === 'free' && caps.transcriptionsLifetimeLimit !== undefined) {
    return {
      isLifetimeLimit: true,
      limit: caps.transcriptionsLifetimeLimit,
      description: `${caps.transcriptionsLifetimeLimit} transcriptions lifetime for free tier`
    }
  }
  
  return {
    isLifetimeLimit: false,
    limit: caps.transcriptionsPerMonth,
    description: `${caps.transcriptionsPerMonth} transcriptions per month`
  }
}

/**
 * Legacy compatibility - these functions maintain backward compatibility
 * while using the centralized config
 */

export interface SubscriptionLimits {
  dreamsPerMonth: number
  videoGenerationsPerMonth: number
  canUseAI: boolean
  canGenerateVideos: boolean
  canAccessLeaderboard: boolean
  maxDreamStories: number
}

export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  const caps = getTierCapabilities(tier)
  
  return {
    dreamsPerMonth: caps.dreamsPerMonth,
    videoGenerationsPerMonth: caps.videoGenerationsPerMonth,
    canUseAI: caps.canUseAI,
    canGenerateVideos: caps.canGenerateVideos,
    canAccessLeaderboard: caps.canAccessLeaderboard,
    maxDreamStories: caps.maxDreamStories,
  }
}

export function canPerformAction(tier: SubscriptionTier, action: string): boolean {
  const caps = getTierCapabilities(tier)
  
  const actionMap: Record<string, boolean> = {
    ai_interpretation: caps.canUseAI,
    video_generation: caps.canGenerateVideos,
    dreamworlds_generation: caps.canGenerateDreamworlds,
    leaderboard_access: caps.canAccessLeaderboard,
    dream_story_creation: caps.maxDreamStories > 0,
    reflect_ai: caps.canAccessReflectAI,
    symbolica_ai: caps.canAccessSymbolicaAI,
    lumen_ai: caps.canAccessLumenAI,
    tts_narration: caps.canUseTTS,
    advanced_patterns: caps.hasAdvancedPatternDetection,
    psychological_insights: caps.hasPsychologicalInsights,
  }
  
  return actionMap[action] ?? true
}

export function formatTierName(tier: SubscriptionTier): string {
  return getTierCapabilities(tier).displayName
}