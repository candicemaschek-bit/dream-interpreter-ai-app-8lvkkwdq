/**
 * ReflectAI Credit Indicator Component
 * Displays credit status for Premium and unlimited access for VIP users
 */

import { useEffect, useState } from 'react'
import { Sparkles, Lock } from 'lucide-react'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import type { SubscriptionTier } from '../types/subscription'
import type { ReflectAICredits } from '../types/reflectAI'
import { getReflectAIAccessStatus } from '../utils/reflectAICredits'
import { useNavigate } from 'react-router-dom'

interface ReflectAICreditIndicatorProps {
  userId: string
  tier: SubscriptionTier
  onCreditsUpdated?: () => void
}

export function ReflectAICreditIndicator({
  userId,
  tier,
  onCreditsUpdated
}: ReflectAICreditIndicatorProps) {
  const [accessStatus, setAccessStatus] = useState<{
    hasAccess: boolean
    tier: 'premium' | 'vip' | 'none'
    creditsRemaining?: number
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getReflectAIAccessStatus(userId, tier)
        setAccessStatus(status)
      } catch (error) {
        console.error('Error fetching ReflectAI access status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [userId, tier, onCreditsUpdated])

  if (loading) {
    return <div className="h-8 bg-secondary rounded animate-pulse" />
  }

  if (!accessStatus) {
    return null
  }

  // VIP: Unlimited access
  if (accessStatus.tier === 'vip') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Unlimited ReflectAI Access
        </span>
      </div>
    )
  }

  // Premium: Show credits indicator only if user has access or show upgrade option if out of credits
  if (accessStatus.tier === 'premium') {
    const creditsRemaining = accessStatus.creditsRemaining ?? 0
    const creditsTotal = 50
    const percentage = (creditsRemaining / creditsTotal) * 100

    // If Premium user has no credits left, show "Upgrade to VIP" option
    if (creditsRemaining <= 0) {
      return (
        <div className="space-y-2 p-3 bg-secondary/50 rounded-lg border border-secondary">
          <p className="text-xs text-destructive font-medium">
            Monthly credit limit reached
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/pricing')}
            className="w-full"
          >
            Upgrade to VIP
          </Button>
        </div>
      )
    }

    // Premium user with credits - show progress
    return (
      <div className="space-y-2 p-3 bg-secondary/50 rounded-lg border border-secondary">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            ReflectAI Credits
          </span>
          <span className="text-sm font-semibold text-foreground">
            {creditsRemaining}/{creditsTotal}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        
        {creditsRemaining > 0 && creditsRemaining <= 10 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Running low on credits. Consider upgrading to VIP for unlimited access.
          </p>
        )}
      </div>
    )
  }

  // No access: Free/Pro tier - show "Upgrade to Premium" CTA
  return (
    <div className="p-3 bg-secondary/50 rounded-lg border border-secondary space-y-2">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          ReflectAI is available on Premium+ tiers
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => navigate('/pricing')}
        className="w-full"
      >
        Upgrade to Premium
      </Button>
    </div>
  )
}
