import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Loader2, AlertCircle, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react'
import { blink } from '../blink/client'
import { Alert, AlertDescription } from './ui/alert'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { PasswordStrengthMeter, getPasswordStrength } from '@/components/ui/password-strength-meter'
import { Turnstile } from '@/components/ui/turnstile'

export function SignIn() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [turnstileEnabled] = useState(() => {
    // Only enable Turnstile if site key is configured
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    return !!siteKey && siteKey !== "0x4AAAAAABKD9pNM5M_1z4b_"
  })
  
  // Ref to track if component is mounted (prevents memory leaks)
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const handleEmailPasswordAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setEmailNotVerified(false)
    
    // Validate password strength for signup
    if (mode === 'signup') {
      const strength = getPasswordStrength(password)
      if (strength.score < 2) {
        setError('Please choose a stronger password')
        setLoading(false)
        return
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
      
      // Verify Turnstile token for signup (only if enabled)
      if (turnstileEnabled && !turnstileToken) {
        setError('Please complete the security verification')
        setLoading(false)
        return
      }
    }
    
    try {
      if (mode === 'signin') {
        await blink.auth.signInWithEmail(email, password)
      } else {
        await blink.auth.signUp({ email, password })
      }
      // CRITICAL: Navigate with replace to prevent back button returning to signin
      navigate('/dashboard', { replace: true })
    } catch (error: any) {
      if (!isMountedRef.current) return
      
      // Check for EMAIL_NOT_VERIFIED error code (expected flow, not a real error)
      if (error?.code === 'EMAIL_NOT_VERIFIED' || error?.message?.includes('verify your email')) {
        setEmailNotVerified(true)
        setError('Your email address has not been verified yet.')
        setLoading(false)
        return
      }
      
      // Only log truly unexpected errors (not user input errors like wrong password)
      const isExpectedUserError = 
        error?.code === 'INVALID_CREDENTIALS' ||
        error?.code === 'EMAIL_ALREADY_EXISTS' ||
        error?.code === 'WEAK_PASSWORD' ||
        error?.code === 'RATE_LIMITED'
      
      if (!isExpectedUserError) {
        console.error('Auth error:', error)
      }
      
      const errorMessage = error?.userMessage || error?.message || `Unable to ${mode === 'signin' ? 'sign in' : 'sign up'}. Please try again.`
      setError(errorMessage)
      setLoading(false)
    }
  }, [mode, email, password, confirmPassword, turnstileToken, navigate])

  const handleMagicLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email format first (fail fast)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setLoading(true)
    setError(null)
    
    // Timeout to prevent stuck state
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return
      setLoading(false)
      setError('Request timed out. Please try again.')
    }, 8000)
    
    try {
      // CRITICAL FIX: Pass redirect URL to ensure users land on dashboard
      const redirectUrl = `${window.location.origin}/dashboard`
      await blink.auth.sendMagicLink(email, { redirectUrl })
      clearTimeout(timeoutId)
      if (!isMountedRef.current) return
      setMagicLinkSent(true)
      setLoading(false)
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (!isMountedRef.current) return
      console.error('Magic link error:', error)
      setError(error?.message || 'Unable to send magic link. Please try again.')
      setLoading(false)
    }
  }, [email])

  const handleSocialAuth = useCallback(async (provider: 'google' | 'apple') => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`[SignIn] Starting ${provider} authentication...`)
      
      // Step 1: Initiate social auth (opens popup)
      if (provider === 'google') {
        await blink.auth.signInWithGoogle()
      } else {
        await blink.auth.signInWithApple()
      }
      
      console.log(`[SignIn] ${provider} popup completed, waiting for auth state...`)
      
      // Step 2: Wait for auth state to be confirmed
      // Poll for up to 5 seconds to ensure user is authenticated
      const maxAttempts = 25 // 5 seconds (200ms intervals)
      
      for (let attempts = 0; attempts < maxAttempts; attempts++) {
        if (!isMountedRef.current) return
        
        try {
          const currentUser = await blink.auth.me()
          if (currentUser) {
            console.log(`[SignIn] User authenticated successfully:`, currentUser.email)
            // CRITICAL: Navigate to dashboard with replace to prevent back button going to homepage
            navigate('/dashboard', { replace: true })
            return
          }
        } catch {
          // User not authenticated yet, continue polling
        }
        
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Authentication didn't complete
      if (!isMountedRef.current) return
      console.error(`[SignIn] Authentication timeout - user not confirmed`)
      setError(`Authentication completed but session wasn't established. Please try again.`)
      setLoading(false)
      
    } catch (error: any) {
      if (!isMountedRef.current) return
      console.error(`[SignIn] ${provider} auth error:`, error)
      
      // Handle user cancellation gracefully
      const errorMessage = error?.message || ''
      if (errorMessage.includes('canceled') || errorMessage.includes('cancelled') || errorMessage.includes('popup') || errorMessage.includes('closed')) {
        console.log(`[SignIn] User cancelled ${provider} authentication`)
        setLoading(false)
        return
      }
      
      setError(errorMessage || `Unable to sign in with ${provider}. Please try again.`)
      setLoading(false)
    }
  }, [navigate])

  const handleResendVerification = useCallback(async () => {
    if (resending) return
    setResending(true)
    setError(null)
    setResendSuccess(false)
    
    try {
      const response = await blink.functions.invoke('resend-verification', {
        body: { email }
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setResendSuccess(true)
    } catch (error: any) {
      console.error('Resend verification error:', error)
      setError(error?.message || 'Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }, [email, resending])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <img src="/logo_new.png" alt="Dreamcatcher AI Logo" className="w-24 h-24 mx-auto object-contain" />
          <h1 className="text-4xl font-serif font-bold">Dreamcatcher AI</h1>
          <p className="text-muted-foreground">
            Sign in to unlock the meanings in your dreams
          </p>
        </div>

        <Card className="shadow-2xl border-2">
          <CardHeader>
            <CardTitle>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</CardTitle>
            <CardDescription>
              {mode === 'signin' ? 'Sign in to continue your dream journey' : 'Start exploring your dreams today'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && !emailNotVerified && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Email Not Verified Notice */}
            {emailNotVerified && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <Mail className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <div className="space-y-3">
                    <p className="font-medium">Please verify your email address</p>
                    <p className="text-sm">
                      We sent a verification link to <strong>{email}</strong>. Please check your inbox (and spam folder) and click the link to activate your account.
                    </p>
                    <div className="pt-2 space-y-3">
                      {resendSuccess ? (
                        <p className="text-xs text-green-600 font-medium flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          New verification email sent!
                        </p>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100"
                          onClick={handleResendVerification}
                          disabled={resending}
                        >
                          {resending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4 mr-2" />
                          )}
                          Resend Verification Email
                        </Button>
                      )}
                      
                      <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-amber-300 dark:border-amber-800"></div>
                        <span className="flex-shrink mx-2 text-[10px] uppercase text-amber-600 dark:text-amber-400 font-bold">Or</span>
                        <div className="flex-grow border-t border-amber-300 dark:border-amber-800"></div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        Sign in instantly without a password:
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/50"
                        onClick={() => {
                          setEmailNotVerified(false)
                          setError(null)
                          setUseMagicLink(true)
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Use Magic Link Instead
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {magicLinkSent ? (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Magic link sent! Check your email to sign in.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Auth Method Toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant={!useMagicLink ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setUseMagicLink(false)}
                  >
                    Password
                  </Button>
                  <Button
                    type="button"
                    variant={useMagicLink ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setUseMagicLink(true)}
                  >
                    Magic Link
                  </Button>
                </div>

                {/* Email/Password Form */}
                {!useMagicLink ? (
                  <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {mode === 'signup' && (
                        <PasswordStrengthMeter password={password} className="mt-2" />
                      )}
                      {mode === 'signin' && (
                        <div className="text-right">
                          <Link 
                            to="/request-password-reset" 
                            className="text-xs text-primary hover:underline"
                          >
                            Forgot Password?
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password for Signup */}
                    {mode === 'signup' && (
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                          <p className="text-xs text-red-500">Passwords do not match</p>
                        )}
                        {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                          <p className="text-xs text-green-600">Passwords match ✓</p>
                        )}
                      </div>
                    )}

                    {/* Turnstile CAPTCHA for Signup (only if configured) */}
                    {mode === 'signup' && turnstileEnabled && (
                      <div className="flex justify-center">
                        <Turnstile
                          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY!}
                          onVerify={(token) => setTurnstileToken(token)}
                          onExpire={() => setTurnstileToken(null)}
                          onError={() => setTurnstileToken(null)}
                          theme="auto"
                        />
                      </div>
                    )}

                    <Button 
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 text-base bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 hover:from-violet-700 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg border-0 transition-all duration-300"
                    >
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email">Email</Label>
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <Button 
                      type="submit"
                      disabled={loading || !email}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 hover:from-violet-700 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg border-0 transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Sending magic link...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          <span>Send Magic Link</span>
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      We'll send you a link to sign in without a password. Check your inbox in seconds!
                    </p>
                  </form>
                )}

                {/* Sign In/Sign Up Toggle */}
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    disabled={loading}
                  >
                    {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                {/* Social Auth Buttons */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
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
                    className="w-full h-11"
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
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Continue with Apple
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          By signing in, you agree to unlock the hidden meanings in your dreams
        </p>
      </div>
    </div>
  )
}
