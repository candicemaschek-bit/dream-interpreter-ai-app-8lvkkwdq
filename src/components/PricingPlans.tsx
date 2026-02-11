import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Check, Zap, Loader2 } from 'lucide-react'
import { SUBSCRIPTION_PLANS, ADD_ONS } from '../types/subscription'
import type { SubscriptionTier, AddOnType } from '../types/subscription'
import { EarlyAccessDialog } from './EarlyAccessDialog'
import { createCheckoutSession } from '../utils/stripeCheckout'
import toast from 'react-hot-toast'

interface PricingPlansProps {
  currentTier: SubscriptionTier
  onSelectPlan: (tier: SubscriptionTier) => void
  onPurchaseAddOn?: (addOnId: AddOnType) => void
  isLoading?: boolean
}

export function PricingPlans({ currentTier, onSelectPlan, onPurchaseAddOn, isLoading = false }: PricingPlansProps) {
  const plans = Object.entries(SUBSCRIPTION_PLANS)
  const addOns = Object.entries(ADD_ONS)
  const [showEarlyAccess, setShowEarlyAccess] = useState(false)
  const [selectedTier, setSelectedTier] = useState<{ tier: string; name: string } | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [processingCheckout, setProcessingCheckout] = useState(false)

  // Filter add-ons based on current tier eligibility
  const eligibleAddOns = addOns.filter(([_, addOn]) => 
    addOn.eligibleTiers.includes(currentTier)
  )

  const handlePlanClick = async (tier: string, planName: string) => {
    const plan = SUBSCRIPTION_PLANS[tier as SubscriptionTier]
    
    // Check if tier is coming soon
    if (plan.isComingSoon) {
      setSelectedTier({ tier, name: planName })
      setShowEarlyAccess(true)
      return
    }

    // Skip Stripe for free tier
    if (tier === 'free') {
      onSelectPlan(tier as SubscriptionTier)
      return
    }

    // Redirect to Stripe checkout for paid tiers
    setProcessingCheckout(true)
    try {
      await createCheckoutSession(
        tier as SubscriptionTier,
        billingCycle
      )
      toast.success('Redirecting to checkout...')
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
    } finally {
      setProcessingCheckout(false)
    }
  }

  return (
    <div className="space-y-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold mb-2">Choose Your Dream Path</h2>
        <p className="text-muted-foreground">Pick the perfect plan for your dream journey.</p>
        <p className="text-sm text-primary font-medium mt-2">💎 All paid plans include HD images, no watermarks & Deep Insights</p>
        
        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'annual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Annual <span className="text-xs">(Save 17%)</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(([tier, plan]) => (
          <Card
            key={tier}
            className={`relative transition-all flex flex-col ${
              currentTier === tier
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            {plan.isComingSoon && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500">
                Coming Soon
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{tier.charAt(0).toUpperCase() + tier.slice(1)}</CardDescription>
              
              <div className="mt-4">
                {plan.monthlyPrice === 0 && tier !== 'free' ? (
                  <div>
                    <span className="text-3xl font-bold text-primary">Price TBD</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Coming soon
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${(billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice).toFixed(2)}
                      </span>
                    </div>
                    {billingCycle === 'annual' && plan.annualPrice > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        💰 Save ${((plan.monthlyPrice * 12) - plan.annualPrice).toFixed(2)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex flex-col flex-grow">
              {/* CTA Button - Now for all tiers including free */}
              <Button
                onClick={() => handlePlanClick(tier, plan.name)}
                disabled={currentTier === tier || isLoading || processingCheckout}
                className={`w-full text-xs font-semibold border-0 text-white shadow-md hover:shadow-lg transition-all ${
                  plan.isComingSoon
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    : currentTier === tier
                      ? 'bg-muted text-muted-foreground'
                      : tier === 'free'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 hover:scale-[1.02]'
                        : tier === 'pro'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:scale-[1.02]'
                          : tier === 'premium'
                            ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 hover:scale-[1.02]'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:scale-[1.02]'
                }`}
                variant={plan.isComingSoon ? "outline" : "default"}
              >
                {processingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentTier === tier 
                  ? 'Current Plan' 
                  : plan.isComingSoon
                    ? 'Sign up for early access'
                    : `Choose ${plan.name}`}
              </Button>
              
              {/* Divider */}
              <div className="border-t" />

              {/* Features List */}
              <div className="space-y-3">
                {plan.features.map((feature, idx) => {
                  // Check if this is a subheading (PLUS:, Full Access to:, or NO CREDIT CARD REQUIRED)
                  const isSubheading = feature === 'PLUS:' || feature === 'Full Access to:' || feature === 'NO CREDIT CARD REQUIRED'
                  
                  if (isSubheading) {
                    return (
                      <div key={idx} className="font-semibold text-sm mt-4 pt-2">
                        {feature}
                      </div>
                    )
                  }
                  
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add-ons Section */}
      {eligibleAddOns.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold mb-2 flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-accent" />
              Power-Ups & Add-Ons
            </h2>
            <p className="text-muted-foreground">Enhance your dream journey with these exclusive features</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {eligibleAddOns.map(([id, addOn]) => (
              <Card
                key={id}
                className="relative hover:shadow-lg transition-all border-accent/20"
              >
                {addOn.isComingSoon && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500">
                    Coming Soon
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{addOn.name}</CardTitle>
                      <CardDescription className="mt-2">{addOn.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {addOn.isRecurring ? 'Monthly' : 'One-time'}
                    </Badge>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-accent">${addOn.price.toFixed(2)}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features List */}
                  <div className="space-y-2">
                    {addOn.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Eligibility note */}
                  {addOn.eligibleTiers.length > 0 && (
                    <div className="p-2 rounded bg-secondary/50 text-xs text-muted-foreground">
                      Available for:{' '}
                      {addOn.eligibleTiers.map((tier, idx) => (
                        <span key={tier}>
                          {idx > 0 && ', '}
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Purchase Button */}
                  <Button
                    onClick={() => onPurchaseAddOn?.(id as AddOnType)}
                    disabled={isLoading || !onPurchaseAddOn || addOn.isComingSoon}
                    className="w-full"
                    variant="outline"
                  >
                    {addOn.isComingSoon 
                      ? 'Coming Soon' 
                      : addOn.isRecurring 
                        ? 'Subscribe' 
                        : 'Purchase'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Early Access Dialog */}
      {selectedTier && (
        <EarlyAccessDialog
          open={showEarlyAccess}
          onOpenChange={setShowEarlyAccess}
          tier={selectedTier.tier}
          tierName={selectedTier.name}
        />
      )}
    </div>
  )
}
