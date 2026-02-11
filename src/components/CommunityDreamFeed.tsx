/**
 * Community Dream Feed - Displays dreams from a specific territory
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { 
  ArrowLeft,
  Heart,
  Share2,
  Eye,
  Lock,
  TrendingUp,
  Sparkles,
  Flag
} from 'lucide-react'
import { ReportDreamDialog } from './ReportDreamDialog'
import { 
  DREAM_TERRITORIES, 
  type DreamTerritory, 
  type CommunityDream,
  getCommunityAccess 
} from '../types/community'
import { 
  getCommunityDreamsByTerritory, 
  likeDream, 
  unlikeDream,
  trackView
} from '../utils/communityService'
import { parseInterpretation } from '../utils/interpretationParser'
import { isCurrentUserAdmin } from '../utils/roleChecking'
import type { SubscriptionTier } from '../types/subscription'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'

interface CommunityDreamFeedProps {
  territory: DreamTerritory
  subscriptionTier: SubscriptionTier
  onBack: () => void
}

export function CommunityDreamFeed({
  territory,
  subscriptionTier,
  onBack
}: CommunityDreamFeedProps) {
  const [dreams, setDreams] = useState<CommunityDream[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userIsAdmin, setUserIsAdmin] = useState(false)

  const territoryInfo = DREAM_TERRITORIES[territory]
  const access = getCommunityAccess(subscriptionTier)

  useEffect(() => {
    loadDreams()
    checkAdmin()
  }, [territory])

  const checkAdmin = async () => {
    const adminStatus = await isCurrentUserAdmin()
    setUserIsAdmin(adminStatus)
  }

  const loadDreams = async () => {
    setIsLoading(true)
    try {
      const user = await blink.auth.me()
      setUserId(user.id)
      
      const communityDreams = await getCommunityDreamsByTerritory(
        territory, 
        user.id,
        50
      )
      setDreams(communityDreams)
    } catch (error) {
      console.error('Error loading dreams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (dream: CommunityDream) => {
    if (!access.canLikeDreams) {
      toast('Upgrade to Visionary or higher to like dreams', {
        icon: '🔒'
      })
      return
    }

    if (!userId) return

    // Optimistic update
    setDreams(prev => prev.map(d => {
      if (d.id === dream.id) {
        return {
          ...d,
          hasLiked: !d.hasLiked,
          likeCount: d.hasLiked ? d.likeCount - 1 : d.likeCount + 1
        }
      }
      return d
    }))

    try {
      if (dream.hasLiked) {
        await unlikeDream(dream.id, userId)
      } else {
        await likeDream(dream.id, userId)
      }
    } catch (error) {
      // Revert on error
      setDreams(prev => prev.map(d => {
        if (d.id === dream.id) {
          return {
            ...d,
            hasLiked: dream.hasLiked,
            likeCount: dream.likeCount
          }
        }
        return d
      }))
      toast.error('Failed to update like')
    }
  }

  const handleShare = (dream: CommunityDream) => {
    const shareUrl = `${window.location.origin}/dream/${dream.dreamId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Territories
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">{territoryInfo.icon}</span>
        <div>
          <h2 className="text-2xl font-serif">{territoryInfo.name}</h2>
          <p className="text-muted-foreground">{territoryInfo.description}</p>
        </div>
      </div>

      {/* Dreams Grid */}
      {dreams.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-serif">No Dreams Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Be the first to share a dream in the {territoryInfo.name} territory!
            </p>
            {access.canShareToCommunity && (
              <Button className="mt-2">
                Share Your Dream
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dreams.map((dream) => (
            <CommunityDreamCard
              key={dream.id}
              dream={dream}
              access={access}
              onLike={() => handleLike(dream)}
              onShare={() => handleShare(dream)}
              isAdmin={userIsAdmin}
            />
          ))}
        </div>
      )}

      {/* Trending section for premium users */}
      {access.canSeeTrending && dreams.filter(d => d.likeCount >= 5).length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Trending in {territoryInfo.name}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dreams
              .filter(d => d.likeCount >= 5)
              .slice(0, 4)
              .map((dream) => (
                <CommunityDreamCard
                  key={`trending-${dream.id}`}
                  dream={dream}
                  access={access}
                  onLike={() => handleLike(dream)}
                  onShare={() => handleShare(dream)}
                  isAdmin={userIsAdmin}
                  isTrending
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface CommunityDreamCardProps {
  dream: CommunityDream
  access: ReturnType<typeof getCommunityAccess>
  onLike: () => void
  onShare: () => void
  isAdmin?: boolean
  isTrending?: boolean
}

function CommunityDreamCard({
  dream,
  access,
  onLike,
  onShare,
  isAdmin,
  isTrending
}: CommunityDreamCardProps) {
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [localViewCount, setLocalViewCount] = useState(dream.viewCount)
  const [hasTrackedView, setHasTrackedView] = useState(false)

  const handleExpand = () => {
    if (!isExpanded && !hasTrackedView) {
      trackView(dream.id)
      setLocalViewCount(prev => prev + 1)
      setHasTrackedView(true)
    }
    setIsExpanded(!isExpanded)
  }

  return (
    <Card className={`
      overflow-hidden transition-all duration-300 group
      ${isTrending ? 'ring-2 ring-orange-500/30' : ''}
      ${isExpanded ? 'shadow-lg ring-1 ring-purple-500/20' : 'hover:shadow-md'}
    `}>
      {/* Image Header */}
      {dream.imageUrl && (
        <div 
          className="relative h-48 overflow-hidden cursor-pointer"
          onClick={handleExpand}
        >
          <img 
            src={dream.imageUrl} 
            alt={dream.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-serif text-lg text-white line-clamp-2">
              {dream.title}
            </h3>
          </div>
          {isTrending && (
            <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
              🔥 Trending
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      <CardContent 
        className={`
          ${dream.imageUrl ? 'pt-4' : 'pt-6'} 
          cursor-pointer
        `}
        onClick={handleExpand}
      >
        {!dream.imageUrl && (
          <h3 className="font-serif text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {dream.title}
          </h3>
        )}

        <div className="relative">
          <p className={`text-sm text-muted-foreground transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {dream.description}
          </p>
          {!isExpanded && dream.description.length > 100 && (
            <div className="text-xs text-purple-600 font-medium mt-1">Read more...</div>
          )}
        </div>

        {/* Interpretation preview - Only Section 1: Overall Meaning */}
        {dream.interpretation && (
          <div className={`
            mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800
            transition-all duration-500 overflow-hidden
            ${isExpanded ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 mt-0 py-0 border-0'}
          `}>
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">Overall Meaning</p>
            <p className="text-sm text-purple-800 dark:text-purple-300">
              {parseInterpretation(dream.interpretation).overallMeaning}
            </p>
          </div>
        )}

        {/* Footer with actions */}
        <div 
          className="flex items-center justify-between mt-4 pt-4 border-t"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            {/* Like button */}
            <button
              onClick={onLike}
              className={`
                flex items-center gap-1.5 text-sm transition-colors
                ${dream.hasLiked 
                  ? 'text-red-500' 
                  : 'text-muted-foreground hover:text-red-500'
                }
                ${!access.canLikeDreams ? 'opacity-50' : ''}
              `}
              disabled={!access.canLikeDreams}
            >
              <Heart className={`h-4 w-4 ${dream.hasLiked ? 'fill-current' : ''}`} />
              {dream.likeCount > 0 && <span>{dream.likeCount}</span>}
              {!access.canLikeDreams && <Lock className="h-3 w-3 ml-0.5" />}
            </button>

            {/* View count */}
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {localViewCount}
            </span>
          </div>

          {/* Share button - Only for Admin */}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}

          {/* Report button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReportDialog(true)}
            className="text-muted-foreground hover:text-red-500 gap-1.5 ml-auto"
          >
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Report</span>
          </Button>
        </div>

        {/* Author badge */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>
            {dream.isAnonymous ? 'Anonymous Dreamer' : (dream.authorDisplayName || 'Dreamer')}
          </span>
          <span>
            {new Date(dream.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>

      {/* Report dialog */}
      <ReportDreamDialog
        dreamId={dream.id}
        dreamTitle={dream.title}
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
      />
    </Card>
  )
}
