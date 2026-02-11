/**
 * Privacy Screen Tracking Utility
 * 
 * Helps track if user has reviewed privacy settings during onboarding
 * and identify users who might need privacy setting reminders.
 */

import { blink } from '../blink/client'

export interface PrivacyTrackingStatus {
  hasReviewedOnboarding: boolean
  reviewedAt: string | null
  needsReminder: boolean
}

/**
 * Check if user has reviewed privacy settings during onboarding
 */
export async function checkPrivacyReviewStatus(userId: string): Promise<PrivacyTrackingStatus> {
  try {
    const settings = await blink.db.userPrivacySettings.list({
      where: { userId }
    })

    if (settings.length === 0) {
      return {
        hasReviewedOnboarding: false,
        reviewedAt: null,
        needsReminder: true
      }
    }

    const s = settings[0] as any
    const onboardingReviewedAt = s.onboardingPrivacyReviewedAt || s.onboarding_privacy_reviewed_at
    const createdAt = s.createdAt || s.created_at

    // User needs reminder if they haven't reviewed during onboarding
    // and it's been more than 7 days since account creation
    const daysSinceCreation = createdAt 
      ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      hasReviewedOnboarding: !!onboardingReviewedAt,
      reviewedAt: onboardingReviewedAt || null,
      needsReminder: !onboardingReviewedAt && daysSinceCreation > 7
    }
  } catch (error) {
    console.error('Error checking privacy review status:', error)
    return {
      hasReviewedOnboarding: false,
      reviewedAt: null,
      needsReminder: false
    }
  }
}

/**
 * Mark that user has reviewed privacy settings during onboarding
 */
export async function markPrivacyOnboardingReviewed(userId: string): Promise<boolean> {
  try {
    const now = new Date().toISOString()
    
    const existing = await blink.db.userPrivacySettings.list({
      where: { userId }
    })

    if (existing.length > 0) {
      await blink.db.userPrivacySettings.update(existing[0].id, {
        onboardingPrivacyReviewedAt: now,
        updatedAt: now
      })
    } else {
      // Create new settings record with review timestamp
      await blink.db.userPrivacySettings.create({
        id: `ups_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        patternTrackingConsent: '0',
        sensitiveContentFilter: '1',
        redactTrauma: '1',
        redactSexuality: '1',
        redactViolence: '0',
        redactFears: '0',
        allowCloudAnalysis: '1',
        consentVersion: '2.0',
        onboardingPrivacyReviewedAt: now,
        createdAt: now,
        updatedAt: now
      })
    }

    return true
  } catch (error) {
    console.error('Error marking privacy onboarding reviewed:', error)
    return false
  }
}

/**
 * Check if user should see privacy reminder notification
 */
export async function shouldShowPrivacyReminder(userId: string): Promise<boolean> {
  const status = await checkPrivacyReviewStatus(userId)
  return status.needsReminder
}

/**
 * Get list of users who haven't reviewed privacy settings
 * (Admin utility for batch reminders)
 */
export async function getUsersNeedingPrivacyReminder(limit: number = 100): Promise<string[]> {
  try {
    // Get all privacy settings
    const allSettings = await blink.db.userPrivacySettings.list({
      limit
    }) as any[]

    // Filter users who haven't reviewed privacy onboarding
    const usersNeedingReminder = allSettings
      .filter(s => {
        const onboardingReviewedAt = s.onboardingPrivacyReviewedAt || s.onboarding_privacy_reviewed_at
        return !onboardingReviewedAt
      })
      .map(s => s.userId || s.user_id)

    return usersNeedingReminder
  } catch (error) {
    console.error('Error getting users needing privacy reminder:', error)
    return []
  }
}

/**
 * Dismiss privacy reminder for a user (won't show again for this session)
 */
export function dismissPrivacyReminder(): void {
  sessionStorage.setItem('dreamcatcher_privacy_reminder_dismissed', 'true')
}

/**
 * Check if privacy reminder has been dismissed this session
 */
export function isPrivacyReminderDismissed(): boolean {
  return sessionStorage.getItem('dreamcatcher_privacy_reminder_dismissed') === 'true'
}
