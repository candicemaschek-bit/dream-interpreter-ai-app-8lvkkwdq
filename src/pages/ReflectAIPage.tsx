/**
 * ReflectAI Page
 * Main page for the Reflection Journal feature
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import { ReflectionJournal } from '../components/ReflectionJournal'
import { Spinner } from '../components/ui/spinner'
import { Button } from '../components/ui/button'
import type { SubscriptionTier } from '../config/tierCapabilities'
import { supabaseService } from '../lib/supabaseService'
import { canAccessReflectAI } from '../config/tierCapabilities'
import { blink } from '../blink/client'

export function ReflectAIPage() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  
  // Extract session context from URL
  const sessionId = params.sessionId
  const dreamId = searchParams.get('dreamId')
  const dreamTitle = searchParams.get('title')
  const dreamSummary = searchParams.get('dreamSummary')
  
  // Check for dream context passed from DreamInterpretationResults
  const [hasDreamContext, setHasDreamContext] = useState(false)
  
  useEffect(() => {
    const storedContext = sessionStorage.getItem('dreamReflectionContext')
    if (storedContext) {
      setHasDreamContext(true)
    }
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Check access when user changes
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!user) {
          navigate('/signin')
          setLoading(false)
          return
        }

        // Fetch user profile from Supabase
        const userProfile = await supabaseService.getProfile(user.id)
        if (!userProfile) {
          navigate('/')
          setLoading(false)
          return
        }

        setProfile(userProfile)

        // Check tier access (premium and vip only)
        const tier = (userProfile.subscription_tier || 'free') as SubscriptionTier
        const hasReflectAccess = canAccessReflectAI(tier)
        
        console.log('🔍 ReflectAI Page Access Check:', { tier, hasReflectAccess })
        setHasAccess(hasReflectAccess)

        if (!hasReflectAccess) {
          navigate('/pricing')
        }
      } catch (error) {
        console.error('Error checking ReflectAI access:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      checkAccess()
    }
  }, [user, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Lock className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground text-center max-w-md">
          ReflectAI is available on Premium ($19.99/month) and VIP ($29.99/month) tiers.
          Upgrade your subscription to access this feature.
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
        >
          View Plans
        </button>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  // Header component with back button
  const ReflectAIHeader = () => (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src="/logo_new.png" alt="Dreamcatcher AI" className="w-8 h-8 opacity-70" />
            <h1 className="text-2xl font-serif font-bold hidden sm:block">Dreamcatcher AI</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </header>
  )

  // If session context provided or dream context from interpretation, show chat view immediately
  if (sessionId && (dreamId || dreamTitle) || hasDreamContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <ReflectAIHeader />
        <div className="py-8">
          <div className="max-w-5xl mx-auto px-4">
            <ReflectionJournal
              userId={user.id}
              tier={profile.subscriptionTier || 'free'}
              dreamId={dreamId || undefined}
              sessionId={sessionId}
              dreamTitle={dreamTitle || undefined}
              initialView="chat"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <ReflectAIHeader />
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4">
          <ReflectionJournal
            userId={user.id}
            tier={profile.subscriptionTier || 'free'}
          />
        </div>
      </div>
    </div>
  )
}