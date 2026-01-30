import Stripe from 'npm:stripe@17.5.0'
import { createClient } from "npm:@blinkdotnew/sdk@^2.1.1";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18.acacia'
})

const blink = createClient({
  projectId: Deno.env.get('BLINK_PROJECT_ID') || '',
  authRequired: false
})

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature'
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'No signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    // Construct and verify event
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    )

    console.log(`Webhook received: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId
        const tier = session.metadata?.tier as string
        const billingCycle = session.metadata?.billingCycle as string
        const amount = (session.amount_total || 0) / 100

        if (userId && tier) {
          // Update user subscription in database
          await blink.db.subscriptions.create({
            userId,
            tier,
            billingCycle: billingCycle || 'monthly',
            startDate: new Date().toISOString(),
            autoRenew: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })

          // Record transaction
          await blink.db.paymentTransactions.create({
            userId,
            type: 'subscription',
            relatedId: session.subscription as string,
            amountUsd: amount,
            currency: session.currency?.toUpperCase() || 'USD',
            status: 'completed',
            paymentMethod: session.payment_method_types?.[0] || 'card',
            provider: 'stripe',
            externalTransactionId: session.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })

          // Update user profile tier
          const profiles = await blink.db.userProfiles.list({
            where: { userId },
            limit: 1
          })

          if (profiles.length > 0) {
            await blink.db.userProfiles.update(profiles[0].id, {
              subscriptionTier: tier,
              updatedAt: new Date().toISOString()
            })
          }

          console.log(`Subscription created for user ${userId}: ${tier}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          // Update subscription status
          const subscriptions = await (blink.db as any).subscriptions.list({
            where: { userId },
            limit: 1,
            orderBy: { createdAt: 'desc' }
          })

          if (subscriptions.length > 0) {
            await (blink.db as any).subscriptions.update(subscriptions[0].id, {
              isActive: subscription.status === 'active',
              updatedAt: new Date().toISOString()
            })
          }

          console.log(`Subscription updated for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          // Deactivate subscription
          const subscriptions = await (blink.db as any).subscriptions.list({
            where: { userId },
            limit: 1,
            orderBy: { createdAt: 'desc' }
          })

          if (subscriptions.length > 0) {
            await (blink.db as any).subscriptions.update(subscriptions[0].id, {
              isActive: false,
              endDate: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }

          // Downgrade user to free tier
          const profiles = await blink.db.userProfiles.list({
            where: { userId },
            limit: 1
          })

          if (profiles.length > 0) {
            await blink.db.userProfiles.update(profiles[0].id, {
              subscriptionTier: 'free',
              updatedAt: new Date().toISOString()
            })
          }

          console.log(`Subscription cancelled for user ${userId}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        const amount = (invoice.amount_paid || 0) / 100
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId
          
          if (userId) {
            // Update subscription
            const subs = await blink.db.subscriptions.list({
              where: { userId },
              limit: 1,
              orderBy: { createdAt: 'desc' }
            })
            
            if (subs.length > 0) {
              await blink.db.subscriptions.update(subs[0].id, {
                isActive: true,
                updatedAt: new Date().toISOString()
              })
            }

            // Record transaction
            await blink.db.paymentTransactions.create({
              userId,
              type: 'subscription_renewal',
              relatedId: subscriptionId,
              amountUsd: amount,
              currency: invoice.currency?.toUpperCase() || 'USD',
              status: 'completed',
              paymentMethod: 'card',
              provider: 'stripe',
              externalTransactionId: invoice.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
        }
        console.log(`Payment succeeded for invoice ${invoice.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment failed for invoice ${invoice.id}`)
        // TODO: Send notification to user
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook processing failed' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})