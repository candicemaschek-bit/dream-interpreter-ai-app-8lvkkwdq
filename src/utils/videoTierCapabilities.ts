/**
 * Video Tier Capabilities Module
 * Defines video specifications, branding, and capabilities for each subscription tier
 * 
 * ⚠️ IMPORTANT: Integrates with centralized tier capabilities config
 * Video-specific logic is managed here, but uses src/config/tierCapabilities.ts for tier checks
 * Cost values are imported from src/config/tierCosts.ts (SINGLE SOURCE OF TRUTH)
 * 
 * Video Types:
 * - Dreamcatcher AI (6 seconds): Individual dream visualizations for Premium/VIP
 * - Dreamworlds (45 seconds): Curated dream collections (VIP only)
 * - Dreamworlds VIP (120 seconds/2 min): Extended cinematic experience (VIP pass holders)
 */

import type { SubscriptionTier } from '../config/tierCapabilities';
import { VIDEO_COSTS, calculateVideoCost as calcVideoCost } from '../config/tierCosts';

/**
 * Branding configuration for different video types
 */
export interface VideoBrandingConfig {
  text: string;
  position: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left' | 'center';
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  opacity: number;
  paddingX: number;
  paddingY: number;
  borderRadius?: number;
  animationStyle?: 'fade-in' | 'slide-in' | 'static';
  animationDuration?: number; // milliseconds
}

/**
 * Video specifications for each tier and type
 */
export interface VideoTierSpec {
  tier: SubscriptionTier;
  videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip';
  durationSeconds: number;
  maxFrames: number;
  branding: VideoBrandingConfig;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  bitrate: string;
  codec: string;
  allowCustomAudio: boolean;
  allowWatermark: boolean;
}

/**
 * Tier capabilities for video generation
 */
export const VIDEO_TIER_SPECS: Record<string, VideoTierSpec> = {
  // Free tier - no video generation
  'free-dreamcatcher': {
    tier: 'free',
    videoType: 'dreamcatcher',
    durationSeconds: 0,
    maxFrames: 0,
    branding: {
      text: '',
      position: 'bottom-right',
      fontSize: 20,
      fontFamily: 'Inter, sans-serif',
      color: 'rgba(255, 255, 255, 1)',
      opacity: 1,
      paddingX: 20,
      paddingY: 20,
    },
    quality: 'low',
    fps: 24,
    bitrate: '0k',
    codec: 'h264',
    allowCustomAudio: false,
    allowWatermark: false,
  },

  // Pro tier - no video generation
  'pro-dreamcatcher': {
    tier: 'pro',
    videoType: 'dreamcatcher',
    durationSeconds: 0,
    maxFrames: 0,
    branding: {
      text: '',
      position: 'bottom-right',
      fontSize: 20,
      fontFamily: 'Inter, sans-serif',
      color: 'rgba(255, 255, 255, 1)',
      opacity: 1,
      paddingX: 20,
      paddingY: 20,
    },
    quality: 'medium',
    fps: 24,
    bitrate: '2500k',
    codec: 'h264',
    allowCustomAudio: false,
    allowWatermark: false,
  },

  // Premium tier - no video generation (no 6-second videos)
  'premium-dreamcatcher': {
    tier: 'premium',
    videoType: 'dreamcatcher',
    durationSeconds: 0,
    maxFrames: 0,
    branding: {
      text: '',
      position: 'bottom-right',
      fontSize: 20,
      fontFamily: 'Inter, sans-serif',
      color: 'rgba(255, 255, 255, 1)',
      opacity: 1,
      paddingX: 20,
      paddingY: 20,
    },
    quality: 'high',
    fps: 24,
    bitrate: '0k',
    codec: 'h264',
    allowCustomAudio: false,
    allowWatermark: false,
  },

  // VIP tier - no 6-second videos (only Dreamworlds 45-sec videos)
  'vip-dreamcatcher': {
    tier: 'vip',
    videoType: 'dreamcatcher',
    durationSeconds: 0,
    maxFrames: 0,
    branding: {
      text: '',
      position: 'bottom-right',
      fontSize: 20,
      fontFamily: 'Inter, sans-serif',
      color: 'rgba(255, 255, 255, 1)',
      opacity: 1,
      paddingX: 20,
      paddingY: 20,
    },
    quality: 'ultra',
    fps: 30,
    bitrate: '0k',
    codec: 'h264',
    allowCustomAudio: false,
    allowWatermark: false,
  },

  // VIP tier - 45-second Dreamworlds cinematic videos (from curated dream collections)
  'vip-dreamworlds': {
    tier: 'vip',
    videoType: 'dreamworlds',
    durationSeconds: 45,
    maxFrames: 15,
    branding: {
      text: 'Dreamworlds',
      position: 'bottom-right',
      fontSize: 28,
      fontFamily: 'Inter, sans-serif',
      color: 'rgba(255, 255, 255, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.4)',
      opacity: 0.9,
      paddingX: 20,
      paddingY: 16,
      borderRadius: 10,
      animationStyle: 'fade-in',
      animationDuration: 800,
    },
    quality: 'ultra',
    fps: 30,
    bitrate: '8000k',
    codec: 'h264',
    allowCustomAudio: true, // Includes voice narration and music
    allowWatermark: false,
  },

  // VIP tier - 45-second Dreamworlds cinematic videos with sound (includes voice narration + music)
  'vip-dreamworlds-vip': {
    tier: 'vip',
    videoType: 'dreamworlds-vip',
    durationSeconds: 45,
    maxFrames: 15, // 15 frames for smooth 45s cinematic video
    branding: {
      text: 'Dreamworlds',
      position: 'bottom-right',
      fontSize: 28,
      fontFamily: 'Inter, sans-serif',
      color: 'rgba(255, 255, 255, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.4)',
      opacity: 0.9,
      paddingX: 20,
      paddingY: 16,
      borderRadius: 10,
      animationStyle: 'fade-in',
      animationDuration: 800,
    },
    quality: 'ultra',
    fps: 30,
    bitrate: '8000k',
    codec: 'h264',
    allowCustomAudio: true, // Voice narration + ambient music included
    allowWatermark: false,
  },
};

