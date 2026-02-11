/**
 * Reflect AI Marketing Modal
 * Shows upgrade CTA for Free/Pro users who click the Reflect AI button
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Brain, Sparkles, Crown, CheckCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { SubscriptionTier } from '../types/subscription'

interface ReflectAIMarketingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionTier: SubscriptionTier
}

export function ReflectAIMarketingModal({ 
  open, 
  onOpenChange, 
  subscriptionTier 
}: ReflectAIMarketingModalProps) {
  const navigate = useNavigate()
  
  // Determine upgrade target based on current tier
  const getUpgradeTarget = () => {
    switch (subscriptionTier) {
      case 'free':
        return { name: 'Pro', color: 'from-blue-500 to-cyan-500' }
      case 'pro':
        return { name: 'Premium', color: 'from-purple-500 to-pink-500' }
      default:
        return { name: 'Premium', color: 'from-purple-500 to-pink-500' }
    }
  }
  
  const upgradeTarget = getUpgradeTarget()
  
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Reflection',
      description: 'Get personalized journaling prompts based on your dream'
    },
    {
      icon: Sparkles,
      title: 'Deeper Insights',
      description: 'Uncover hidden meanings and patterns in your dreams'
    },
    {
      icon: CheckCircle,
      title: 'Guided Journaling',
      description: 'Step-by-step reflection exercises for self-discovery'
    }
  ]
  
  const handleUpgrade = () => {
    onOpenChange(false)
    navigate('/pricing')
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Unlock Reflect AI
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Your personal AI-powered reflection journal
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Feature List */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Upgrade Badge */}
          <div className="flex justify-center pt-2">
            <Badge variant="secondary" className={`bg-gradient-to-r ${upgradeTarget.color} text-white px-3 py-1`}>
              <Crown className="w-3 h-3 mr-1" />
              Available with {upgradeTarget.name}+
            </Badge>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleUpgrade}
            className={`w-full bg-gradient-to-r ${upgradeTarget.color} hover:opacity-90 text-white font-semibold h-11`}
          >
            Upgrade to {upgradeTarget.name}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            Maybe Later
          </Button>
        </div>
        
        {/* Trust Badge */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          ✨ Premium users love Reflect AI for deeper dream insights
        </p>
      </DialogContent>
    </Dialog>
  )
}
