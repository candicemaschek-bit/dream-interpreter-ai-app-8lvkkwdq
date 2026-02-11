/**
 * Authentication Helpers with Token-Based Verification
 * Provides utilities for managing authentication flows with secure token verification
 */

import { blink } from '../blink/client'
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  createMagicLinkToken,
  verifyEmailToken,
  verifyPasswordResetToken,
  verifyMagicLinkToken,
  cleanupExpiredTokens,
} from './tokenVerification'
import {
  sendVerificationEmail,
  sendPasswordResetEmail as sendPasswordResetEmailService,
  sendMagicLinkEmail as sendMagicLinkEmailService,
  sendWelcomeEmail,
} from './emailService'
import { checkAndGrantLaunchOffer } from './launchOfferManager'

// ============================================================================
// USER SYNC & LAUNCH OFFER
// ============================================================================

// Cache to avoid redundant DB checks within the same session
const userVerificationCache = new Set<string>()

/**
 * Ensure user record exists in database and check launch offer
 */
export async function ensureUserRecord(user: any): Promise<void> {
  if (!user?.id) return

  // OPTIMIZATION: Check cache first to avoid redundant database calls
  if (userVerificationCache.has(user.id)) {
    // Still update last sign in periodically (e.g., every 5 minutes)
    const lastCheck = sessionStorage.getItem(`last_sync_${user.id}`)
    const now = Date.now()
    if (lastCheck && now - parseInt(lastCheck) < 300000) {
      return
    }
  }

  try {
    // 1. Check if user exists in users table
    const users = await blink.db.users.list({
      where: { id: user.id },
      limit: 1
    })

    const now = new Date().toISOString()
    if (users.length === 0) {
      console.log('Creating missing user record for:', user.id)
      
      await blink.db.users.create({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified ? 1 : 0,
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatarUrl: user.user_metadata?.avatar_url || '',
        createdAt: now,
        updatedAt: now,
        lastSignIn: now
      })
    } else {
      // Update last sign in
      await blink.db.users.update(user.id, {
        lastSignIn: now
      })
    }

    // Update cache and timestamp
    userVerificationCache.add(user.id)
    sessionStorage.setItem(`last_sync_${user.id}`, Date.now().toString())

    // 2. Check and grant launch offer (idempotent)
    await checkAndGrantLaunchOffer(user.id)

  } catch (error) {
    console.warn('Error ensuring user record:', error)
    // Non-blocking error
  }
}

// ============================================================================
// USER REGISTRATION WITH EMAIL VERIFICATION
// ============================================================================

export interface RegistrationData {
  email: string
  password: string
  displayName?: string
}

/**
 * Register a new user and send email verification
 */
export async function registerUserWithVerification(
  data: RegistrationData
): Promise<{
  success: boolean
  userId?: string
  verificationUrl?: string
  error?: string
}> {
  try {
    // Create user account using Blink auth (only supported fields for current SDK types)
    const user = await blink.auth.signUp({
      email: data.email,
      password: data.password
    })

    // Set display name if provided (separate call to keep types compatible)
    if (data.displayName && user) {
      try {
        await blink.auth.updateMe({ displayName: data.displayName })
      } catch (err) {
        // Not fatal; ignore update errors
      }
    }

    if (!user) {
      return { success: false, error: 'Failed to create account' }
    }

    // Ensure user record exists in DB and grant launch offer
    await ensureUserRecord(user)

    // Generate email verification token
    const { verificationUrl } = await createEmailVerificationToken(user.id)

    // Send verification email
    await sendVerificationEmail(
      data.email,
      data.displayName || 'Dream Explorer',
      verificationUrl
    )

    return {
      success: true,
      userId: user.id,
      verificationUrl,
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: error.message || 'Registration failed',
    }
  }
}

// ============================================================================
// PASSWORD RESET FLOW
// ============================================================================

/**
 * Initiate password reset process
 */
export async function initiatePasswordReset(
  email: string
): Promise<{
  success: boolean
  resetUrl?: string
  error?: string
}> {
  try {
    // Find user by email
    const users = await blink.db.users.list({
      where: { email },
      limit: 1,
    })

    if (users.length === 0) {
      // Return success even if user doesn't exist (security best practice)
      return { success: true }
    }

    const user = users[0]

    // Generate password reset token
    const { resetUrl } = await createPasswordResetToken(user.id, email)

    // Send password reset email
    await sendPasswordResetEmailService(
      email,
      user.displayName || 'Dream Explorer',
      resetUrl
    )

    return {
      success: true,
      resetUrl,
    }
  } catch (error: any) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: error.message || 'Failed to initiate password reset',
    }
  }
}

/**
 * Complete password reset with token verification
 */
export async function completePasswordResetWithToken(
  token: string,
  newPassword: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Verify the token
    const verification = await verifyPasswordResetToken(token)

    if (!verification.valid || !verification.userId) {
      return {
        success: false,
        error: verification.error || 'Invalid reset token',
      }
    }

    // Update password using Blink auth
    await blink.auth.changePassword('', newPassword)

    return { success: true }
  } catch (error: any) {
    console.error('Password reset completion error:', error)
    return {
      success: false,
      error: error.message || 'Failed to reset password',
    }
  }
}

