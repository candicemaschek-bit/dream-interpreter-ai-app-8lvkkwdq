/**
 * Share to Community Toggle Component
 * Appears on dream interpretation results to allow sharing to community
 */

import { useState, useEffect } from 'react'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip'
import { Globe, Lock, Eye, EyeOff, Users, Sparkles } from 'lucide-react'
import type { SubscriptionTier } from '../types/subscription'
import { getCommunityAccess, DREAM_TERRITORIES, type DreamTerritory } from '../types/community'
import { shareToCommunity, detectTerritory } from '../utils/communityService'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'

interface ShareToCommunityToggleProps {
  dreamId: string
  title: string
  description: string
  interpretation?: string
  imageUrl?: string
  userId: string
  subscriptionTier: SubscriptionTier
  onShared?: (communityDreamId: string) => void
}

export function ShareToCommunityToggle({
  dreamId,
  title,
  description,
  interpretation,
  imageUrl,
  userId,
  subscriptionTier,
  onShared
}: ShareToCommunityToggleProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasShared, setHasShared] = useState(false)
  const [consentToShareOutside, setConsentToShareOutside] = useState(false)

  // Check if dream was previously shared on component mount
  useEffect(() => {
    const checkIfShared = async () => {
      try {
        const existing = await blink.db.communityDreams.list({
          where: { dreamId, userId }
        })
        if (existing.length > 0) {
          setHasShared(true)
        }
      } catch (error) {
        console.error('Error checking if dream was shared:', error)
      }
    }
    checkIfShared()
  }, [dreamId, userId])

  const access = getCommunityAccess(subscriptionTier)
  const detectedTerritory = detectTerritory(title, description, interpretation)
  const territoryInfo = DREAM_TERRITORIES[detectedTerritory]

  const handleShare = async () => {
    if (!access.canShareToCommunity) {
      toast('Upgrade to Architect tier or higher to share dreams to the community', {
        icon: '🔒',
        duration: 4000
      })
      return
    }

    if (!consentToShareOutside) {
      toast('Please accept the consent to share outside of Dreamscape', {
        icon: '🔒',
        duration: 3000
      })
      return
    }

    setIsSharing(true)
    try {
      const result = await shareToCommunity(
        dreamId,
        userId,
        title,
        description,
        interpretation,
        imageUrl,
        isAnonymous
      )

      if (result.success && result.communityDreamId) {
        // Show warning if content was flagged but allowed
        if (result.warning) {
          toast(result.warning, {
            icon: '⚠️',
            duration: 5000
          })
        }
        
        toast.success('Dream shared to community!', {
          icon: '🌟',
          duration: 3000
        })
        setHasShared(true)
        onShared?.(result.communityDreamId)
      } else {
        toast.error(result.error || 'Failed to share dream')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to share dream')
    } finally {
      setIsSharing(false)
    }
  }

  if (hasShared) {
    return (
      <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <Globe className="h-5 w-5" />
          <span className="font-medium">Shared to Dreamscape</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {territoryInfo.icon} {territoryInfo.name}
          </Badge>
        </div>
        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
          Your dream is now visible in the {territoryInfo.name} territory
        </p>
      </div>
    )
  }

  if (!access.canShareToCommunity) {
    return (
      <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Share to Dreamscape
            </p>
            <p className="text-sm text-gray-500">
              Upgrade to Architect tier to share dreams
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/pricing'}
          >
            Upgrade
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Share to Dreamscape
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Let others discover your dream
            </p>
          </div>
        </div>
        <Sparkles className={`h-5 w-5 text-purple-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 pt-4 border-t border-purple-200 dark:border-purple-800">
          {/* Territory Preview */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Territory:</span>
            <Badge 
              className={`bg-gradient-to-r ${territoryInfo.gradient} text-white border-0`}
            >
              {territoryInfo.icon} {territoryInfo.name}
            </Badge>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAnonymous ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                Share anonymously
              </Label>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>
          <p className="text-xs text-gray-500">
            {isAnonymous 
              ? 'Your username will be hidden from other dreamers'
              : 'Your display name will be shown with the dream'
            }
          </p>

          {/* Consent Toggle */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 flex-1 pt-1">
              <input
                type="checkbox"
                id="consent"
                checked={consentToShareOutside}
                onChange={(e) => setConsentToShareOutside(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="consent" className="text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                I consent to my dream being shared to Dreamscape
              </label>
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">
            Your dream may be quoted or referenced in articles, social media, or other external contexts
          </p>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            disabled={isSharing || !consentToShareOutside}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? (
              <>Sharing...</>
            ) : !consentToShareOutside ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Accept consent to share
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Share to Dreamscape
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            By sharing, you agree to our community guidelines
          </p>
        </div>
      )}
    </div>
  )
}
