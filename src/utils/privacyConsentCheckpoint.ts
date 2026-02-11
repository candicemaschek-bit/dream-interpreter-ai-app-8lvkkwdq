/**
 * Privacy Consent Checkpoint
 * 
 * Checks if user has configured privacy settings and prompts for consent
 * if needed before dream interpretation displays.
 */

import { blink } from '../blink/client'

export interface PrivacyCheckResult {
  needsConsent: boolean
  hasSettings: boolean
  currentSettings: {
    patternTrackingConsent: boolean
    redactTrauma: boolean
    redactSexuality: boolean
    redactViolence: boolean
    redactFears: boolean
  } | null
}

/**
 * Check if user needs to confirm privacy settings before dream analysis
 * Returns true if privacy settings don't exist yet (soft gate on first dream)
 */
export async function checkPrivacyConsentNeeded(userId: string): Promise<PrivacyCheckResult> {
  try {
    const existing = await blink.db.userPrivacySettings.list({
      where: { userId }
    })

    if (!existing || existing.length === 0) {
      // No privacy settings found - user needs to configure
      return {
        needsConsent: true,
        hasSettings: false,
        currentSettings: null
      }
    }

    const settings = existing[0]
    const hasPatternTracking = settings.patternTrackingConsent === '1' || settings.patternTrackingConsent === 1

    // If they haven't consented to pattern tracking yet, show modal
    if (!hasPatternTracking) {
      return {
        needsConsent: true,
        hasSettings: true,
        currentSettings: {
          patternTrackingConsent: false,
          redactTrauma: settings.redactTrauma === '1' || settings.redactTrauma === 1,
          redactSexuality: settings.redactSexuality === '1' || settings.redactSexuality === 1,
          redactViolence: settings.redactViolence === '1' || settings.redactViolence === 1,
          redactFears: settings.redactFears === '1' || settings.redactFears === 1
        }
      }
    }

    // User has already consented and configured settings
    return {
      needsConsent: false,
      hasSettings: true,
      currentSettings: {
        patternTrackingConsent: true,
        redactTrauma: settings.redactTrauma === '1' || settings.redactTrauma === 1,
        redactSexuality: settings.redactSexuality === '1' || settings.redactSexuality === 1,
        redactViolence: settings.redactViolence === '1' || settings.redactViolence === 1,
        redactFears: settings.redactFears === '1' || settings.redactFears === 1
      }
    }
  } catch (error) {
    console.error('Error checking privacy consent:', error)
    // If error, assume no consent needed to not block user
    return {
      needsConsent: false,
      hasSettings: false,
      currentSettings: null
    }
  }
}

/**
 * Save privacy consent with pattern tracking enabled
 */
export async function savePrivacyConsent(
  userId: string,
  redactTrauma: boolean,
  redactSexuality: boolean,
  redactViolence: boolean,
  redactFears: boolean
): Promise<void> {
  try {
    const existing = await blink.db.userPrivacySettings.list({
      where: { userId }
    })

    const now = new Date().toISOString()
    const privacyData = {
      userId,
      patternTrackingConsent: '1',
      patternTrackingConsentDate: now,
      sensitiveContentFilter: '1',
      redactTrauma: redactTrauma ? '1' : '0',
      redactSexuality: redactSexuality ? '1' : '0',
      redactViolence: redactViolence ? '1' : '0',
      redactFears: redactFears ? '1' : '0',
      allowCloudAnalysis: '1',
      consentVersion: '2.0',
      updatedAt: now
    }

    if (existing && existing.length > 0) {
      await blink.db.userPrivacySettings.update(existing[0].id, privacyData)
    } else {
      await blink.db.userPrivacySettings.create({
        id: `ups_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...privacyData,
        createdAt: now
      })
    }
  } catch (error) {
    console.error('Error saving privacy consent:', error)
    throw error
  }
}
