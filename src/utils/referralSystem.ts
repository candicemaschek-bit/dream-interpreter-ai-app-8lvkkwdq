import { blink } from '../blink/client'

// Edge Function URL for referral operations (bypasses RLS)
const REFERRAL_FUNCTION_URL = 'https://8lvkkwdq--referral-operations.functions.blink.new'

/**
 * Helper function to call the referral Edge Function
 */
async function callReferralFunction(
  operation: string,
  data: Record<string, any> = {}
): Promise<any> {
  try {
    // Get auth token if available
    let authHeader: string | undefined
    try {
      const token = await blink.auth.getValidToken()
      if (token) {
        authHeader = `Bearer ${token}`
      }
    } catch {
      // No auth token available - that's ok for some operations
    }

    const response = await fetch(REFERRAL_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ operation, ...data }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Referral operation '${operation}' failed:`, error)
    throw error
  }
}

/**
 * Generate a unique referral code for a user
 * Format: DREAM-XXXX (e.g., DREAM-A7K3)
 */
export async function generateReferralCode(userId: string): Promise<string> {
  try {
    const result = await callReferralFunction('generate')
    if (result.success && result.code) {
      return result.code
    }
    throw new Error(result.error || 'Failed to generate referral code')
  } catch (error) {
    console.error('Error generating referral code:', error)
    throw error
  }
}

/**
 * Get user's referral code (or generate if doesn't exist)
 */
export async function getUserReferralCode(userId: string): Promise<string> {
  try {
    const result = await callReferralFunction('getUserCode')
    if (result.success && result.code) {
      return result.code
    }
    throw new Error(result.error || 'Failed to get referral code')
  } catch (error) {
    console.error('Error getting referral code:', error)
    throw error
  }
}

/**
 * Validate and apply referral bonus when new user signs up
 */
export async function validateAndApplyReferral(
  referralCode: string,
  newUserId: string,
  newUserEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await callReferralFunction('validate', {
      referralCode,
      newUserId,
      newUserEmail,
    })
    
    return {
      success: result.success,
      message: result.message || 'Referral processed'
    }
  } catch (error) {
    console.error('Error validating referral:', error)
    return {
      success: false,
      message: 'Failed to process referral code'
    }
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<{
  totalReferrals: number
  successfulReferrals: number
  bonusDreams: number
}> {
  try {
    const result = await callReferralFunction('getStats')
    
    if (result.success) {
      return {
        totalReferrals: result.totalReferrals || 0,
        successfulReferrals: result.successfulReferrals || 0,
        bonusDreams: result.bonusDreams || 0
      }
    }
    
    return {
      totalReferrals: 0,
      successfulReferrals: 0,
      bonusDreams: 0
    }
  } catch (error) {
    console.error('Error getting referral stats:', error)
    return {
      totalReferrals: 0,
      successfulReferrals: 0,
      bonusDreams: 0
    }
  }
}
