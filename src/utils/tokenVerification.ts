/**
 * Token-Based Verification System
 * Provides secure token generation, hashing, and verification for:
 * - Email verification
 * - Password reset
 * - Magic link authentication
 */

import { blink } from '../blink/client'

// Token configuration
const TOKEN_CONFIG = {
  EMAIL_VERIFICATION: {
    LENGTH: 32,
    EXPIRY_HOURS: 24,
  },
  PASSWORD_RESET: {
    LENGTH: 32,
    EXPIRY_HOURS: 1,
  },
  MAGIC_LINK: {
    LENGTH: 48,
    EXPIRY_MINUTES: 15,
  },
}

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash a token using SHA-256 for secure storage
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  
  if (!crypto || !crypto.subtle) {
    console.error('Crypto.subtle not available for token hashing')
    throw new Error('Secure context required for token operations')
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a lookup hash for faster database queries (first 8 chars of hash)
 */
async function createLookupHash(token: string): Promise<string> {
  const fullHash = await hashToken(token)
  return fullHash.substring(0, 16)
}

/**
 * Generate expiry timestamp
 */
function generateExpiry(hours?: number, minutes?: number): string {
  const now = new Date()
  if (hours) {
    now.setHours(now.getHours() + hours)
  }
  if (minutes) {
    now.setMinutes(now.getMinutes() + minutes)
  }
  return now.toISOString()
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

// ============================================================================
// EMAIL VERIFICATION TOKENS
// ============================================================================

export interface EmailVerificationToken {
  id: string
  userId: string
  tokenHash: string
  lookupHash: string
  expiresAt: string
  createdAt: string
}

/**
 * Generate and store email verification token
 */
export async function createEmailVerificationToken(
  userId: string
): Promise<{ token: string; verificationUrl: string }> {
  const token = generateSecureToken(TOKEN_CONFIG.EMAIL_VERIFICATION.LENGTH)
  const tokenHash = await hashToken(token)
  const lookupHash = await createLookupHash(token)
  const expiresAt = generateExpiry(TOKEN_CONFIG.EMAIL_VERIFICATION.EXPIRY_HOURS)

  // Store in database
  await blink.db.emailVerificationTokens.create({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    tokenHash,
    lookupHash,
    expiresAt,
    createdAt: new Date().toISOString(),
  })

  // Generate verification URL
  const baseUrl = window.location.origin
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`

  return { token, verificationUrl }
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(token: string): Promise<{
  valid: boolean
  userId?: string
  error?: string
}> {
  try {
    const tokenHash = await hashToken(token)
    const lookupHash = await createLookupHash(token)

    // Find token in database
    const tokens = await blink.db.emailVerificationTokens.list({
      where: { lookupHash },
      limit: 10,
    })

    // Find exact match
    const tokenRecord = tokens.find((t: any) => t.tokenHash === tokenHash)

    if (!tokenRecord) {
      return { valid: false, error: 'Invalid verification token' }
    }

    // Check expiry
    if (isTokenExpired(tokenRecord.expiresAt)) {
      // Clean up expired token
      await blink.db.emailVerificationTokens.delete(tokenRecord.id)
      return { valid: false, error: 'Verification token has expired' }
    }

    // Mark email as verified
    const users = await blink.db.users.list({
      where: { id: tokenRecord.userId },
      limit: 1,
    })

    if (users.length > 0) {
      await blink.db.users.update(tokenRecord.userId, {
        emailVerified: 1,
        updatedAt: new Date().toISOString(),
      })
    }

    // Delete used token
    await blink.db.emailVerificationTokens.delete(tokenRecord.id)

    return { valid: true, userId: tokenRecord.userId }
  } catch (error) {
    console.error('Email verification error:', error)
    return { valid: false, error: 'Verification failed' }
  }
}

// ============================================================================
// PASSWORD RESET TOKENS
// ============================================================================

export interface PasswordResetToken {
  id: string
  userId: string
  tokenHash: string
  lookupHash: string
  expiresAt: string
  createdAt: string
}

/**
 * Generate and store password reset token
 */
export async function createPasswordResetToken(
  userId: string,
  email: string
): Promise<{ token: string; resetUrl: string }> {
  const token = generateSecureToken(TOKEN_CONFIG.PASSWORD_RESET.LENGTH)
  const tokenHash = await hashToken(token)
  const lookupHash = await createLookupHash(token)
  const expiresAt = generateExpiry(TOKEN_CONFIG.PASSWORD_RESET.EXPIRY_HOURS)

  // Delete any existing reset tokens for this user
  const existingTokens = await blink.db.passwordResetTokens.list({
    where: { userId },
  })
  for (const existingToken of existingTokens) {
    await blink.db.passwordResetTokens.delete(existingToken.id)
  }

  // Store new token
  await blink.db.passwordResetTokens.create({
    id: `prt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    tokenHash,
    lookupHash,
    expiresAt,
    createdAt: new Date().toISOString(),
  })

  // Generate reset URL
  const baseUrl = window.location.origin
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  return { token, resetUrl }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{
  valid: boolean
  userId?: string
  error?: string
}> {
  try {
    const tokenHash = await hashToken(token)
    const lookupHash = await createLookupHash(token)

    // Find token in database
    const tokens = await blink.db.passwordResetTokens.list({
      where: { lookupHash },
      limit: 10,
    })

    // Find exact match
    const tokenRecord = tokens.find((t: any) => t.tokenHash === tokenHash)

    if (!tokenRecord) {
      return { valid: false, error: 'Invalid reset token' }
    }

    // Check expiry
    if (isTokenExpired(tokenRecord.expiresAt)) {
      await blink.db.passwordResetTokens.delete(tokenRecord.id)
      return { valid: false, error: 'Reset token has expired' }
    }

    return { valid: true, userId: tokenRecord.userId }
  } catch (error) {
    console.error('Password reset verification error:', error)
    return { valid: false, error: 'Verification failed' }
  }
}

/**
 * Complete password reset (delete token after successful reset)
 */
export async function completePasswordReset(token: string): Promise<void> {
  try {
    const tokenHash = await hashToken(token)
    const lookupHash = await createLookupHash(token)

    const tokens = await blink.db.passwordResetTokens.list({
      where: { lookupHash },
    })

    const tokenRecord = tokens.find((t: any) => t.tokenHash === tokenHash)
    if (tokenRecord) {
      await blink.db.passwordResetTokens.delete(tokenRecord.id)
    }
  } catch (error) {
    console.error('Error completing password reset:', error)
  }
}

// ============================================================================
// MAGIC LINK TOKENS
// ============================================================================

export interface MagicLinkToken {
  id: string
  email: string
  tokenHash: string
  lookupHash: string
  redirectUrl?: string
  expiresAt: string
  createdAt: string
}

/**
 * Generate and store magic link token
 */
export async function createMagicLinkToken(
  email: string,
  redirectUrl?: string
): Promise<{ token: string; magicLinkUrl: string }> {
  const token = generateSecureToken(TOKEN_CONFIG.MAGIC_LINK.LENGTH)
  const tokenHash = await hashToken(token)
  const lookupHash = await createLookupHash(token)
  const expiresAt = generateExpiry(undefined, TOKEN_CONFIG.MAGIC_LINK.EXPIRY_MINUTES)

  // Delete any existing magic links for this email
  const existingTokens = await blink.db.magicLinkTokens.list({
    where: { email },
  })
  for (const existingToken of existingTokens) {
    await blink.db.magicLinkTokens.delete(existingToken.id)
  }

  // Store new token with default redirect to dashboard
  await blink.db.magicLinkTokens.create({
    id: `mlt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    tokenHash,
    lookupHash,
    redirectUrl: redirectUrl || '/dashboard',
    expiresAt,
    createdAt: new Date().toISOString(),
  })

  // Generate magic link URL
  const baseUrl = window.location.origin
  const magicLinkUrl = `${baseUrl}/auth/magic-link?token=${token}`

  return { token, magicLinkUrl }
}

/**
 * Verify magic link token
 */
export async function verifyMagicLinkToken(token: string): Promise<{
  valid: boolean
  email?: string
  redirectUrl?: string
  error?: string
}> {
  try {
    const tokenHash = await hashToken(token)
    const lookupHash = await createLookupHash(token)

    // Find token in database
    const tokens = await blink.db.magicLinkTokens.list({
      where: { lookupHash },
      limit: 10,
    })

    // Find exact match
    const tokenRecord = tokens.find((t: any) => t.tokenHash === tokenHash)

    if (!tokenRecord) {
      return { valid: false, error: 'Invalid magic link' }
    }

    // Check expiry
    if (isTokenExpired(tokenRecord.expiresAt)) {
      await blink.db.magicLinkTokens.delete(tokenRecord.id)
      return { valid: false, error: 'Magic link has expired' }
    }

    // Delete used token (one-time use)
    await blink.db.magicLinkTokens.delete(tokenRecord.id)

    return {
      valid: true,
      email: tokenRecord.email,
      redirectUrl: tokenRecord.redirectUrl,
    }
  } catch (error) {
    console.error('Magic link verification error:', error)
    return { valid: false, error: 'Verification failed' }
  }
}

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<{
  emailTokens: number
  resetTokens: number
  magicLinks: number
}> {
  let emailTokens = 0
  let resetTokens = 0
  let magicLinks = 0

  try {
    const now = new Date().toISOString()

    // Clean email verification tokens
    const expiredEmailTokens = await blink.db.emailVerificationTokens.list()
    for (const token of expiredEmailTokens) {
      if (isTokenExpired(token.expiresAt)) {
        await blink.db.emailVerificationTokens.delete(token.id)
        emailTokens++
      }
    }

    // Clean password reset tokens
    const expiredResetTokens = await blink.db.passwordResetTokens.list()
    for (const token of expiredResetTokens) {
      if (isTokenExpired(token.expiresAt)) {
        await blink.db.passwordResetTokens.delete(token.id)
        resetTokens++
      }
    }

    // Clean magic link tokens
    const expiredMagicLinks = await blink.db.magicLinkTokens.list()
    for (const token of expiredMagicLinks) {
      if (isTokenExpired(token.expiresAt)) {
        await blink.db.magicLinkTokens.delete(token.id)
        magicLinks++
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error)
  }

  return { emailTokens, resetTokens, magicLinks }
}
