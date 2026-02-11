/**
 * Video Branding Overlay Module
 * 
 * Provides utilities for applying professional branding overlays to video frames.
 * 
 * Features:
 * - Canvas-based text overlay with customizable positioning
 * - Animation support (fade-in, slide-in)
 * - Tier-specific branding configurations
 * - Validation and error handling
 * 
 * Usage:
 * - Use `applyBrandingOverlay()` to apply branding to canvas context
 * - Use `getBrandingPromptSuffix()` for AI frame generation instructions
 * - Use `getVideoBrandingForTier()` to get tier-specific config
 */

import type { VideoBrandingConfig } from './videoTierCapabilities'
import { getVideoBranding } from './videoTierCapabilities'
import type { SubscriptionTier } from '../config/tierCapabilities'

/**
 * Apply text overlay to a canvas context
 * 
 * @param ctx - Canvas 2D rendering context
 * @param branding - Branding configuration object
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param frameIndex - Current frame index (0-based)
 * @param totalFrames - Total number of frames
 */
export function applyBrandingOverlay(
  ctx: CanvasRenderingContext2D,
  branding: VideoBrandingConfig,
  canvasWidth: number,
  canvasHeight: number,
  frameIndex: number,
  totalFrames: number
): void {
  const { text, position, fontSize, color, backgroundColor, opacity, paddingX, paddingY, borderRadius, animationStyle, animationDuration } = branding as any

  // Early return if no text or fully transparent
  if (!text || opacity === 0) return

  // Save canvas state
  ctx.save()
  ctx.globalAlpha = opacity

  // Calculate animation progress
  let animationProgress = 1
  if (animationStyle && animationDuration) {
    const frameProgress = frameIndex / Math.max(1, totalFrames - 1)
    animationProgress = Math.min(1, (frameProgress * 1000) / animationDuration)
  }

  // Setup text rendering
  ctx.font = `bold ${fontSize}px ${branding.fontFamily}`
  ctx.fillStyle = color
  ctx.textBaseline = 'bottom'

  // Measure text dimensions
  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const textHeight = fontSize

  // Default position: bottom-right
  let x = canvasWidth - textWidth - (paddingX ?? 16)
  let y = canvasHeight - (paddingY ?? 12)

  // Calculate position based on config
  switch (position) {
    case 'bottom-left':
      x = paddingX ?? 16
      y = canvasHeight - (paddingY ?? 12)
      break
    case 'top-right':
      x = canvasWidth - textWidth - (paddingX ?? 16)
      y = (paddingY ?? 12) + textHeight
      break
    case 'top-left':
      x = paddingX ?? 16
      y = (paddingY ?? 12) + textHeight
      break
    case 'center':
      x = (canvasWidth - textWidth) / 2
      y = canvasHeight / 2
      break
    default:
      // bottom-right (already set)
      break
  }

  // Apply animation effects
  if (animationStyle === 'fade-in') {
    ctx.globalAlpha = (opacity ?? 1) * animationProgress
  } else if (animationStyle === 'slide-in') {
    const slideDistance = canvasWidth * 0.08
    x = x + slideDistance * (1 - animationProgress)
    ctx.globalAlpha = (opacity ?? 1) * animationProgress
  }

  // Draw background if specified
  if (backgroundColor) {
    const bgPadding = 8
    ctx.fillStyle = backgroundColor
    
    if (borderRadius) {
      // Draw rounded rectangle background
      const radius = borderRadius
      const bx = x - bgPadding
      const by = y - textHeight - bgPadding
      const bwidth = textWidth + bgPadding * 2
      const bheight = textHeight + bgPadding * 2
      
      ctx.beginPath()
      ctx.moveTo(bx + radius, by)
      ctx.lineTo(bx + bwidth - radius, by)
      ctx.quadraticCurveTo(bx + bwidth, by, bx + bwidth, by + radius)
      ctx.lineTo(bx + bwidth, by + bheight - radius)
      ctx.quadraticCurveTo(bx + bwidth, by + bheight, bx + bwidth - radius, by + bheight)
      ctx.lineTo(bx + radius, by + bheight)
      ctx.quadraticCurveTo(bx, by + bheight, bx, by + bheight - radius)
      ctx.lineTo(bx, by + radius)
      ctx.quadraticCurveTo(bx, by, bx + radius, by)
      ctx.closePath()
      ctx.fill()
    } else {
      // Draw simple rectangle background
      ctx.fillRect(x - bgPadding, y - textHeight - bgPadding, textWidth + bgPadding * 2, textHeight + bgPadding * 2)
    }
  }

  // Draw text
  ctx.fillStyle = color
  ctx.globalAlpha = (opacity ?? 1) * (animationStyle ? animationProgress : 1)
  ctx.fillText(text, x, y)

  // Restore canvas state
  ctx.restore()
}

