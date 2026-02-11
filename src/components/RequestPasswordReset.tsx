import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { blink } from '../blink/client'

interface RequestPasswordResetProps {
  onBack?: () => void
}

export function RequestPasswordReset({ onBack }: RequestPasswordResetProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      // Use Blink SDK's built-in password reset email with custom redirect
      const redirectUrl = `${window.location.origin}/reset-password`
      await blink.auth.sendPasswordResetEmail(email, { redirectUrl })

      console.log('Password reset email sent successfully')
      setSuccess(true)
    } catch (error: any) {
      console.error('Password reset request error:', error)
      // For security, show success even if email doesn't exist
      // This prevents email enumeration attacks
      if (error?.message?.includes('not found') || error?.message?.includes('does not exist')) {
        setSuccess(true)
      } else {
        setError(error.message || 'Failed to send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            If an account exists for {email}, you will receive a password reset link shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Mail className="w-16 h-16 mx-auto text-primary mb-4" />
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Reset Link
          </Button>

          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
