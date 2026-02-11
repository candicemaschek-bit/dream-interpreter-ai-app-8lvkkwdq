import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Loader2, Sparkles } from 'lucide-react'
import { blink } from '../blink/client'
import { toast } from 'react-hot-toast'

interface EarlyAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tier: string
  tierName: string
}

export function EarlyAccessDialog({ open, onOpenChange, tier, tierName }: EarlyAccessDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in all fields')
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
      // Check if email already exists in early access list
      const existingSignup = await blink.db.earlyAccessList.list({
        where: { email: email.toLowerCase().trim() }
      })

      if (existingSignup && existingSignup.length > 0) {
        toast.error('This email is already on our early access list!')
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

      // Create early access signup
      await blink.db.earlyAccessList.create({
      id: `ea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      tier,
      userId,
      createdAt: new Date().toISOString(),
      invitationSent: '0'
      })

      toast.success(`You're on the list! We'll notify you when ${tierName} launches.`, {
        duration: 5000,
        icon: '🎉'
      })

      // Reset form and close dialog
      setName('')
      setEmail('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error signing up for early access:', error)
      toast.error('Failed to join early access list. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-accent" />
            Join Early Access List
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Be the first to know when we launch new features. We'll send you an exclusive invitation with special launch pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">What you'll get:</strong>
              <br />
              • Early access invitation before public launch
              <br />
              • Special launch pricing discount
              <br />
              • Exclusive updates on features
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Early Access'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
