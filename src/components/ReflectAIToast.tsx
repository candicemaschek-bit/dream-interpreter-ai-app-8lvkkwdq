import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Brain } from 'lucide-react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'

import { canAccessReflectAI } from '../utils/subscriptionHelpers'
import type { SubscriptionTier } from '../types/subscription'

interface ReflectAIToastProps {
  isVisible: boolean
  onClose: () => void
  onReflectNow: () => void
  subscriptionTier?: SubscriptionTier
}

export function ReflectAIToast({ isVisible, onClose, onReflectNow, subscriptionTier = 'free' }: ReflectAIToastProps) {
  const canUseReflectAI = canAccessReflectAI({ subscriptionTier })
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    // Check if user has previously dismissed this toast
    const storedPreference = localStorage.getItem('reflect-ai-toast-dismissed')
    if (storedPreference === 'true') {
      return // Don't show if user has dismissed permanently
    }
  }, [])

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('reflect-ai-toast-dismissed', 'true')
    }
    onClose()
  }

  const handleReflectNow = () => {
    if (dontShowAgain) {
      localStorage.setItem('reflect-ai-toast-dismissed', 'true')
    }
    onReflectNow()
  }

  const handleUpgradeNow = () => {
    if (dontShowAgain) {
      localStorage.setItem('reflect-ai-toast-dismissed', 'true')
    }
    // Close toast and redirect to pricing
    onClose()
    setTimeout(() => {
      window.location.href = '/pricing'
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 rounded-lg shadow-2xl p-6 text-white border border-white/20 backdrop-blur-sm">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
        
        {/* Dreamy celestial background pattern */}
        <div className="absolute inset-0 rounded-lg overflow-hidden opacity-30">
          <div className="absolute top-2 left-2 w-4 h-4 bg-white/30 rounded-full blur-sm"></div>
          <div className="absolute top-8 right-6 w-3 h-3 bg-yellow-200/40 rounded-full blur-sm"></div>
          <div className="absolute bottom-4 left-8 w-2 h-2 bg-blue-200/50 rounded-full blur-sm"></div>
          <div className="absolute bottom-12 right-3 w-5 h-5 bg-purple-200/30 rounded-full blur-md"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">Ready to Reflect?</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/10 -mr-2 -mt-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-white/90 mb-6 leading-relaxed">
            {canUseReflectAI 
              ? "When you are ready, click the Reflect AI button below to do some Reflection journaling for this dream."
              : "Upgrade to Premium+ to access Reflect AI - Your personal Reflection Journal"
            }
          </p>

          <div className="flex items-center gap-3 mb-4">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-purple-900"
            />
            <label 
              htmlFor="dont-show-again" 
              className="text-xs text-white/80 cursor-pointer select-none"
            >
              Do not show this message again
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={canUseReflectAI ? handleReflectNow : handleUpgradeNow}
              className={`flex-1 border-0 shadow-lg ${
                canUseReflectAI 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              size="sm"
            >
              <Brain className="w-4 h-4 mr-2" />
              {canUseReflectAI ? 'Start Reflecting' : 'Upgrade Now'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-white/30 text-white/80 hover:bg-white/10"
              size="sm"
            >
              {canUseReflectAI ? 'Later' : 'Close'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}