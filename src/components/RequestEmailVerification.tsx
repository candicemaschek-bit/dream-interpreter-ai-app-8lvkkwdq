import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { createEmailVerificationToken } from '../utils/tokenVerification'
import { blink } from '../blink/client'

export function RequestEmailVerification() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSendVerification = async () => {
    setError('')
    setLoading(true)

    try {
      const user = await blink.auth.me()

      if (!user) {
        setError('Please sign in first')
        setLoading(false)
        return
      }

      // Check if already verified
      const users = await blink.db.users.list({
        where: { id: user.id },
        limit: 1,
      })

      if (users.length > 0 && users[0].emailVerified === 1) {
        setError('Your email is already verified')
        setLoading(false)
        return
      }

      // Generate verification token
      const { verificationUrl } = await createEmailVerificationToken(user.id)

      // In production, send this via email service
      console.log('Verification URL:', verificationUrl)

      setSuccess(true)
    } catch (error: any) {
      console.error('Email verification request error:', error)
      setError(error.message || 'Failed to send verification email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <CardTitle>Verification Email Sent</CardTitle>
          <CardDescription>
            Please check your inbox and click the verification link to activate your account
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Mail className="w-16 h-16 mx-auto text-primary mb-4" />
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Click below to receive a verification link in your email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSendVerification}
          className="w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Mail className="w-4 h-4 mr-2" />
          Send Verification Email
        </Button>
      </CardContent>
    </Card>
  )
}