/**
 * Create branding prompt suffix for AI frame generation
 * 
 * Instructs the AI to leave space for the branding overlay.
 * Append this to your AI image generation prompts.
 * 
 * @param branding - Branding configuration
 * @returns Prompt suffix string or empty string if no branding
 */
export function getBrandingPromptSuffix(branding: VideoBrandingConfig): string {
  if (!branding || !branding.text) return ''

  const positionMap: Record<string, string> = {
    'bottom-right': 'bottom right corner',
    'bottom-left': 'bottom left corner',
    'top-right': 'top right corner',
    'top-left': 'top left corner',
    center: 'center',
  }

  const pos = positionMap[branding.position] ?? 'bottom right corner'
  return `\n\nNote: Leave space in the ${pos} for a branding overlay (applied in post-production).`
}

/**
 * Get video branding configuration for a subscription tier
 * 
 * @param tier - User's subscription tier
 * @param videoType - Type of video being generated
 * @returns Branding configuration object
 */
export function getVideoBrandingForTier(tier: SubscriptionTier, videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' = 'dreamcatcher') {
  return getVideoBranding(tier, videoType)
}

/**
 * Validate branding configuration
 * 
 * @param config - Branding configuration to validate
 * @returns Validation result with errors if any
 */
export function validateBrandingConfig(config: VideoBrandingConfig) {
  const errors: string[] = []
  if (!config) {
    return { valid: false, errors: ['Config is required'] }
  }
  if (!config.text || config.text.trim() === '') errors.push('Branding text is required')
  if (config.fontSize < 8 || config.fontSize > 200) errors.push('Font size must be between 8 and 200')
  if (config.opacity < 0 || config.opacity > 1) errors.push('Opacity must be between 0 and 1')
  if ((config.paddingX ?? 0) < 0 || (config.paddingY ?? 0) < 0) errors.push('Padding must be positive')
  const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center']
  if (!validPositions.includes(config.position)) errors.push(`Position must be one of: ${validPositions.join(', ')}`)
  return { valid: errors.length === 0, errors }
}

/**
 * Create a custom branding configuration
 * 
 * @param text - Branding text to display
 * @param position - Position on canvas (default: bottom-right)
 * @param overrides - Optional overrides for default values
 * @returns Complete branding configuration
 */
export function createBrandingConfig(
  text: string,
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' = 'bottom-right',
  overrides?: Partial<VideoBrandingConfig>
): VideoBrandingConfig {
  const base: VideoBrandingConfig = {
    text,
    position,
    fontSize: 20,
    fontFamily: 'Inter, sans-serif',
    color: 'rgba(255,255,255,1)',
    opacity: 0.85,
    paddingX: 16,
    paddingY: 12,
    borderRadius: overrides?.borderRadius,
    animationStyle: overrides?.animationStyle,
    animationDuration: overrides?.animationDuration,
  } as VideoBrandingConfig
  return { ...base, ...overrides }
}

/**
 * Check if branding should be applied for a tier
 * 
 * @param tier - User's subscription tier
 * @returns true if branding should be applied
 */
export function shouldApplyBranding(tier: SubscriptionTier): boolean {
  // Apply branding for paid tiers (premium and vip)
  return tier === 'premium' || tier === 'vip'
}

/**
 * Get branding text for a video type
 * 
 * @param videoType - Type of video being generated
 * @returns Branding text string
 */
export function getBrandingText(videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip') {
  switch (videoType) {
    case 'dreamcatcher':
      return 'Dreamcatcher AI'
    case 'dreamworlds':
      return 'Dreamworlds'
    case 'dreamworlds-vip':
      return 'Dreamworlds VIP'
    default:
      return 'Dreamcatcher AI'
  }
}

/**
 * Branding payload for video generation
 */
export interface BrandingPayload {
  tier: SubscriptionTier
  videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip'
  totalFrames: number
  config: VideoBrandingConfig
}

/**
 * Create a complete branding payload for video generation
 * 
 * @param tier - User's subscription tier
 * @param videoType - Type of video being generated
 * @param totalFrames - Total number of frames
 * @returns Complete branding payload
 */
export function createBrandingPayload(tier: SubscriptionTier, videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip' = 'dreamcatcher', totalFrames = 3): BrandingPayload {
  const config = getVideoBranding(tier, videoType)
  return { tier, videoType, totalFrames, config }
}