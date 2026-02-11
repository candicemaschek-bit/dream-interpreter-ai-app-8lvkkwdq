import { blink } from '../blink/client'
import type { SubscriptionTier } from '../types/subscription'

// Stripe Price IDs mapping
export const STRIPE_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  pro: {
    monthly: 'price_1SdpEiPLU6hC21dkjOQUgZ90',
    annual: 'price_1SdpEkPLU6hC21dkUJ7zmfOu'
  },
  premium: {
    monthly: 'price_1SdpEnPLU6hC21dkC1SZfPcq',
    annual: 'price_1SdpEqPLU6hC21dkSAl8H5HN'
  },
  vip: {
    monthly: 'price_1SdpEtPLU6hC21dkdgANUFhT',
    annual: 'price_1SdpEwPLU6hC21dkmWqxOnqt'
  }
}

/**
 * Creates a Stripe checkout session and redirects to checkout
 * @param tier - The subscription tier (pro, premium, vip)
 * @param billingCycle - monthly or annual
 * @param successUrl - URL to redirect after successful payment
 * @param cancelUrl - URL to redirect if payment is cancelled
 */
export async function createCheckoutSession(
  tier: SubscriptionTier,
  billingCycle: 'monthly' | 'annual',
  successUrl?: string,
  cancelUrl?: string
) {
  try {
    // Get current user
    const user = await blink.auth.me()
    if (!user?.id || !user.email) {
      throw new Error('User must be logged in to subscribe')
    }

    // Get price ID
    const priceId = STRIPE_PRICE_IDS[tier]?.[billingCycle]
    if (!priceId) {
      throw new Error(`Invalid tier or billing cycle: ${tier} ${billingCycle}`)
    }

    // Build return URLs
    const baseUrl = window.location.origin

    // Create checkout session via edge function
    const response = await fetch('https://8lvkkwdq--create-checkout-session.functions.blink.new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await blink.auth.getValidToken()}`
      },
      body: JSON.stringify({
        priceId,
        userId: user.id,
        userEmail: user.email,
        tier,
        billingCycle,
        successUrl: successUrl || `${baseUrl}/dashboard?tab=subscription&success=true`,
        cancelUrl: cancelUrl || `${baseUrl}/dashboard?tab=subscription&cancelled=true`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create checkout session')
    }

    const { sessionUrl } = await response.json()

    // Try new tab first (avoids iframe restrictions), then fall back to same-tab navigation
    const opened = window.open(sessionUrl, '_blank', 'noopener,noreferrer')
    if (!opened) {
      window.location.assign(sessionUrl)
    }

    return { success: true, sessionUrl }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

/**
 * Creates a Stripe customer portal session for managing subscriptions
 * @param returnUrl - URL to return to after portal session
 */
export async function createPortalSession(returnUrl?: string) {
  try {
    const user = await blink.auth.me()
    if (!user?.id) {
      throw new Error('User must be logged in')
    }

    const baseUrl = window.location.origin
    const response = await fetch('https://8lvkkwdq--create-portal-session.functions.blink.new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await blink.auth.getValidToken()}`
      },
      body: JSON.stringify({
        userId: user.id,
        returnUrl: returnUrl || `${baseUrl}/dashboard?tab=subscription`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create portal session')
    }

    const { portalUrl } = await response.json()

    const opened = window.open(portalUrl, '_blank', 'noopener,noreferrer')
    if (!opened) {
      window.location.assign(portalUrl)
    }

    return { success: true, portalUrl }
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}
