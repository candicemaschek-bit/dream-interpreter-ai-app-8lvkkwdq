/**
 * Hook to check if current user is admin
 * Used to conditionally render admin UI elements
 */

import { useEffect, useState } from 'react'
import { blink } from '@/blink/client'
import { isAdmin } from '@/utils/roleChecking'

interface UseAdminAuthResult {
  isAdmin: boolean
  loading: boolean
  error: string | null
  userId: string | null
}

export function useAdminAuth(): UseAdminAuthResult {
  const [state, setState] = useState<UseAdminAuthResult>({
    isAdmin: false,
    loading: true,
    error: null,
    userId: null
  })

  useEffect(() => {
    let mounted = true

    const checkAdminStatus = async () => {
      try {
        const user = await blink.auth.me()
        
        if (!mounted) return

        if (!user) {
          setState({
            isAdmin: false,
            loading: false,
            error: null,
            userId: null
          })
          return
        }

        const adminStatus = await isAdmin(user.id)

        if (!mounted) return

        setState({
          isAdmin: adminStatus,
          loading: false,
          error: null,
          userId: user.id
        })
      } catch (error) {
        if (!mounted) return
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to check admin status'
        
        setState({
          isAdmin: false,
          loading: false,
          error: errorMessage,
          userId: null
        })
      }
    }

    checkAdminStatus()

    return () => {
      mounted = false
    }
  }, [])

  return state
}
