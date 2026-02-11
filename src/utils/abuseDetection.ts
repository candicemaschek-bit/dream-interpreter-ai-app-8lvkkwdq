import { blink } from '../blink/client'

/**
 * Generate device fingerprint based on browser characteristics
 * Uses canvas fingerprinting and device properties
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas not supported')
    }
    
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('fingerprint', 2, 2)
    
    const fingerprint = {
      canvas: canvas.toDataURL(),
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      userAgent: navigator.userAgent.substring(0, 100) // Truncate for privacy
    }
    
    const fingerprintString = JSON.stringify(fingerprint)
    
    // Create hash using SubtleCrypto
    const encoder = new TextEncoder()
    const data = encoder.encode(fingerprintString)
    
    if (!crypto || !crypto.subtle) {
      console.warn('Crypto.subtle not available, using fallback hash')
      return `fallback_${Math.random().toString(36).substring(2, 15)}`
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
  } catch (error) {
    console.error('Error generating device fingerprint:', error)
    // Return a random fallback if fingerprinting fails
    return `fallback_${Math.random().toString(36).substring(2, 15)}`
  }
}

/**
 * Normalize email address to detect similar accounts
 * Handles Gmail dot-notation and plus-addressing
 */
export function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@')
  
  // Gmail treats dots as non-existent: test.user@gmail.com === testuser@gmail.com
  // Also ignores everything after + sign: testuser+tag@gmail.com === testuser@gmail.com
  if (domain === 'gmail.com') {
    const cleanLocal = local.replace(/\./g, '').split('+')[0]
    return `${cleanLocal}@${domain}`
  }
  
  // For other providers, just lowercase
  return email.toLowerCase()
}

/**
 * Check for abuse patterns across multiple signals
 * Returns abuse score (0-3) and recommendations
 */
export async function checkAbuseSignals(
  email: string,
  deviceFingerprint: string,
  signupIp?: string
): Promise<{
  abuseScore: number
  isAbuse: boolean
  signals: string[]
  recommendation: 'allow' | 'restrict' | 'block'
}> {
  const signals: string[] = []
  let abuseScore = 0
  
  try {
    const normalizedEmail = normalizeEmail(email)
    
    // Check 1: Email similarity (same normalized email)
    const emailMatches = await blink.db.userProfiles.list({
      where: { normalizedEmail }
    })
    
    if (emailMatches.length > 0) {
      abuseScore++
      signals.push('email_duplicate')
    }
    
    // Check 2: Device fingerprint (same device)
    const deviceMatches = await blink.db.userProfiles.list({
      where: { deviceFingerprint }
    })
    
    if (deviceMatches.length >= 2) {
      abuseScore++
      signals.push('device_duplicate')
    }
    
    // Check 3: IP address (if provided, same IP within 7 days)
    if (signupIp) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const allProfiles = await blink.db.userProfiles.list({})
      const ipMatches = allProfiles.filter((p: any) => {
        if (p.signupIp !== signupIp) return false
        const createdAt = new Date(p.createdAt)
        return createdAt >= sevenDaysAgo
      })
      
      if (ipMatches.length >= 3) {
        abuseScore++
        signals.push('ip_duplicate')
      }
    }
    
    // Determine recommendation based on score
    let recommendation: 'allow' | 'restrict' | 'block'
    let isAbuse = false
    
    if (abuseScore === 0) {
      recommendation = 'allow'
    } else if (abuseScore === 1) {
      recommendation = 'allow' // Single signal might be legitimate
    } else if (abuseScore === 2) {
      recommendation = 'restrict'
      isAbuse = true
    } else {
      recommendation = 'block'
      isAbuse = true
    }
    
    return {
      abuseScore,
      isAbuse,
      signals,
      recommendation
    }
  } catch (error) {
    console.error('Error checking abuse signals:', error)
    // On error, allow by default
    return {
      abuseScore: 0,
      isAbuse: false,
      signals: [],
      recommendation: 'allow'
    }
  }
}

/**
 * Apply abuse prevention measures to user profile
 */
export async function applyAbuseRestrictions(
  profileId: string,
  abuseScore: number
): Promise<void> {
  try {
    if (abuseScore >= 2) {
      // Restrict account: reduce free dreams to 1
      await blink.db.userProfiles.update(profileId, {
        accountStatus: 'restricted',
        dreamsAnalyzedLifetime: 0, // Reset to 0, they get 1 instead of 2
        updatedAt: new Date().toISOString()
      })
      
      console.log(`⚠️ Abuse restrictions applied to profile ${profileId}`)
    }
  } catch (error) {
    console.error('Error applying abuse restrictions:', error)
  }
}