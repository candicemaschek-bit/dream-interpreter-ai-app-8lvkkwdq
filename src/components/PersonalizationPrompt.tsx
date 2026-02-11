import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Sparkles } from 'lucide-react'

interface PersonalizationPromptProps {
  open: boolean
  onDismiss: () => void
  onComplete: () => void
}

export function PersonalizationPrompt({ open, onDismiss, onComplete }: PersonalizationPromptProps) {
  const [isNavigating, setIsNavigating] = useState(false)

  const handleComplete = () => {
    setIsNavigating(true)
    onComplete()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onDismiss()
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <DialogTitle>Complete Your Profile</DialogTitle>
          </div>
          <DialogDescription>
            Want better interpretations? Your profile helps our AI understand your unique dreams and provide personalized insights based on your age and experiences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground">
              📍 <span className="font-semibold">Takes just 30 seconds!</span> Answer a few simple questions about yourself.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Your profile helps with:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Personalized dream visuals</li>
              <li>Age-appropriate interpretations</li>
              <li>Better pattern recognition</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onDismiss}
            className="flex-1"
          >
            Skip for Now
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={isNavigating}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isNavigating ? 'Loading...' : 'Complete Profile (30s)'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
