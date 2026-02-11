import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { blink } from '../blink/client'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        // Subscribe to auth state changes
        const unsubscribe = blink.auth.onAuthStateChanged((state) => {
          if (!mounted) return

          if (state.isLoading) {
            setIsLoading(true)
          } else {
            setIsLoading(false)
            if (state.user) {
              // User is authenticated
              setIsAuthorized(true)
            } else {
              // User is not authenticated - redirect to landing page
              setIsAuthorized(false)
              navigate('/')
            }
          }
        })

        return unsubscribe
      } catch (error) {
        console.error('Error checking authentication:', error)
        if (mounted) {
          setIsLoading(false)
          navigate('/')
        }
      }
    }

    const unsubscribePromise = checkAuth()

    return () => {
      mounted = false
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) unsubscribe()
      })
    }
  }, [navigate])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <img src="/logo_new.png" alt="Loading..." className="w-16 h-16 animate-pulse mx-auto mb-4 opacity-50" />
            <div className="absolute inset-0 w-16 h-16 mx-auto">
              <div className="w-full h-full border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Show children only if authorized
  if (isAuthorized) {
    return <>{children}</>
  }

  // This shouldn't typically render since navigate('/') is called, but just in case
  return null
}
