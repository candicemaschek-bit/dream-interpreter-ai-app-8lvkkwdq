import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { SUBSCRIPTION_PLANS, ADD_ONS } from '../types/subscription'
import type { SubscriptionTier } from '../types/subscription'
import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'
import { SEOHead } from '../components/SEOHead'

export function PricingPage() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const plans = Object.entries(SUBSCRIPTION_PLANS)
  const addOns = Object.entries(ADD_ONS)

  const handleSignUpWithPlan = (tier: SubscriptionTier) => {
    const plan = SUBSCRIPTION_PLANS[tier]

    // Check if tier is coming soon
    if (plan.isComingSoon) {
      navigate(`/early-access?tier=${tier}&returnTo=/pricing`)
      return
    }

    // Route alias: /auth/signup (also available as /signup)
    navigate(`/auth/signup?tier=${tier}&mode=signup`)
  }

  return (
    <>
      <SEOHead page="pricing" />
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Subtle global gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 pointer-events-none fixed z-0"></div>
        <div className="relative z-10">
        <PageHeader logoSrc="/dreamworlds-logo.png" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-sans font-bold mb-4">Choose Your Dream Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore your dreams with AI-assisted interpretations. Pick the perfect plan for your dream journey.
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6 p-1 bg-secondary/50 rounded-xl w-fit mx-auto border border-border/50">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Annual <span className={`text-xs ml-1 ${billingCycle === 'annual' ? 'text-white/90' : 'text-amber-500 font-bold'}`}>(Save 17%)</span>
            </button>
          </div>
          
          <div className="mt-4 space-y-1">
            <p className="text-sm text-primary font-medium"> All paid plans include HD images, no watermarks & Deep Insights</p>
            <p className="text-sm text-accent font-medium"> VIP includes exclusive AI models & cinematic DreamWorlds videos</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map(([tier, plan]) => {
            const isPopular = tier === 'premium' || tier === 'vip'
            const displayPrice = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
            const priceDisplay = plan.monthlyPrice === 0 && tier !== 'free' 
              ? 'Price TBD'
              : displayPrice.toFixed(2)
            
            return (
              <Card
                key={tier}
                className={`relative transition-all hover:shadow-lg flex flex-col min-h-full border-2 ${
                  isPopular ? 'ring-2 ring-accent shadow-lg border-accent' : 'border-primary/40'
                }`}
              >
                {isPopular && !plan.isComingSoon && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent">
                    Most Popular
                  </Badge>
                )}
                
                {plan.isComingSoon && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500">
                    Coming Soon
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{tier.charAt(0).toUpperCase() + tier.slice(1)}</CardDescription>

                  {/* Price Section */}
                  <div className="mt-6 pb-4 border-b">
                    {plan.monthlyPrice === 0 && tier !== 'free' ? (
                      <div>
                        <span className="text-3xl font-bold text-primary">Price TBD</span>
                        <p className="text-sm text-muted-foreground mt-1">Coming soon</p>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${priceDisplay}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button - Aligned for all tiers */}
                  <Button
                    onClick={() => handleSignUpWithPlan(tier as SubscriptionTier)}
                    className={`w-full mt-4 border-0 text-white shadow-md hover:shadow-lg transition-all ${
                      plan.isComingSoon 
                        ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
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
                    {plan.isComingSoon 
                      ? 'Sign up for Early Access'
                      : tier === 'free'
                      ? 'Get Started Free'
                      : `Choose ${plan.name}`}
                    {!plan.isComingSoon && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">

                  {/* Features List */}
                  <div className="space-y-3 flex-1">
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
            )
          })}
        </div>

        {/* Add-ons Section */}
        <div className="space-y-6 mb-12">
          <div className="text-center">
            <h3 className="text-2xl font-sans font-bold mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" />
              Power-Ups & Add-Ons
            </h3>
            <p className="text-muted-foreground">Enhance your dream journey with these exclusive features</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {addOns.map(([id, addOn]) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 bg-card/50 rounded-lg p-8 border">
          <h3 className="text-2xl font-sans font-bold">Frequently Asked Questions</h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-2">Can I change plans later?</h4>
              <p className="text-sm text-muted-foreground">
                Absolutely! You can upgrade or downgrade your plan anytime from your Settings dashboard. Changes take effect immediately.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) and more payment options coming soon.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! Our free Dreamer plan includes 2 lifetime dream analyses so you can test the service risk-free.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Can I get a refund?</h4>
              <p className="text-sm text-muted-foreground">
                We offer a 7-day money-back guarantee for annual subscriptions. Monthly subscriptions include satisfaction guarantee.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Do my dream analyses renew monthly?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! Your monthly allowance resets on the same day each month. Unused analyses don't carry over.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">What about DreamWorlds and videos?</h4>
              <p className="text-sm text-muted-foreground">
                VIP includes 1 free DreamWorlds video per month. All tiers can purchase additional DreamWorlds for $6.99 each, or bundle 3 for $14.99.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">What if I need more analyses?</h4>
              <p className="text-sm text-muted-foreground">
                You can purchase the Dream Deep Dive Report ($4.99) for comprehensive analysis, or upgrade to a higher tier.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Do all tiers have video generation?</h4>
              <p className="text-sm text-muted-foreground">
                Architect (Premium) offers 6-second videos per dream. Star (VIP) includes 45-second cinematic DreamWorlds with voice narration and music.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-500/10 to-amber-500/10 border-t mt-12 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-sans font-bold mb-4">Ready to explore your dreams?</h3>
          <p className="text-muted-foreground mb-6">
            Start your dream journey today. No credit card required for the free plan.
          </p>
          <Button 
            size="lg" 
            onClick={() => handleSignUpWithPlan('free')}
            className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all"
          >
            Get Started Free
          </Button>
        </div>
      </div>

      <PageFooter logoSrc="/dreamworlds-logo.png" />
      </div>
      </div>
    </>
  )
}