/**
 * React Hook for Token-Based Verification
 * Provides easy-to-use interface for token verification in components
 */

import { useState, useEffect, useCallback } from 'react'
import {
  validateUserSession,
  sendEmailVerification,
  initiatePasswordReset,
  sendMagicLink,
  performTokenCleanup,
} from '../utils/authHelpers'

interface SessionStatus {
  isAuthenticated: boolean
  isVerified: boolean
  userId?: string
  requiresVerification: boolean
  isLoading: boolean
}

/**
 * Hook to check and manage user session verification status
 */
export function useSessionVerification() {
  const [status, setStatus] = useState<SessionStatus>({
    isAuthenticated: false,
    isVerified: false,
    requiresVerification: false,
    isLoading: true,
  })

  const checkSession = useCallback(async () => {
    try {
      setStatus((prev) => ({ ...prev, isLoading: true }))
      const result = await validateUserSession()
      setStatus({
        ...result,
        isLoading: false,
      })
    } catch (error) {
      console.error('Session check error:', error)
      setStatus({
        isAuthenticated: false,
        isVerified: false,
        requiresVerification: false,
        isLoading: false,
      })
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  return {
    ...status,
    refreshSession: checkSession,
  }
}

/**
 * Hook for sending email verification
 */
export function useEmailVerification() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendVerification = useCallback(async (userId: string) => {
    setSending(true)
    setError(null)

    try {
      const result = await sendEmailVerification(userId)

      if (result.success) {
        setSent(true)
        return { success: true, verificationUrl: result.verificationUrl }
      } else {
        setError(result.error || 'Failed to send verification')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send verification'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setSending(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSent(false)
    setError(null)
  }, [])

  return {
    sending,
    sent,
    error,
    sendVerification,
    reset,
  }
}

/**
 * Hook for password reset flow
 */
export function usePasswordReset() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestReset = useCallback(async (email: string) => {
    setSending(true)
    setError(null)

    try {
      const result = await initiatePasswordReset(email)

      if (result.success) {
        setSent(true)
        return { success: true, resetUrl: result.resetUrl }
      } else {
        setError(result.error || 'Failed to send reset link')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send reset link'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setSending(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSent(false)
    setError(null)
  }, [])

  return {
    sending,
    sent,
    error,
    requestReset,
    reset,
  }
}

/**
 * Hook for magic link authentication
 */
export function useMagicLink() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendLink = useCallback(async (email: string, redirectUrl?: string) => {
    setSending(true)
    setError(null)

    try {
      const result = await sendMagicLink(email, redirectUrl)

      if (result.success) {
        setSent(true)
        return { success: true, magicLinkUrl: result.magicLinkUrl }
      } else {
        setError(result.error || 'Failed to send magic link')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send magic link'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setSending(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSent(false)
    setError(null)
  }, [])

  return {
    sending,
    sent,
    error,
    sendLink,
    reset,
  }
}

/**
 * Hook for automatic token cleanup
 */
export function useTokenCleanup(intervalMinutes: number = 60) {
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null)
  const [cleanupStats, setCleanupStats] = useState<{
    emailTokens: number
    resetTokens: number
    magicLinks: number
  } | null>(null)

  const runCleanup = useCallback(async () => {
    try {
      const result = await performTokenCleanup()

      if (result.success && result.cleaned) {
        setCleanupStats(result.cleaned)
        setLastCleanup(new Date())
        console.log('Token cleanup completed:', result.cleaned)
      }
    } catch (error) {
      console.error('Token cleanup error:', error)
    }
  }, [])

  useEffect(() => {
    // Run cleanup immediately
    runCleanup()

    // Set up interval for periodic cleanup
    const intervalMs = intervalMinutes * 60 * 1000
    const interval = setInterval(runCleanup, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMinutes, runCleanup])

  return {
    lastCleanup,
    cleanupStats,
    runCleanup,
  }
}
