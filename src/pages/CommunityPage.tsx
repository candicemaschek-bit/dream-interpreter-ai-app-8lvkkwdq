/**
 * Community Page - Dream Territories and Community Feed
 */

import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/tooltip'
import { 
  ArrowLeft, 
  Compass, 
  TrendingUp, 
  Users,
  Sparkles
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DreamTerritories } from '../components/DreamTerritories'
import { CommunityDreamFeed } from '../components/CommunityDreamFeed'
import { DREAM_TERRITORIES, type DreamTerritory } from '../types/community'
import { getTrendingDreams, trackView } from '../utils/communityService'
import type { CommunityDream } from '../types/community'
import { parseInterpretation } from '../utils/interpretationParser'
import type { SubscriptionTier } from '../types/subscription'
import { blink } from '../blink/client'
import { getCommunityAccess } from '../types/community'
import { isAdmin } from '../utils/roleChecking'

export function CommunityPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTerritory, setSelectedTerritory] = useState<DreamTerritory | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free')
  const [trendingDreams, setTrendingDreams] = useState<CommunityDream[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userIsAdmin, setUserIsAdmin] = useState(false)

  const access = getCommunityAccess(subscriptionTier)

  useEffect(() => {
    loadUserData()
    
    // Check for territory in URL
    const territoryParam = searchParams.get('territory')
    if (territoryParam && territoryParam in DREAM_TERRITORIES) {
      setSelectedTerritory(territoryParam as DreamTerritory)
    }
  }, [searchParams])

  const loadUserData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load user profile for subscription tier
      const profiles = await blink.db.userProfiles.list({
        where: { userId: user.id }
      })
      
      if (profiles.length > 0) {
        setSubscriptionTier((profiles[0] as any).subscriptionTier || 'free')
      }

      // Check admin status
      const adminStatus = await isAdmin(user.id)
      setUserIsAdmin(adminStatus)

      // Load trending dreams
      const trending = await getTrendingDreams(user.id, 6)
      setTrendingDreams(trending)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTerritory = (territory: DreamTerritory) => {
    setSelectedTerritory(territory)
    setSearchParams({ territory })
  }

  const handleBack = () => {
    setSelectedTerritory(null)
    setSearchParams({})
  }

  // Show territory feed if one is selected
  if (selectedTerritory) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <CommunityDreamFeed
            territory={selectedTerritory}
            subscriptionTier={subscriptionTier}
            onBack={handleBack}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl md:text-4xl font-serif">Dreamstream</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Explore shared dreams, discover patterns, and connect with fellow dreamers
          </p>
        </div>

        <Tabs defaultValue="territories" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="territories" className="gap-2">
              <Compass className="h-4 w-4" />
              Territories
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="gap-2"
              disabled={!access.canSeeTrending}
            >
              <TrendingUp className="h-4 w-4" />
              Trending
              {!access.canSeeTrending && <span className="text-xs">(Pro+)</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="territories">
            <DreamTerritories
              subscriptionTier={subscriptionTier}
              onSelectTerritory={handleSelectTerritory}
            />
          </TabsContent>

          <TabsContent value="trending">
            {access.canSeeTrending ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                  <h2 className="text-2xl font-serif">Trending Dreams</h2>
                </div>
                
                {trendingDreams.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto text-purple-300 mb-4" />
                    <h3 className="text-xl font-serif mb-2">No Trending Dreams Yet</h3>
                    <p className="text-muted-foreground">
                      Be among the first to share dreams and see them trend!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendingDreams.map(dream => (
                      <TrendingDreamCard key={dream.id} dream={dream} isAdmin={userIsAdmin} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-serif mb-2">Upgrade to See Trending</h3>
                <p className="text-muted-foreground mb-4">
                  Visionary tier and above can access trending dreams
                </p>
                <Button onClick={() => navigate('/pricing')}>
                  View Plans
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

import { Share2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

function TrendingDreamCard({ dream, isAdmin }: { dream: CommunityDream; isAdmin: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localViewCount, setLocalViewCount] = useState(dream.viewCount)
  const [hasTrackedView, setHasTrackedView] = useState(false)

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/dream/${dream.dreamId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard!')
  }

  const handleExpand = () => {
    if (!isExpanded && !hasTrackedView) {
      trackView(dream.id)
      setLocalViewCount(prev => prev + 1)
      setHasTrackedView(true)
    }
    setIsExpanded(!isExpanded)
  }

  return (
    <div 
      className={`rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 relative group cursor-pointer ${isExpanded ? 'ring-1 ring-purple-500/20' : ''}`}
      onClick={handleExpand}
    >
      {dream.imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img 
            src={dream.imageUrl} 
            alt={dream.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
            🔥 {dream.likeCount} likes
          </Badge>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-serif text-lg mb-2 group-hover:text-purple-600 transition-colors">{dream.title}</h3>
        <p className={`text-sm text-muted-foreground transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'} mb-4`}>
          {dream.description}
        </p>

        {/* Interpretation preview - Only Section 1: Overall Meaning */}
        {dream.interpretation && (
          <div className={`
            mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800
            transition-all duration-500 overflow-hidden
            ${isExpanded ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 mt-0 py-0 border-0'}
          `}>
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">Overall Meaning</p>
            <p className="text-sm text-purple-800 dark:text-purple-300 italic">
              {parseInterpretation(dream.interpretation).overallMeaning}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-3">
             <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {localViewCount}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(dream.createdAt).toLocaleDateString()}
            </span>
          </div>

          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}