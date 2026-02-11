import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { logReauthAttempt } from '../utils/authTelemetry'

interface InlineReauthDialogProps {
  open: boolean
  onSuccess: () => void
  onCancel?: () => void
  userEmail?: string
  message?: string
}

/**
 * Inline Re-authentication Dialog Component
 * Prompts users to re-authenticate when their token expires without full page redirect
 * Supports password login and social OAuth providers
 */
export function InlineReauthDialog({
  open,
  onSuccess,
  onCancel,
  userEmail,
  message = 'Your session has expired. Please sign in again to continue.'
}: InlineReauthDialogProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'password' | 'social'>('password')

  // Clear form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPassword('')
      setError(null)
      setAuthMode(userEmail ? 'password' : 'social')
    }
  }, [open, userEmail])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userEmail || !password) {
      setError('Email and password are required')
      return
    }

    setIsLoading(true)
    setError(null)
    const startTime = Date.now()

    try {
      const result = await blink.auth.signInWithEmail(userEmail, password)
      const durationMs = Date.now() - startTime
      
      // Log successful reauth to telemetry
      await logReauthAttempt({
        userId: result?.id,
        userEmail: userEmail,
        method: 'password',
        success: true,
        durationMs
      })
      
      // Success - call onSuccess callback
      setPassword('')
      onSuccess()
    } catch (err: any) {
      const durationMs = Date.now() - startTime
      console.error('Re-authentication error:', err)
      
      // Log failed reauth to telemetry
      await logReauthAttempt({
        userEmail: userEmail,
        method: 'password',
        success: false,
        errorMessage: err.message || 'Invalid credentials',
        durationMs
      })
      
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github' | 'apple' | 'microsoft') => {
    setIsLoading(true)
    setError(null)
    const startTime = Date.now()

    try {
      console.log(`[InlineReauthDialog] Starting ${provider} authentication...`)
      
      // Step 1: Initiate social auth (opens popup)
      let result
      switch (provider) {
        case 'google':
          result = await blink.auth.signInWithGoogle()
          break
        case 'github':
          result = await blink.auth.signInWithGitHub()
          break
        case 'apple':
          result = await blink.auth.signInWithApple()
          break
        case 'microsoft':
          result = await blink.auth.signInWithMicrosoft()
          break
      }

      console.log(`[InlineReauthDialog] ${provider} popup completed, waiting for auth state...`)
      
      // Step 2: Wait for auth state to be confirmed (critical fix)
      // Poll for up to 5 seconds to ensure user is authenticated
      let attempts = 0
      const maxAttempts = 25 // 5 seconds (200ms intervals)
      
      while (attempts < maxAttempts) {
        try {
          const currentUser = await blink.auth.me()
          if (currentUser) {
            console.log(`[InlineReauthDialog] User authenticated successfully:`, currentUser.email)
            
            const durationMs = Date.now() - startTime
            
            // Log successful social reauth to telemetry
            await logReauthAttempt({
              userId: currentUser.id,
              userEmail: currentUser.email,
              method: provider,
              success: true,
              durationMs
            })

            // Success - call onSuccess callback
            onSuccess()
            return
          }
        } catch (err) {
          // User not authenticated yet, continue polling
        }
        
        await new Promise(resolve => setTimeout(resolve, 200))
        attempts++
      }
      
      // If we get here, authentication didn't complete
      const durationMs = Date.now() - startTime
      console.error(`[InlineReauthDialog] Authentication timeout - user not confirmed after ${maxAttempts} attempts`)
      
      // Log failed social reauth to telemetry
      await logReauthAttempt({
        method: provider,
        success: false,
        errorMessage: 'Authentication timeout - session not established',
        durationMs
      })
      
      setError(`Authentication completed but session wasn't established. Please try again.`)
      setIsLoading(false)
      
    } catch (err: any) {
      const durationMs = Date.now() - startTime
      console.error(`[InlineReauthDialog] ${provider} auth error:`, err)
      
      // Handle user cancellation gracefully
      const errorMessage = err.message || ''
      if (errorMessage.includes('canceled') || errorMessage.includes('cancelled') || errorMessage.includes('popup') || errorMessage.includes('closed')) {
        console.log(`[InlineReauthDialog] User cancelled ${provider} authentication`)
        // User cancelled the auth flow - just reset loading without showing error
        setIsLoading(false)
        return
      }
      
      // Log detailed error for debugging
      console.error(`[InlineReauthDialog] Detailed error:`, {
        message: errorMessage,
        code: err?.code,
        stack: err?.stack
      })
      
      // Log failed social reauth to telemetry
      await logReauthAttempt({
        method: provider,
        success: false,
        errorMessage: errorMessage || 'Social login failed',
        durationMs
      })
      
      setError(errorMessage || 'Social login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError(null)
    onCancel?.()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md shadow-2xl border-2">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo_new.png" alt="Logo" className="w-6 h-6 opacity-70" />
            <DialogTitle className="text-2xl">Session Expired</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tab Toggle */}
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                authMode === 'password'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('social')}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                authMode === 'social'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Social Login
            </button>
          </div>

          {/* Password Login Form */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {userEmail && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={userEmail}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* Social Login Options */}
          {authMode === 'social' && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                {isLoading ? (
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
                className="w-full h-11"
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continue with Apple
                  </>
                )}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>All your data is safe and will be restored after sign in.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
