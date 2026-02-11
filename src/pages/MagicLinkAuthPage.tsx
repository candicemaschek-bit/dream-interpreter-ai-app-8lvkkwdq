import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react'
import { blink } from '../blink/client'

export function MagicLinkAuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    
    const authenticateWithMagicLink = async () => {
      const token = searchParams.get('token')

      if (!token) {
        if (mounted) {
          setStatus('error')
          setMessage('No magic link token provided. Please request a new magic link to sign in.')
        }
        return
      }

      try {
        console.log('[MagicLink] Starting authentication process...')
        
        // Hash the token for verification
        const tokenHash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(token)
        )
        const tokenHashHex = Array.from(new Uint8Array(tokenHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        const lookupHash = tokenHashHex.substring(0, 16)

        // Find token in database
        const tokens = await blink.db.magicLinkTokens.list({
          where: { lookupHash },
          limit: 1
        })

        if (tokens.length === 0 || tokens[0].tokenHash !== tokenHashHex) {
          if (mounted) {
            setStatus('error')
            setMessage('Invalid or expired magic link')
          }
          return
        }

        const tokenRecord = tokens[0]
        
        // Check expiration
        if (new Date(tokenRecord.expiresAt) < new Date()) {
          await blink.db.magicLinkTokens.delete(tokenRecord.id)
          if (mounted) {
            setStatus('error')
            setMessage('Magic link has expired')
          }
          return
        }

        console.log('[MagicLink] Token verified for email:', tokenRecord.email)
        
        // CRITICAL FIX: Get redirect URL from token (defaults to /dashboard)
        const redirectPath = tokenRecord.redirectUrl || '/dashboard'
        console.log('[MagicLink] Will redirect to:', redirectPath)

        // Delete token (one-time use)
        await blink.db.magicLinkTokens.delete(tokenRecord.id)

        // Check if user exists
        const users = await blink.db.users.list({
          where: { email: tokenRecord.email },
          limit: 1
        })

        let authSuccess = false

        if (users.length === 0) {
          // New user - create account via Blink SDK auth
          console.log('[MagicLink] Creating new user account...')
          try {
            const password = crypto.randomUUID() // Generate random password
            const newUser = await blink.auth.signUp({
              email: tokenRecord.email,
              password: password
            })
            
            if (!newUser) {
              throw new Error('Failed to create user account')
            }
            
            console.log('[MagicLink] New user created and authenticated:', newUser.email)
            authSuccess = true
          } catch (signupError) {
            console.error('[MagicLink] Signup error:', signupError)
            if (mounted) {
              setStatus('error')
              setMessage('Unable to create account. Please try again.')
            }
            return
          }
        } else {
          // Existing user - email was just verified
          console.log('[MagicLink] Email verified for existing user:', tokenRecord.email)
          const existingUser = users[0]
          
          // Update their verification status
          await blink.db.users.update(existingUser.id, {
            emailVerified: 1,
            lastSignIn: new Date().toISOString()
          })
          
          console.log('[MagicLink] Email verified in database')
          authSuccess = true
        }

        if (authSuccess && mounted) {
          setStatus('success')
          setMessage('Welcome! Redirecting to dashboard...')
          
          // For new users: Wait for auth state to be confirmed
          // For existing users: Just delay slightly for consistency
          // This gives the auth listener time to fire and set user state
          let attempts = 0
          const maxAttempts = 40 // 8 seconds total (40 * 200ms)
          let navigationComplete = false
          
          const checkAndNavigate = async () => {
            attempts++
            
            // Check if user is authenticated with Blink SDK
            const currentUser = await blink.auth.me()
            console.log(`[MagicLink] Auth check ${attempts}/${maxAttempts}:`, { hasUser: !!currentUser, email: currentUser?.email })
            
            if (currentUser && currentUser.email === tokenRecord.email) {
              // User is authenticated!
              console.log('✅ [MagicLink] Auth confirmed, navigating to dashboard')
              navigationComplete = true
              if (mounted) {
                navigate(redirectPath, { replace: true })
              }
            } else if (attempts >= maxAttempts) {
              // Timeout - still try to navigate (may redirect if not authed)
              console.warn('[MagicLink] Auth confirmation timeout, navigating anyway')
              navigationComplete = true
              if (mounted) {
                navigate(redirectPath, { replace: true })
              }
            } else {
              // Not ready yet, check again
              setTimeout(checkAndNavigate, 200)
            }
          }
          
          // Start checking immediately
          checkAndNavigate()
        }
      } catch (error: any) {
        console.error('[MagicLink] Unexpected error:', error)
        if (mounted) {
          setStatus('error')
          setMessage(error?.message || 'An unexpected error occurred')
        }
      }
    }

    authenticateWithMagicLink()
    
    return () => {
      mounted = false
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'verifying' && (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {status === 'verifying' && (
              <>
                <Sparkles className="w-6 h-6" />
                Authenticating
              </>
            )}
            {status === 'success' && 'Welcome Back!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Verifying your magic link...'}
            {status === 'success' && 'Redirecting you to the app...'}
            {status === 'error' && 'Something went wrong'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={status === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/signup', { replace: true })}
                className="w-full"
              >
                Return to Sign In
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/', { replace: true })}
                className="w-full text-muted-foreground"
              >
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
