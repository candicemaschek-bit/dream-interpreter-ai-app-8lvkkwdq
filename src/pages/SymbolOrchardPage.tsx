/**
 * Symbol Orchard Page
 * The garden where users explore and nurture their dream symbols
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { blink } from '../blink/client'
import { SymbolOrchard } from '../components/SymbolOrchard'
import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'
import { SEOHead } from '../components/SEOHead'
import { Loader2 } from 'lucide-react'
import type { SubscriptionTier } from '../config/tierCapabilities'

export function SymbolOrchardPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await blink.auth.me()
        if (!user) {
          navigate('/signin')
          return
        }
        
        setUserId(user.id)
        
        // Load subscription tier
        const profiles = await blink.db.userProfiles.list({
          where: { userId: user.id },
          limit: 1
        })
        
        if (profiles.length > 0) {
          const profile = profiles[0] as { subscriptionTier?: string }
          setTier((profile.subscriptionTier || 'free') as SubscriptionTier)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        navigate('/signin')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [navigate])

  const handleUpgradeClick = () => {
    navigate('/pricing')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead page="orchard" />
        <PageHeader showBackButton={true} backRoute="/dashboard" />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          </div>
        </main>
        <PageFooter />
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-50/30 to-background flex flex-col">
      <SEOHead page="orchard" />
      <PageHeader showBackButton={true} backRoute="/dashboard" />
      <main className="flex-1 container mx-auto px-4 py-8">
        <SymbolOrchard
          userId={userId}
          tier={tier}
          onUpgradeClick={handleUpgradeClick}
        />
      </main>
      <PageFooter />
    </div>
  )
}

export default SymbolOrchardPage