// ============================================================================
// MAGIC LINK AUTHENTICATION
// ============================================================================

/**
 * Send magic link for passwordless authentication
 */
export async function sendMagicLink(
  email: string,
  redirectUrl?: string
): Promise<{
  success: boolean
  magicLinkUrl?: string
  error?: string
}> {
  try {
    // Generate magic link token
    const { magicLinkUrl } = await createMagicLinkToken(email, redirectUrl)

    // Send magic link email
    await sendMagicLinkEmailService(email, magicLinkUrl)

    return {
      success: true,
      magicLinkUrl,
    }
  } catch (error: any) {
    console.error('Magic link error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send magic link',
    }
  }
}

/**
 * Authenticate user with magic link token
 */
export async function authenticateWithMagicLink(
  token: string
): Promise<{
  success: boolean
  email?: string
  redirectUrl?: string
  error?: string
}> {
  try {
    // Verify the magic link token
    const verification = await verifyMagicLinkToken(token)

    if (!verification.valid || !verification.email) {
      return {
        success: false,
        error: verification.error || 'Invalid magic link',
      }
    }

    // Ensure user record exists in DB and grant launch offer
    await ensureUserRecord(verification)

    // Sign in user with verified email
    // In managed mode, this would redirect to Blink auth
    // In headless mode, you'd use blink.auth.signInWithEmail()

    return {
      success: true,
      email: verification.email,
      redirectUrl: verification.redirectUrl,
    }
  } catch (error: any) {
    console.error('Magic link authentication error:', error)
    return {
      success: false,
      error: error.message || 'Authentication failed',
    }
  }
}

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

/**
 * Send email verification to user
 */
export async function sendEmailVerification(
  userId: string
): Promise<{
  success: boolean
  verificationUrl?: string
  error?: string
}> {
  try {
    // Generate verification token
    const { verificationUrl } = await createEmailVerificationToken(userId)

    // Get user email for sending
    const users = await blink.db.users.list({
      where: { id: userId },
      limit: 1,
    })

    if (users.length === 0) {
      return { success: false, error: 'User not found' }
    }

    const user = users[0]

    // Send verification email
    await sendVerificationEmail(
      user.email,
      user.displayName || 'Dream Explorer',
      verificationUrl
    )

    return {
      success: true,
      verificationUrl,
    }
  } catch (error: any) {
    console.error('Email verification error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send verification email',
    }
  }
}

/**
 * Verify user's email with token
 */
export async function verifyUserEmail(
  token: string
): Promise<{
  success: boolean
  userId?: string
  error?: string
}> {
  try {
    const verification = await verifyEmailToken(token)

    if (!verification.valid) {
      return {
        success: false,
        error: verification.error || 'Email verification failed',
      }
    }

    // Ensure user record exists in DB and grant launch offer
    if (verification.userId) {
      await ensureUserRecord(verification)
    }

    // Send welcome email after successful verification
    if (verification.userId) {
      const users = await blink.db.users.list({
        where: { id: verification.userId },
        limit: 1,
      })

      if (users.length > 0) {
        const user = users[0]
        await sendWelcomeEmail(user.email, user.displayName || 'Dream Explorer')
      }
    }

    return {
      success: true,
      userId: verification.userId,
    }
  } catch (error: any) {
    console.error('Email verification error:', error)
    return {
      success: false,
      error: error.message || 'Verification failed',
    }
  }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Check if user's email is verified
 */
import { toBoolean } from './databaseCast'

export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const users = await blink.db.users.list({
      where: { id: userId },
      limit: 1
    })

    if (users.length === 0) {
      return false
    }

    return toBoolean(users[0].emailVerified)
  } catch (error) {
    console.error('Error checking email verification:', error)
    return false
  }
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function performTokenCleanup(): Promise<{
  success: boolean
  cleaned?: {
    emailTokens: number
    resetTokens: number
    magicLinks: number
  }
  error?: string
}> {
  try {
    const cleaned = await cleanupExpiredTokens()

    return {
      success: true,
      cleaned,
    }
  } catch (error: any) {
    console.error('Token cleanup error:', error)
    return {
      success: false,
      error: error.message || 'Cleanup failed',
    }
  }
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Validate user session and check email verification requirement
 */
export async function validateUserSession(): Promise<{
  isAuthenticated: boolean
  isVerified: boolean
  userId?: string
  requiresVerification: boolean
}> {
  try {
    // Check if user is authenticated
    const user = await blink.auth.me()

    if (!user) {
      return {
        isAuthenticated: false,
        isVerified: false,
        requiresVerification: false,
      }
    }

    // Ensure user record exists in DB and grant launch offer
    await ensureUserRecord(user)

    // Check if email is verified
    const verified = await isEmailVerified(user.id)

    return {
      isAuthenticated: true,
      isVerified: verified,
      userId: user.id,
      requiresVerification: !verified,
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      isAuthenticated: false,
      isVerified: false,
      requiresVerification: false,
    }
  }
}