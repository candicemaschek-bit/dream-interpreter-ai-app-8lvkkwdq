import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { blink } from '../blink/client'

interface SocialAuthDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void // Made optional - will navigate to dashboard by default
  title?: string
  description?: string
}

/**
 * Reusable Social Auth Dialog Component
 * Maintains consistent styling with the main sign-in dialog
 */
export function SocialAuthDialog({
  open,
  onClose,
  onSuccess,
  title = 'Dreamcatcher AI',
  description = 'Sign in to continue your dream journey'
}: SocialAuthDialogProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setLoading(true)
    setError(null)

    try {
      console.log(`[SocialAuthDialog] Starting ${provider} authentication...`)
      
      // Step 1: Initiate social auth (opens popup)
      if (provider === 'google') {
        await blink.auth.signInWithGoogle()
      } else {
        await blink.auth.signInWithApple()
      }
      
      console.log(`[SocialAuthDialog] ${provider} popup completed, waiting for auth state...`)
      
      // Step 2: Wait for auth state to be confirmed (critical fix)
      // Poll for up to 5 seconds to ensure user is authenticated
      let attempts = 0
      const maxAttempts = 25 // 5 seconds (200ms intervals)
      
      while (attempts < maxAttempts) {
        try {
          const currentUser = await blink.auth.me()
          if (currentUser) {
            console.log(`[SocialAuthDialog] User authenticated successfully:`, currentUser.email)
            // Success! Either call onSuccess callback or navigate to dashboard
            if (onSuccess) {
              onSuccess()
            } else {
              navigate('/dashboard', { replace: true })
            }
            return
          }
        } catch (err) {
          // User not authenticated yet, continue polling
        }
        
        await new Promise(resolve => setTimeout(resolve, 200))
        attempts++
      }
      
      // If we get here, authentication didn't complete
      console.error(`[SocialAuthDialog] Authentication timeout - user not confirmed after ${maxAttempts} attempts`)
      setError(`Authentication completed but session wasn't established. Please try again.`)
      setLoading(false)
      
    } catch (err: any) {
      console.error(`[SocialAuthDialog] ${provider} auth error:`, err)

      // Handle user cancellation gracefully
      const errorMessage = err?.message || ''
      if (errorMessage.includes('canceled') || errorMessage.includes('cancelled') || errorMessage.includes('popup') || errorMessage.includes('closed')) {
        console.log(`[SocialAuthDialog] User cancelled ${provider} authentication`)
        // User cancelled the auth flow - don't show error, just reset loading
        setLoading(false)
        return
      }
      
      // Log detailed error for debugging
      console.error(`[SocialAuthDialog] Detailed error:`, {
        message: errorMessage,
        code: err?.code,
        stack: err?.stack
      })

      setError(errorMessage || `Unable to sign in with ${provider}. Please try again.`)
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md shadow-2xl border-2">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo_new.png" alt="Logo" className="w-6 h-6 opacity-70" />
            <DialogTitle className="text-2xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Social Auth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => handleSocialAuth('google')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => handleSocialAuth('apple')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Continue with Apple
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
