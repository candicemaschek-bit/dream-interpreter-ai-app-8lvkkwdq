import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
interface TTSConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  subscriptionTier: SubscriptionTier
  currentSpend: number
  estimatedCost: number
  monthlyLimit: number
  characterCount: number
  estimatedDuration: number
  voiceName?: string
}
import { Button } from './ui/button'
import { AlertCircle, Volume2, DollarSign, TrendingUp, Info } from 'lucide-react'
import { Badge } from './ui/badge'
import type { SubscriptionTier } from '../types/subscription'


export function TTSConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  subscriptionTier,
  currentSpend,
  estimatedCost,
  monthlyLimit,
  voiceName = 'nova',
  characterCount,
  estimatedDuration
}: TTSConfirmationDialogProps) {
  // VIP tier: $0.94 monthly budget
  const remainingBudget = monthlyLimit - currentSpend
  const wouldExceedBudget = currentSpend + estimatedCost > monthlyLimit
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-600" />
            Generate Audio Narration?
          </DialogTitle>
          <DialogDescription>
            Create an AI voice narration of your dream interpretation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tier Badge - VIP only with budget info */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-900">AI Voice Narration</span>
              <Badge variant="secondary">VIP Star</Badge>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-600">Monthly Budget</span>
                <span className="font-semibold text-purple-900">${monthlyLimit.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-600">Used This Month</span>
                <span className="font-semibold text-purple-900">${currentSpend.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-600">Remaining</span>
                <span className={`font-semibold ${wouldExceedBudget ? 'text-red-600' : 'text-green-600'}`}>
                  ${remainingBudget.toFixed(3)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all ${wouldExceedBudget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (currentSpend / monthlyLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Generation Details */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-500" />
              Generation Details
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Characters</p>
                <p className="font-semibold text-gray-900">{characterCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Est. Duration</p>
                <p className="font-semibold text-gray-900">{formatDuration(estimatedDuration)}</p>
              </div>
              <div>
                <p className="text-gray-500">Voice Model</p>
                <p className="font-semibold text-gray-900">Nova</p>
              </div>
              <div>
                <p className="text-gray-500">Quality</p>
                <p className="font-semibold text-gray-900">HD</p>
              </div>
            </div>
          </div>

          {/* Budget warning or info */}
          {wouldExceedBudget ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-700">Monthly Budget Exceeded</p>
                  <p className="text-xs text-red-600 mt-1">
                    This narration costs ${estimatedCost.toFixed(3)} but you only have ${remainingBudget.toFixed(3)} remaining. Budget resets next month.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Listen to your dream interpretation narrated by AI in a clear, engaging voice. Perfect for bedtime listening or on the go.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            disabled={wouldExceedBudget}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-violet-600"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            {wouldExceedBudget ? 'Budget Exceeded' : 'Generate Audio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
