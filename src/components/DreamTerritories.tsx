/**
 * Dream Territories - Card-based territory grid for community dreams
 * Replaces complex interactive map with simple, mobile-friendly cards
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { 
  Compass, 
  TrendingUp, 
  ChevronRight,
  Flame,
  Lock
} from 'lucide-react'
import { 
  DREAM_TERRITORIES, 
  type DreamTerritory, 
  type TerritoryStats,
  getCommunityAccess 
} from '../types/community'
import { getTerritoryStats } from '../utils/communityService'
import type { SubscriptionTier } from '../types/subscription'

interface DreamTerritoriesProps {
  subscriptionTier: SubscriptionTier
  onSelectTerritory: (territory: DreamTerritory) => void
}

export function DreamTerritories({
  subscriptionTier,
  onSelectTerritory
}: DreamTerritoriesProps) {
  const [stats, setStats] = useState<TerritoryStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const access = getCommunityAccess(subscriptionTier)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const territoryStats = await getTerritoryStats()
      setStats(territoryStats)
    } catch (error) {
      console.error('Error loading territory stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get all territories with their stats
  const territoriesWithStats = Object.values(DREAM_TERRITORIES)
    .filter(t => t.id !== 'general')
    .map(territory => ({
      ...territory,
      stats: stats.find(s => s.territory === territory.id) || {
        territory: territory.id,
        dreamCount: 0,
        topEmotions: [],
        trending: false
      }
    }))
    .sort((a, b) => b.stats.dreamCount - a.stats.dreamCount)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-serif">Dream Territories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-serif">Dream Territories</h2>
        </div>
        {!access.canViewCommunity && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Upgrade to explore
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground">
        Explore dreams by their symbolic territory. Each territory represents 
        common dream themes and archetypes shared by dreamers worldwide.
      </p>

      {/* Territory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {territoriesWithStats.map((territory) => (
          <TerritoryCard
            key={territory.id}
            territory={territory}
            dreamCount={territory.stats.dreamCount}
            isTrending={territory.stats.trending}
            canAccess={access.canViewCommunity}
            canSeeTrending={access.canSeeTrending}
            onClick={() => onSelectTerritory(territory.id)}
          />
        ))}
      </div>

      {/* Upgrade CTA for free users */}
      {!access.canLikeDreams && (
        <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shrink-0">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  Unlock Full Community Access
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to like dreams, see trending content, and share your own dreams 
                  with the community.
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                onClick={() => window.location.href = '/pricing'}
              >
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface TerritoryCardProps {
  territory: typeof DREAM_TERRITORIES[DreamTerritory]
  dreamCount: number
  isTrending: boolean
  canAccess: boolean
  canSeeTrending: boolean
  onClick: () => void
}

function TerritoryCard({
  territory,
  dreamCount,
  isTrending,
  canAccess,
  canSeeTrending,
  onClick
}: TerritoryCardProps) {
  return (
    <Card 
      className={`
        group cursor-pointer overflow-hidden transition-all duration-300
        hover:shadow-lg hover:-translate-y-1
        ${!canAccess ? 'opacity-60' : ''}
      `}
      onClick={canAccess ? onClick : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{territory.icon}</span>
            <h3 className="font-semibold text-lg">{territory.name}</h3>
          </div>
          {isTrending && canSeeTrending && (
            <Badge 
              variant="secondary" 
              className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 gap-1"
            >
              <Flame className="h-3 w-3" />
              Trending
            </Badge>
          )}
          {isTrending && !canSeeTrending && (
            <Badge variant="secondary" className="gap-1 opacity-50">
              <Lock className="h-3 w-3" />
              Trending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {territory.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {dreamCount.toLocaleString()} {dreamCount === 1 ? 'dream' : 'dreams'}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
        
        {/* Gradient bar at bottom */}
        <div 
          className={`
            h-1 w-full mt-4 rounded-full bg-gradient-to-r ${territory.gradient}
            opacity-50 group-hover:opacity-100 transition-opacity
          `}
        />
      </CardContent>
    </Card>
  )
}
