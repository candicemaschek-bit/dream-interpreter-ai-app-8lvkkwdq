import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Mail, ArrowRight } from 'lucide-react'
import { blink } from '../blink/client'
import { toast } from 'react-hot-toast'

interface NewsletterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewsletterDialog({ open, onOpenChange }: NewsletterDialogProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Please enter a valid email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      // Check if email already exists in newsletter list
      const existingSignup = await blink.db.earlyAccessList.list({
        where: { email: email.toLowerCase().trim(), tier: 'newsletter' }
      })

      if (existingSignup && existingSignup.length > 0) {
        toast.error('This email is already subscribed to our newsletter!')
        setIsSubmitting(false)
        return
      }

      // Get current user if authenticated
      let userId = null
      try {
        const user = await blink.auth.me()
        userId = user?.id || null
      } catch {
        // User not authenticated, that's fine
      }

      // Create newsletter signup
      await blink.db.earlyAccessList.create({
        id: `nl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: '', // No name for newsletter
        email: email.toLowerCase().trim(),
        tier: 'newsletter',
        userId,
        createdAt: new Date().toISOString(),
        invitationSent: '0'
      })

      setSubmitted(true)
      setEmail('')

      toast.success('Welcome to the Dream Letter! Check your email for updates.', {
        duration: 5000,
        icon: '💌'
      })

      // Close dialog after 2 seconds
      setTimeout(() => {
        onOpenChange(false)
        setSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error('Newsletter signup error:', error)
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 font-sans">
            <Mail className="w-5 h-5 text-primary" />
            Join the Dream Letter
          </DialogTitle>
          <DialogDescription className="text-base mt-4 text-center">
            Get early features, dream insights, and psychological tools before anyone else.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold font-sans mb-2">Welcome aboard!</h3>
            <p className="text-sm text-muted-foreground">
              Check your email for a confirmation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="w-full gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Subscribing...' : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              We'll never spam you. Unsubscribe anytime.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}