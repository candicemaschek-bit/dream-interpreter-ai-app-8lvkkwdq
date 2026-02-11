/**
 * Video Generation Types
 * Comprehensive type definitions for video generation and playback
 */

import type { SubscriptionTier } from './subscription'

/**
 * Video generation stages for progress tracking
 */
export type VideoGenerationStage = 
  | 'generating-frames' 
  | 'composing-video' 
  | 'uploading' 
  | 'complete'

/**
 * Video generation method
 */
export type VideoGenerationMethod = 'blink-ai' | 'runway-ml' | 'stable-diffusion'

/**
 * Video type for branding and duration configuration
 * Integrated with videoTierCapabilities module
 */
export type VideoType = 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip'

/**
 * Video format and quality settings
 */
export interface VideoFormat {
  mimeType: 'video/mp4' | 'video/webm' | 'video/quicktime'
  codec: 'h264' | 'vp8' | 'vp9'
  quality: 'low' | 'medium' | 'high' | 'ultra'
}

/**
 * Video generation request payload
 */
export interface VideoGenerationRequest {
  imageUrl: string
  prompt: string
  userId: string
  subscriptionTier: SubscriptionTier
  durationSeconds?: number
  format?: VideoFormat
  videoType?: VideoType
  isDreamworldsVideo?: boolean
  isVipDreamworlds?: boolean
}

/**
 * Video generation response
 */
export interface VideoGenerationResponse {
  success: boolean
  videoUrl: string
  method: VideoGenerationMethod
  duration: number
  format: string
  framesGenerated: number
  thumbnailUrl?: string
  metadata?: VideoGenerationMetadata
  videoType?: VideoType
  brandingApplied?: boolean
}

/**
 * Video generation metadata
 */
export interface VideoGenerationMetadata {
  framesGenerated: number
  durationMs: number
  totalCost: number
  frameCosts: number[]
  uploadSize: number
  generatedAt: string
}

/**
 * Video generation error
 */
export interface VideoGenerationError {
  error: string
  code?: string
  stage?: VideoGenerationStage
  retryable?: boolean
}

/**
 * Video generation progress state
 */
export interface VideoGenerationProgress {
  stage: VideoGenerationStage
  currentFrame: number
  totalFrames: number
  progress: number // 0-100
  estimatedTimeRemaining?: number
  message?: string
}

/**
 * Video player state
 */
export interface VideoPlayerState {
  isPlaying: boolean
  isMuted: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  isFullscreen: boolean
  hasError: boolean
  errorMessage?: string
}

/**
 * Video playback controls
 */
export interface VideoControls {
  play: () => Promise<void>
  pause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  togglePlayPause: () => Promise<void>
  toggleMute: () => void
  toggleFullscreen: () => Promise<void>
  setPlaybackRate: (rate: number) => void
}

/**
 * Video file information
 */
export interface VideoFile {
  url: string
  filename: string
  size: number
  mimeType: string
  duration: number
  width: number
  height: number
  framerate: number
  codec: string
  bitrate: number
}

/**
 * Frame generation prompt configuration
 */
export interface FramePrompt {
  index: number
  prompt: string
  style: 'cinematic' | 'dreamy' | 'surreal' | 'realistic'
  effects: string[]
  transitionFrom?: number
}

/**
 * Video composition settings
 */
export interface VideoCompositionSettings {
  frames: VideoFrame[]
  totalDuration: number
  fps: number
  transitions: TransitionEffect[]
  audioTrack?: AudioTrack
  effects?: VideoEffect[]
}

/**
 * Individual video frame
 */
export interface VideoFrame {
  url: string
  duration: number
  transition?: TransitionEffect
  index: number
  timestamp: number
}

/**
 * Transition effect between frames
 */
export interface TransitionEffect {
  type: 'crossfade' | 'fade' | 'wipe' | 'dissolve' | 'none'
  duration: number
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/**
 * Audio track for video
 */
export interface AudioTrack {
  url: string
  volume: number
  startTime: number
  fadeIn?: number
  fadeOut?: number
}

/**
 * Video effect
 */
export interface VideoEffect {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'vignette'
  intensity: number
  startTime: number
  endTime: number
}

/**
 * Video generation cost calculation
 */
export interface VideoGenerationCost {
  baseCost: number
  perFrameCost: number
  perSecondCost: number
  storageCost: number
  totalCost: number
  currency: 'USD'
}

/**
 * Video URL validation result
 */
export interface VideoUrlValidation {
  isValid: boolean
  hasCorrectExtension: boolean
  isAccessible: boolean
  mimeType?: string
  errorMessage?: string
}

/**
 * Subscription tier video capabilities
 */
export interface VideoCapabilities {
  maxDuration: number
  maxFrames: number
  quality: VideoFormat['quality']
  allowCustomAudio: boolean
  allowAdvancedEffects: boolean
  priorityProcessing: boolean
}

/**
 * Video generation analytics event
 */
export interface VideoGenerationAnalytics {
  dreamId: string
  userId: string
  subscriptionTier: SubscriptionTier
  durationSeconds: number
  framesGenerated: number
  totalCost: number
  generationTimeMs: number
  method: VideoGenerationMethod
  success: boolean
  errorMessage?: string
}

/**
 * Type guard: Check if value is a valid video URL
 */
export function isVideoUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    const parsedUrl = new URL(url)
    const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase()
    return extension === 'mp4' || extension === 'webm' || extension === 'mov'
  } catch {
    return false
  }
}

