import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CreditCard, Calendar, RefreshCw, Crown, ExternalLink } from 'lucide-react'
import { blink } from '../blink/client'
import { SUBSCRIPTION_PLANS } from '../types/subscription'
import type { SubscriptionTier } from '../types/subscription'
import { createPortalSession } from '../utils/stripeCheckout'
import toast from 'react-hot-toast'

interface SubscriptionStatusProps {
  userId: string
  currentTier: SubscriptionTier
}

export function SubscriptionStatus({ userId, currentTier }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [userId])

  const fetchSubscription = async () => {
    try {
      const subs = await blink.db.subscriptions.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 1
      })
      
      if (subs.length > 0) {
        setSubscription(subs[0])
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setIsOpeningPortal(true)
    try {
      await createPortalSession()
    } catch (error) {
      console.error('Portal error:', error)
      toast.error('Failed to open billing portal')
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const plan = SUBSCRIPTION_PLANS[currentTier]
  const isActive = subscription?.isActive === 1 || subscription?.isActive === true

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-32 bg-muted/20" />
      </Card>
    )
  }

  if (currentTier === 'free') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Plan Status
          </CardTitle>
          <CardDescription>You are currently on the free plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Free Dreamer
              </Badge>
              <p className="text-sm text-muted-foreground">
                Upgrade to Visionary for 10 analyses per month and HD images.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Active Subscription
            </CardTitle>
            <CardDescription>
              Manage your billing and subscription details
            </CardDescription>
          </div>
          <Badge className={isActive ? 'bg-green-500' : 'bg-red-500'}>
            {isActive ? 'Active' : 'Expired'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
            <div className="p-2 rounded bg-primary/10">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Plan</p>
              <p className="text-sm font-semibold">{plan.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
            <div className="p-2 rounded bg-primary/10">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                {subscription?.autoRenew ? 'Next Renewal' : 'Ends On'}
              </p>
              <p className="text-sm font-semibold">
                {subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
          onClick={handleManageBilling}
          disabled={isOpeningPortal}
        >
          {isOpeningPortal ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Manage Billing & Payments
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
