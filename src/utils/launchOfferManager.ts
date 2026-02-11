/**
 * Launch Offer Manager
 *
 * Purpose:
 * - Grant special access to the first 500 sign-ups
 * - Launch offer users (even on free tier) get:
 *   - Dream image generation with watermark (free watermarked images)
 *
 * NOTE: Transcription is NOT part of the launch offer.
 * Transcription access is determined by subscription tier only (see tierCapabilities.ts).
 *
 * REFACTOR NOTES:
 * - Switched from blink.db.sql (server-side only) to blink.db CRUD methods (client-compatible)
 * - Removed dependency on global_settings writes (client cannot write to global settings)
 * - Uses count() on launch_offer_users table to enforce limit
 */

import { blink } from '../blink/client'

const DEFAULT_LAUNCH_OFFER_LIMIT = 500

export interface LaunchOfferStatus {
  hasLaunchOffer: boolean
  signupNumber?: number
  dreamsUsed: number
  imagesGenerated: number
  isEligible: boolean
  message: string
}

/**
 * Check and grant launch offer during onboarding.
 * Called after user_profiles record is created.
 */
export async function checkAndGrantLaunchOffer(userId: string): Promise<{
  granted: boolean
  signupNumber?: number
  message: string
}> {
  try {
    // REFACTOR: Use Edge Function to verify eligibility and grant offer
    // This ensures we can securely count ALL users to enforce the limit (bypassing RLS)
    
    const token = await blink.auth.getValidToken()
    if (!token) {
      console.warn('No auth token available for launch offer check')
      return { 
        granted: false, 
        message: 'Authentication required to verify launch offer.' 
      }
    }

    // URL from deployment
    const functionUrl = 'https://8lvkkwdq--grant-launch-offer.functions.blink.new'
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // Try to parse error message
      let errorMsg = response.statusText
      try {
        const errorData = await response.json()
        errorMsg = errorData.error || errorMsg
      } catch (e) {}
      
      console.warn('Edge function returned error:', response.status, errorMsg)
      
      // Fallback: If edge function fails (e.g. 500), deny safely
      return {
        granted: false,
        message: 'Unable to verify launch offer status (service unavailable).'
      }
    }

    const result = await response.json()
    
    return {
      granted: result.granted,
      signupNumber: result.signupNumber,
      message: result.message || (result.granted ? 'Launch offer granted.' : 'Launch offer not available.')
    }

  } catch (error) {
    console.warn('Error granting launch offer (non-blocking):', error)
    return {
      granted: false,
      message: 'Unable to verify launch offer status.'
    }
  }
}

/**
 * Check if user has active launch offer.
 */
export async function getLaunchOfferStatus(userId: string): Promise<LaunchOfferStatus> {
  try {
    const result = await blink.db.launchOfferUsers.list({
      where: { userId },
      limit: 1
    })

    if (!result.length) {
      return {
        hasLaunchOffer: false,
        dreamsUsed: 0,
        imagesGenerated: 0,
        isEligible: false,
        message: 'No active launch offer'
      }
    }

    const offer = result[0] as any
    // Handle both number (SQLite) and boolean (if casted)
    const offerActivated = Number(offer.offerActivated) === 1 || offer.offerActivated === true
    const signupNumber = Number(offer.signupNumber) || undefined

    const isEligible = offerActivated && !!signupNumber && signupNumber <= DEFAULT_LAUNCH_OFFER_LIMIT

    return {
      hasLaunchOffer: isEligible,
      signupNumber,
      dreamsUsed: 0,
      imagesGenerated: Number(offer.imagesGenerated) || 0,
      isEligible,
      message: isEligible
        ? `Launch offer active (signup #${signupNumber}/${DEFAULT_LAUNCH_OFFER_LIMIT}). You get free watermarked dream images!`
        : 'Launch offer not eligible.'
    }
  } catch (error) {
    console.warn('Error checking launch offer status (non-blocking):', error)
    return {
      hasLaunchOffer: false,
      dreamsUsed: 0,
      imagesGenerated: 0,
      isEligible: false,
      message: 'Unable to check launch offer status'
    }
  }
}

/**
 * Track image generation usage for launch offer users.
 */
export async function trackLaunchOfferImageGeneration(userId: string): Promise<void> {
  try {
    const res = await blink.db.launchOfferUsers.list({
      where: { userId },
      limit: 1
    })

    const row = res[0] as any
    if (!row?.id) return

    const newCount = (Number(row.imagesGenerated) || 0) + 1
    
    await blink.db.launchOfferUsers.update(row.id, {
      imagesGenerated: newCount,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.warn('Error tracking launch offer image generation (non-blocking):', error)
  }
}

/**
 * Decide whether images should be watermarked for this user.
 * For launch offer users, we always watermark generated images.
 */
export function shouldApplyWatermarkForLaunchOffer(hasLaunchOffer: boolean): boolean {
  return hasLaunchOffer
}

/**
 * Watermark config (used for launch offer images).
 */
export function getLaunchOfferWatermarkConfig() {
  return {
    text: 'Dreamworlds',
    position: 'bottom-right' as const,
    opacity: 0.4,
    fontSize: 24,
    fontColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
  }
}

/**
 * Get launch offer summary for display in UI.
 */
export async function getLaunchOfferSummary(userId: string): Promise<{
  isLaunchOfferUser: boolean
  signupNumber?: number
  dreamsRemaining: number
  watermarkInfo: string
}> {
  try {
    const status = await getLaunchOfferStatus(userId)
    
    return {
      isLaunchOfferUser: status.hasLaunchOffer,
      signupNumber: status.signupNumber,
      dreamsRemaining: 0,
      watermarkInfo: status.hasLaunchOffer
        ? `Launch offer active (signup #${status.signupNumber}/${DEFAULT_LAUNCH_OFFER_LIMIT}). You get free watermarked dream images!`
        : 'Not a launch offer user'
    }
  } catch (error) {
    console.warn('Error getting launch offer summary (non-blocking):', error)
    return {
      isLaunchOfferUser: false,
      dreamsRemaining: 0,
      watermarkInfo: 'Unable to determine launch offer status'
    }
  }
}
