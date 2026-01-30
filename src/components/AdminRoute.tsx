/**
 * Protected route wrapper for admin pages
 * Redirects non-admin users to home
 */

import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Spinner } from '@/components/ui/spinner'

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate()
  const { isAdmin, loading } = useAdminAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !isAdmin) {
      navigate('/')
    }
  }, [mounted, loading, isAdmin, navigate])

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <img src="/logo_new.png" alt="Access Denied" className="w-16 h-16 mx-auto mb-4 opacity-50 grayscale" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have admin privileges.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