/**
 * Type guard: Check if value is a VideoGenerationResponse
 */
export const isVideoGenerationResponse = (value: unknown): value is VideoGenerationResponse => {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.success === 'boolean' &&
    typeof obj.videoUrl === 'string' &&
    typeof obj.method === 'string' &&
    typeof obj.duration === 'number' &&
    typeof obj.format === 'string' &&
    typeof obj.framesGenerated === 'number'
  )
}

/**
 * Type guard: Check if value is a VideoGenerationError
 */
export const isVideoGenerationError = (value: unknown): value is VideoGenerationError => {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return typeof obj.error === 'string'
}

/**
 * Get video capabilities for subscription tier
 */
export function getVideoCapabilities(tier: SubscriptionTier): VideoCapabilities {
  switch (tier) {
    case 'free':
      return {
        maxDuration: 0,
        maxFrames: 0,
        quality: 'low',
        allowCustomAudio: false,
        allowAdvancedEffects: false,
        priorityProcessing: false
      }
    case 'pro':
      return {
        maxDuration: 6,
        maxFrames: 3,
        quality: 'medium',
        allowCustomAudio: false,
        allowAdvancedEffects: false,
        priorityProcessing: false
      }
    case 'premium':
      return {
        maxDuration: 6,
        maxFrames: 3,
        quality: 'high',
        allowCustomAudio: true,
        allowAdvancedEffects: true,
        priorityProcessing: true
      }
    case 'vip':
      return {
        maxDuration: 45,
        maxFrames: 15,
        quality: 'ultra',
        allowCustomAudio: true,
        allowAdvancedEffects: true,
        priorityProcessing: true
      }
  }
}

/**
 * Calculate video generation cost
 */
export function calculateVideoGenerationCost(
  durationSeconds: number,
  framesGenerated: number
): VideoGenerationCost {
  const baseCost = 0.20
  const perFrameCost = 0.004
  const perSecondCost = 0.05
  const storageCost = 0.001 * durationSeconds
  
  const totalCost = baseCost + (framesGenerated * perFrameCost) + (durationSeconds * perSecondCost) + storageCost
  
  return {
    baseCost,
    perFrameCost,
    perSecondCost,
    storageCost,
    totalCost,
    currency: 'USD'
  }
}

/**
 * Validate video URL format and accessibility
 */
export async function validateVideoUrl(url: string): Promise<VideoUrlValidation> {
  // Basic format validation
  if (!isVideoUrl(url)) {
    return {
      isValid: false,
      hasCorrectExtension: false,
      isAccessible: false,
      errorMessage: 'Invalid video URL format or extension'
    }
  }
  
  // Check extension
  const extension = url.split('.').pop()?.toLowerCase()
  const hasCorrectExtension = extension === 'mp4' || extension === 'webm' || extension === 'mov'
  
  // Check accessibility (HEAD request)
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const isAccessible = response.ok
    const mimeType = response.headers.get('content-type') || undefined
    
    return {
      isValid: isAccessible && hasCorrectExtension,
      hasCorrectExtension,
      isAccessible,
      mimeType
    }
  } catch (error) {
    return {
      isValid: false,
      hasCorrectExtension,
      isAccessible: false,
      errorMessage: error instanceof Error ? error.message : 'Failed to validate URL'
    }
  }
}

/**
 * Format time for video player display
 */
export function formatVideoTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Get video generation progress percentage
 */
export function calculateProgress(stage: VideoGenerationStage, currentFrame: number, totalFrames: number): number {
  switch (stage) {
    case 'generating-frames':
      return (currentFrame / totalFrames) * 60 // 0-60%
    case 'composing-video':
      return 75 // 75%
    case 'uploading':
      return 90 // 90%
    case 'complete':
      return 100 // 100%
    default:
      return 0
  }
}
