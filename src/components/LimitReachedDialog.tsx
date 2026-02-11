import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LimitReachedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LimitReachedDialog({ open, onOpenChange }: LimitReachedDialogProps) {
  const navigate = useNavigate()

  const handleUpgradeClick = () => {
    onOpenChange(false)
    navigate('/pricing')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-lg bg-amber-100">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">Free Limit Reached</DialogTitle>
          <DialogDescription className="text-center mt-2">
            You've used all your free dream interpretations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-sm text-amber-900 mb-3">Ready to explore more dreams?</h4>
            <div className="space-y-2 text-sm text-amber-800">
              <div className="flex gap-2">
                <span className="font-bold text-amber-600">Pro</span>
                <span>$9.99/month - 10 interpretations</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-purple-600">Premium</span>
                <span>$19.99/month - 20 interpretations + videos</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-indigo-600">VIP</span>
                <span>$29.99/month - 25 interpretations + videos + DreamWorlds</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">💡 Alternative:</span> Share your dream code with friends! When they sign up using your code, you both unlock a free interpretation.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgradeClick}
            className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
          >
            Upgrade Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
