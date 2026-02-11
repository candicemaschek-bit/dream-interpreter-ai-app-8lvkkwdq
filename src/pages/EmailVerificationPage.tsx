import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import { verifyEmailToken, createEmailVerificationToken } from '../utils/tokenVerification'
import { blink } from '../blink/client'

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('No verification token provided')
        return
      }

      try {
        const result = await verifyEmailToken(token)

        if (result.valid) {
          setStatus('success')
          setMessage('Your email has been verified successfully!')
          
          // Redirect to app after 3 seconds
          setTimeout(() => {
            navigate('/')
          }, 3000)
        } else {
          if (result.error?.includes('expired')) {
            setStatus('expired')
            setMessage('Your verification link has expired')
          } else {
            setStatus('error')
            setMessage(result.error || 'Verification failed')
          }
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  const handleResendVerification = async () => {
    setResending(true)
    try {
      const token = searchParams.get('token')
      
      const response = await blink.functions.invoke('resend-verification', {
        body: { tokenId: token }
      })
      
      if (response.error) {
        throw new Error(response.error)
      }

      setMessage(`New verification link generated. Please check your email.`)
      setStatus('success')
    } catch (error: any) {
      console.error('Error resending verification:', error)
      setMessage(error.message || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

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
            {(status === 'error' || status === 'expired') && (
              <XCircle className="w-16 h-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {(status === 'error' || status === 'expired') && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Redirecting you to the app...'}
            {status === 'expired' && 'Your verification link has expired'}
            {status === 'error' && 'Something went wrong'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={status === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'expired' && (
            <Button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full"
            >
              {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Mail className="w-4 h-4 mr-2" />
              Resend Verification Email
            </Button>
          )}

          {(status === 'error' || status === 'expired') && (
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Return to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
