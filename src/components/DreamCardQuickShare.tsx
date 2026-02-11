/**
 * Quick Share Button for Dream Cards in Grid View
 * Displays share button overlay on dream card thumbnails
 */

import { useState } from 'react'
import { Share2, Heart, Lock } from 'lucide-react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import type { SubscriptionTier } from '../types/subscription'
import { getCommunityAccess } from '../types/community'
import toast from 'react-hot-toast'

interface DreamCardQuickShareProps {
  dreamId: string
  dreamTitle: string
  subscriptionTier: SubscriptionTier
  likeCount?: number
  isLiked?: boolean
  onShare?: () => void
  onLike?: () => void
  className?: string
}

export function DreamCardQuickShare({
  dreamId,
  dreamTitle,
  subscriptionTier,
  likeCount = 0,
  isLiked = false,
  onShare,
  onLike,
  className = ''
}: DreamCardQuickShareProps) {
  const [isHovered, setIsHovered] = useState(false)
  const access = getCommunityAccess(subscriptionTier)

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!access.canShareToCommunity) {
      toast('Upgrade to Architect or Star tier to share dreams to community', {
        icon: '🔒',
        duration: 3000
      })
      return
    }
    
    onShare?.()
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!access.canLikeDreams) {
      toast('Upgrade to Visionary or higher to like community dreams', {
        icon: '🔒',
        duration: 3000
      })
      return
    }
    
    onLike?.()
  }

  // Check if className indicates static positioning (for cards without images)
  const isStatic = className?.includes('position-static') || className?.includes('relative')

  return (
    <TooltipProvider>
      <div 
        className={`${isStatic ? 'relative' : 'absolute bottom-2 right-2'} flex gap-1 transition-opacity duration-200 ${
          isStatic ? '' : (isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
        } ${className?.replace('position-static', '')}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Like Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className={`h-8 w-8 rounded-full shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 hover:scale-110 transition-transform ${
                isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'
              } ${!access.canLikeDreams ? 'opacity-60' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {!access.canLikeDreams && (
                <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-gray-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">
              {access.canLikeDreams 
                ? (isLiked ? 'Unlike' : `Like${likeCount > 0 ? ` (${likeCount})` : ''}`)
                : 'Upgrade to like dreams'
              }
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Share Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className={`h-8 w-8 rounded-full shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 hover:scale-110 transition-transform ${
                !access.canShareToCommunity ? 'opacity-60' : ''
              }`}
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              {!access.canShareToCommunity && (
                <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-gray-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">
              {access.canShareToCommunity ? 'Share to Dreamscape' : 'Upgrade to share'}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
