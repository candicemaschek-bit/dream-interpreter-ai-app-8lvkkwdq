/**
 * ReflectAI Protected Route
 * Route guard for ReflectAI feature access based on subscription tier
 */

import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { blink } from '../blink/client'
import { queryUserProfile } from '../types/database'
import type { SubscriptionTier } from '../types/subscription'

interface ReflectAIRouteProps {
  children: ReactNode
}

export function ReflectAIRoute({ children }: ReflectAIRouteProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

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
        // Must be authenticated
        if (!user) {
          navigate('/signin')
          setChecking(false)
          return
        }

        // Fetch user profile
        const profile = await queryUserProfile(user.id)
        if (!profile) {
          navigate('/')
          setChecking(false)
          return
        }

        // Check tier
        const tier = (profile.subscriptionTier || 'free') as SubscriptionTier
        const allowed = tier === 'premium' || tier === 'vip'

        if (!allowed) {
          navigate('/pricing')
        } else {
          setIsAuthorized(true)
        }
      } catch (error) {
        console.error('Error checking ReflectAI access:', error)
        navigate('/')
      } finally {
        setChecking(false)
      }
    }

    if (user) {
      checkAccess()
    }
  }, [user, navigate])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
