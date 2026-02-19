import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Loader2, AlertCircle, Eye, EyeOff, Mail, ArrowLeft, MailCheck, CheckCircle2 } from 'lucide-react'
import { blink } from '../blink/client'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Separator } from '../components/ui/separator'
import { Badge } from '../components/ui/badge'
import type { SubscriptionTier } from '../types/subscription'
import { SEOHead } from '../components/SEOHead'
import { PasswordStrengthMeter, getPasswordStrength } from '@/components/ui/password-strength-meter'
import { Turnstile } from '@/components/ui/turnstile'
import { ensureUserRecord } from '../utils/authHelpers'

// Tier info constant (moved outside component to prevent recreation)
const TIER_INFO: Record<SubscriptionTier, { name: string; price: number; credits: string; comingSoon?: boolean }> = {
  free: { name: 'Dreamer', price: 0, credits: '2 lifetime' },
  pro: { name: 'Visionary', price: 9.99, credits: '10/month' },
  premium: { name: 'Architect', price: 19.99, credits: '20/month' },
  vip: { name: 'Star', price: 29.99, credits: '25/month', comingSoon: true }
}

export function SignUpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedTier = (searchParams.get('tier') as SubscriptionTier) || 'free'
  const initialMode = (searchParams.get('mode') as 'signin' | 'signup') || 'signup'
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
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

  useEffect(() => {
    // OPTIMIZATION: Check if user is already authenticated using auth state listener
    let unsubscribe: (() => void) | undefined
    
    const setupAuthListener = () => {
      unsubscribe = blink.auth.onAuthStateChanged((state) => {
        if (!isMountedRef.current) return
        
        if (!state.isLoading) {
          setIsCheckingAuth(false)
          if (state.user) {
            // User already authenticated, redirect immediately with replace
            navigate('/dashboard', { replace: true })
          }
        }
      })
    }
    
    setupAuthListener()
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [navigate])

  // Memoized tier info to prevent recalculation
  const tierInfo = useMemo(() => TIER_INFO[selectedTier] || TIER_INFO.free, [selectedTier])

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
      let user;
      if (mode === 'signin') {
        user = await blink.auth.signInWithEmail(email, password)
      } else {
        user = await blink.auth.signUp({ 
          email, 
          password,
          metadata: { selectedTier }
        })
      }

      if (user) {
        await ensureUserRecord(user)
      }
      
      // CRITICAL: Navigate with replace to prevent back button returning to signup
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
  }, [mode, email, password, confirmPassword, turnstileToken, selectedTier, navigate])

  const handleMagicLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // CRITICAL FIX: Pass redirect URL to ensure users land on dashboard
      const redirectUrl = `${window.location.origin}/dashboard`
      await blink.auth.sendMagicLink(email, { redirectUrl })
      if (!isMountedRef.current) return
      setMagicLinkSent(true)
      setLoading(false)
    } catch (error: any) {
      if (!isMountedRef.current) return
      console.error('Magic link error:', error)
      setError(error?.message || 'Unable to send magic link. Please try again.')
      setLoading(false)
    }
  }, [email])

  const handleSocialAuth = useCallback(async (provider: 'google' | 'apple') => {
    if (loading) return
    setLoading(true)
    setError(null)
    
    try {
      console.log(`[SignUpPage] Starting ${provider} authentication...`)
      
      // Step 1: Initiate social auth (opens popup)
      if (provider === 'google') {
        await blink.auth.signInWithGoogle()
      } else {
        await blink.auth.signInWithApple()
      }
      
      console.log(`[SignUpPage] ${provider} popup completed, waiting for auth state...`)
      
      // Step 2: Wait for auth state to be confirmed
      // Poll for up to 5 seconds to ensure user is authenticated
      // OPTIMIZATION: Use a shorter interval initially and back off slightly
      let attempts = 0
      const maxAttempts = 20
      
      const checkAuth = async () => {
        if (!isMountedRef.current) return false
        
        try {
          const currentUser = await blink.auth.me()
          if (currentUser) {
            console.log(`[SignUpPage] User authenticated successfully:`, currentUser.email)
            await ensureUserRecord(currentUser)
            navigate('/dashboard', { replace: true })
            return true
          }
        } catch {
          // User not authenticated yet
        }
        return false
      }

      // Initial check
      if (await checkAuth()) return

      const interval = setInterval(async () => {
        attempts++
        if (attempts >= maxAttempts || !isMountedRef.current) {
          clearInterval(interval)
          if (isMountedRef.current && attempts >= maxAttempts) {
            console.error(`[SignUpPage] Authentication timeout - user not confirmed`)
            setError(`Authentication completed but session wasn't established. Please try again.`)
            setLoading(false)
          }
          return
        }

        if (await checkAuth()) {
          clearInterval(interval)
        }
      }, 250) // Slightly longer interval for less CPU pressure
      
    } catch (error: any) {
      if (!isMountedRef.current) return
      console.error(`[SignUpPage] ${provider} auth error:`, error)
      
      // Handle user cancellation gracefully
      const errorMessage = error?.message || ''
      if (errorMessage.includes('canceled') || errorMessage.includes('cancelled') || errorMessage.includes('popup') || errorMessage.includes('closed')) {
        console.log(`[SignUpPage] User cancelled ${provider} authentication`)
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

  // Show loading while checking auth state
  if (isCheckingAuth) {
    return (
      <>
        <SEOHead page="signup" />
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative">
              <img src="/logo_new.png" alt="Loading..." className="w-24 h-24 animate-pulse mx-auto mb-4 object-contain" />
              <div className="absolute inset-0 w-24 h-24 mx-auto">
                <div className="w-full h-full border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-muted-foreground mt-4">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEOHead page="signup" />
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <img src="/dreamworlds-logo.png" alt="Dreamworlds Logo" className="w-24 h-24 mx-auto object-contain relative z-10 drop-shadow-xl" />
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
          </div>
          <h1 className="text-4xl font-sans font-bold dream-gradient-text drop-shadow-sm tracking-tight">DREAMWORLDS</h1>
          <p className="text-muted-foreground font-medium">
            {mode === 'signup' ? 'Start your dream journey' : 'Welcome back'}
          </p>
        </div>

        {/* Selected Tier Card */}
        {selectedTier !== 'free' && mode === 'signup' && !tierInfo.comingSoon && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{tierInfo.name} Plan</div>
                  <div className="text-sm text-muted-foreground">{tierInfo.credits}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${tierInfo.price}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTier === 'free' && mode === 'signup' && (
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 text-center">
              <Badge className="mb-2">Free Forever</Badge>
              <p className="text-sm text-muted-foreground">
                No credit card required. Start with {tierInfo.credits} dream analyses.
              </p>
            </CardContent>
          </Card>
        )}

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
                      {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : mode === 'signin' ? 'Sign In' : 'Create Account'}
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
                      disabled={loading}
                      className="w-full h-12 text-base bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 hover:from-violet-700 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg border-0 transition-all duration-300"
                    >
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {loading ? 'Sending...' : 'Send Magic Link'}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      We'll send you a link to sign in without a password
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

        {mode === 'signup' && selectedTier === 'free' && (
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              🎉 After signing up, you'll get instant access to 2 free dream analyses. No payment required.
            </CardContent>
          </Card>
        )}

        {mode === 'signup' && selectedTier !== 'free' && !tierInfo.comingSoon && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              💳 After signing up, you'll be guided through secure payment setup to activate your {tierInfo.name} plan.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  )
}
