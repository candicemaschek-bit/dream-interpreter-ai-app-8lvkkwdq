import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { blink } from '../blink/client'

export function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const validateToken = () => {
      const token = searchParams.get('token')

      if (!token) {
        setTokenValid(false)
        setError('No reset token provided')
        return
      }

      // Token exists, allow user to proceed with reset
      // The actual token validation happens when they submit the new password
      setTokenValid(true)
    }

    validateToken()
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const token = searchParams.get('token')
    if (!token) {
      setError('Invalid reset session')
      return
    }

    setLoading(true)

    try {
      // Use Blink SDK to confirm password reset with token
      await blink.auth.confirmPasswordReset(token, newPassword)

      setSuccess(true)

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        navigate('/signup')
      }, 3000)
    } catch (error: any) {
      console.error('Password reset error:', error)
      
      // Handle specific error cases
      if (error?.message?.includes('expired') || error?.message?.includes('invalid')) {
        setError('This reset link has expired or is invalid. Please request a new one.')
      } else if (error?.message?.includes('password')) {
        setError(error.message)
      } else {
        setError('Failed to reset password. Please try again or request a new reset link.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo_new.png" alt="Logo" className="w-16 h-16 mx-auto opacity-70" />
            <h1 className="text-4xl font-serif font-bold">Dreamcatcher AI</h1>
          </div>
          <Card className="shadow-2xl">
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <p className="mt-4 text-muted-foreground">Validating reset link...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo_new.png" alt="Logo" className="w-16 h-16 mx-auto opacity-70" />
            <h1 className="text-4xl font-serif font-bold">Dreamcatcher AI</h1>
          </div>
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={() => navigate('/request-password-reset')}
                className="w-full"
              >
                Request New Reset Link
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/signup')}
                className="w-full"
              >
                Return to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo_new.png" alt="Logo" className="w-16 h-16 mx-auto opacity-70" />
            <h1 className="text-4xl font-serif font-bold">Dreamcatcher AI</h1>
          </div>
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <CardTitle>Password Reset Successful</CardTitle>
              <CardDescription>
                Your password has been updated. Redirecting to sign in...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img src="/logo_new.png" alt="Logo" className="w-16 h-16 mx-auto opacity-70" />
          <h1 className="text-4xl font-serif font-bold">Dreamcatcher AI</h1>
          <p className="text-muted-foreground">
            Reset your password to continue your dream journey
          </p>
        </div>
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <Lock className="w-16 h-16 mx-auto text-primary mb-4" />
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/signup')}
              className="w-full"
              disabled={loading}
            >
              Cancel
            </Button>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