/**
 * Get video tier spec for a given tier and video type
 */
export function getVideoTierSpec(
  tier: SubscriptionTier,
  videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' = 'dreamcatcher'
): VideoTierSpec {
  const key = `${tier}-${videoType}`;
  const spec = VIDEO_TIER_SPECS[key];

  if (!spec) {
    // Fallback for unsupported combinations
    console.warn(`⚠️ No video spec for tier=${tier}, videoType=${videoType}. Using defaults.`);
    return VIDEO_TIER_SPECS['free-dreamcatcher']!;
  }

  return spec;
}

/**
 * Check if a tier can generate videos
 */
export function canGenerateVideos(tier: SubscriptionTier): boolean {
  const spec = getVideoTierSpec(tier, 'dreamcatcher');
  return spec.durationSeconds > 0;
}

/**
 * Get maximum video duration for a tier
 */
export function getMaxVideoDuration(
  tier: SubscriptionTier,
  videoType?: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip'
): number {
  const type = videoType || 'dreamcatcher';
  const spec = getVideoTierSpec(tier, type);
  return spec.durationSeconds;
}

/**
 * Get branding configuration for a tier
 */
export function getVideoBranding(
  tier: SubscriptionTier,
  videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' = 'dreamcatcher'
): VideoBrandingConfig {
  const spec = getVideoTierSpec(tier, videoType);
  return spec.branding;
}

/**
 * Validate if a requested duration is within tier limits
 */
export function isValidDurationForTier(
  tier: SubscriptionTier,
  durationSeconds: number,
  videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' = 'dreamcatcher'
): boolean {
  const spec = getVideoTierSpec(tier, videoType);
  return durationSeconds <= spec.durationSeconds && durationSeconds > 0;
}

/**
 * Get quality setting for a tier
 */
export function getVideoQuality(
  tier: SubscriptionTier,
  videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' = 'dreamcatcher'
): string {
  const spec = getVideoTierSpec(tier, videoType);
  return spec.quality;
}

/**
 * Calculate cost for video generation based on tier and type
 * 
 * ⚠️ IMPORTANT: Uses centralized costs from src/config/tierCosts.ts
 * 
 * OPTION 2: Cost-Optimized flat-rate model for 78% cost reduction
 * 
 * Cost Breakdown (from tierCosts.ts):
 * - Dreamcatcher 6s: $0.1123 (base $0.10 + mood $0.0003 + frames $0.008 + storage $0.004)
 * - Dreamworlds 45s: $1.57 (base $1.50 + mood $0.0003 + frames $0.06 + storage $0.01)
 * - Dreamworlds VIP: $3.07 (base $3.00 + mood $0.0003 + frames $0.06 + storage $0.012)
 * 
 * 78% cost reduction! 🎉
 */
export function calculateVideoCost(
  tier: SubscriptionTier,
  videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' = 'dreamcatcher',
  durationSeconds?: number
): number {
  // Use centralized cost calculation from tierCosts.ts
  return calcVideoCost(videoType);
}

/**
 * Get video generation limits for tier (per month)
 * NOTE: Premium and VIP have NO 6-sec video generation
 * Only Dreamworlds (45-sec) videos are available
 */
export function getVideoGenerationLimit(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return 0;
    case 'pro':
      return 0;
    case 'premium':
      return 0; // No 6-sec videos
    case 'vip':
      return 0; // No 6-sec videos, only 1 Dreamworld per month
  }
}

/**
 * Get Dreamworlds generation limits for tier (per month)
 * Note: All tiers can purchase additional DreamWorlds at $6.99 each
 */
export function getDreamworldsGenerationLimit(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return 0; // No included, but can purchase add-ons
    case 'pro':
      return 0; // No included, but can purchase add-ons
    case 'premium':
      return 0; // No included, but can purchase add-ons
    case 'vip':
      return 1; // 1 Dreamworlds video per month (included in subscription)
  }
}

/**
 * Determine which video type to use based on tier and context
 */
export function selectVideoType(
  tier: SubscriptionTier,
  isDreamworldsVideo: boolean = false,
  isVipDreamworlds: boolean = false
): 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' {
  if (isDreamworldsVideo) {
    if (isVipDreamworlds && tier === 'vip') {
      return 'dreamworlds-vip'; // 120-second VIP experience
    }
    if (tier === 'vip') {
      return 'dreamworlds'; // 45-second standard Dreamworlds
    }
  }
  return 'dreamcatcher'; // Default to 6-second Dreamcatcher AI
}

/**
 * Type guard for valid video types
 */
export function isValidVideoType(
  value: unknown
): value is 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' {
  return value === 'dreamcatcher' || value === 'dreamworlds' || value === 'dreamworlds-vip';
}