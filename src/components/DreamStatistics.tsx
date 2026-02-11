import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { blink } from '../blink/client'
import { Brain, RefreshCw, TrendingUp, Zap, ChevronDown, ChevronUp, Crown, Sparkles } from 'lucide-react'
import { DreamStatistics as Stats } from '../types/profile'
import { Dream } from '../types/dream'
import { castDreams } from '../utils/databaseCast'
import { getNightmarePatternSummary, getRecurringCycles } from '../utils/dreamPatternTracking'
import type { SubscriptionTier } from '../types/subscription'

interface DreamTrendsProps {
  subscriptionTier?: string
}

export function DreamStatistics({ subscriptionTier = 'free' }: DreamTrendsProps = {}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllThemes, setShowAllThemes] = useState(false)
  const [nightmarePattern, setNightmarePattern] = useState<any>(null)
  const [recurringCycles, setRecurringCycles] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    loadStatistics()
  }, [])

  useEffect(() => {
    // Load advanced pattern data for premium/vip users
    if (userId && (subscriptionTier === 'premium' || subscriptionTier === 'vip')) {
      loadAdvancedPatterns()
    }
  }, [userId, subscriptionTier])

  const loadAdvancedPatterns = async () => {
    try {
      const nightmare = await getNightmarePatternSummary(userId, subscriptionTier as SubscriptionTier)
      const cycles = await getRecurringCycles(userId, subscriptionTier as SubscriptionTier)
      setNightmarePattern(nightmare)
      setRecurringCycles(cycles)
    } catch (error) {
      console.error('Error loading advanced patterns:', error)
    }
  }

  const loadStatistics = async () => {
    try {
      const user = await blink.auth.me()
      setUserId(user.id)
      
      // Fetch all user dreams
      const dreamRows = await blink.db.dreams.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      const dreams = castDreams(dreamRows)

      // Calculate statistics
      const totalDreams = dreams.length
      
      // Count nightmares and recurring dreams
      let nightmareCount = 0
      let recurringCount = 0
      
      dreams.forEach((dream: Dream) => {
        if (dream.tags) {
          const tags = typeof dream.tags === 'string' ? JSON.parse(dream.tags) : dream.tags
          if (tags.some((tag: string) => tag.toLowerCase().includes('nightmare') || tag.toLowerCase().includes('fear'))) {
            nightmareCount++
          }
          if (tags.some((tag: string) => tag.toLowerCase().includes('recurring'))) {
            recurringCount++
          }
        }
      })

      // Extract and count themes from tags
      const themeCount: Record<string, number> = {}
      dreams.forEach((dream: Dream) => {
        if (dream.tags) {
          const tags = typeof dream.tags === 'string' ? JSON.parse(dream.tags) : dream.tags
          tags.forEach((tag: string) => {
            themeCount[tag] = (themeCount[tag] || 0) + 1
          })
        }
      })

      // Get top themes
      const topThemes = Object.entries(themeCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([theme, count]) => ({ theme, count }))

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentActivity: Record<string, number> = {}
      dreams.forEach((dream: Dream) => {
        const dreamDate = new Date(dream.createdAt)
        if (dreamDate >= thirtyDaysAgo) {
          const dateKey = dreamDate.toISOString().split('T')[0]
          recentActivity[dateKey] = (recentActivity[dateKey] || 0) + 1
        }
      })

      const recentActivityArray = Object.entries(recentActivity)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setStats({
        totalDreams,
        nightmareCount,
        recurringCount,
        topThemes,
        recentActivity: recentActivityArray
      })
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dream Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading your dream insights...</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.totalDreams === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dream Trends</CardTitle>
          <CardDescription>Start recording dreams to see your patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your dream trends will appear here once you've interpreted a few dreams.</p>
        </CardContent>
      </Card>
    )
  }

  const isFreeTier = subscriptionTier === 'free'

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Dreams</p>
                <p className="text-2xl font-bold">{stats.totalDreams}</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nightmares</p>
                <p className="text-2xl font-bold">{stats.nightmareCount}</p>
              </div>
              <img src="/logo_new.png" alt="Nightmares" className="h-8 w-8 opacity-50 grayscale" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recurring</p>
                <p className="text-2xl font-bold">{stats.recurringCount}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Themes</p>
                <p className="text-2xl font-bold">{stats.topThemes.length}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Common Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Common Dream Themes
          </CardTitle>
          <CardDescription>
            Your most frequent dream symbols and patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.topThemes.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {stats.topThemes.slice(0, showAllThemes ? undefined : 5).map((theme) => (
                  <Badge key={theme.theme} variant="secondary" className="text-sm py-1 px-3">
                    {theme.theme}
                    <span className="ml-2 text-xs text-muted-foreground">×{theme.count}</span>
                  </Badge>
                ))}
              </div>
              {stats.topThemes.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllThemes(!showAllThemes)}
                  className="w-full"
                >
                  {showAllThemes ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show {stats.topThemes.length - 5} more themes
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No themes detected yet. Keep recording dreams!</p>
          )}
        </CardContent>
      </Card>

      {/* Dream Insights - Intelligent tracking for all tiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dream Insights</CardTitle>
              <CardDescription>
                {(subscriptionTier === 'premium' || subscriptionTier === 'vip') 
                  ? 'AI-powered cycle detection and psychological insights'
                  : 'Track your nightmare and recurring dream patterns'}
              </CardDescription>
            </div>
            {(subscriptionTier === 'premium' || subscriptionTier === 'vip') && (
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100">
                <Crown className="w-3 h-3 mr-1" />
                Advanced Tracking
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nightmare Insights */}
          {stats.nightmareCount > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                <img src="/logo_new.png" alt="Icon" className="w-4 h-4 opacity-50 grayscale" />
                Nightmare Pattern Detected
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                You've experienced {stats.nightmareCount} nightmare(s) recently.
              </p>
              
              {/* Advanced nightmare insights for premium/vip */}
              {nightmarePattern && (subscriptionTier === 'premium' || subscriptionTier === 'vip') && (
                <div className="mt-3 space-y-2 border-t border-red-200 dark:border-red-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-semibold text-red-800 dark:text-red-200">Advanced Pattern Analysis</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      <strong>Frequency:</strong> {nightmarePattern.frequency.toFixed(1)} nightmares/month
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      <strong>Intensity Level:</strong> {nightmarePattern.emotionalIntensity}
                    </p>
                    {nightmarePattern.commonThemes.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">Common Themes:</p>
                        <div className="flex flex-wrap gap-1">
                          {nightmarePattern.commonThemes.slice(0, 3).map((theme: any) => (
                            <Badge key={theme.theme} variant="outline" className="text-xs border-red-300">
                              {theme.theme} ({theme.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {nightmarePattern.triggerPatterns && nightmarePattern.triggerPatterns.length > 0 && (
                      <p className="text-xs text-red-700 dark:text-red-300 italic mt-2">
                        💡 {nightmarePattern.triggerPatterns[0]}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Basic recommendations for all tiers */}
              {!nightmarePattern && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  💡 Consider stress management techniques and maintaining a consistent sleep schedule.
                </p>
              )}
            </div>
          )}

          {/* Recurring Dream Insights */}
          {stats.recurringCount > 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Recurring Dream Pattern
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                You've had {stats.recurringCount} recurring dream(s).
              </p>
              
              {/* Advanced recurring insights for premium/vip */}
              {recurringCycles.length > 0 && (subscriptionTier === 'premium' || subscriptionTier === 'vip') && (
                <div className="mt-3 space-y-3 border-t border-orange-200 dark:border-orange-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <p className="text-xs font-semibold text-orange-800 dark:text-orange-200">Detected Cycles</p>
                  </div>
                  {recurringCycles.slice(0, 2).map((cycle: any) => (
                    <div key={cycle.cycleId} className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded border border-orange-200 dark:border-orange-700 space-y-1">
                      <p className="text-xs text-orange-900 dark:text-orange-100">
                        <strong>Occurrences:</strong> {cycle.occurrenceCount} times
                      </p>
                      {cycle.averageInterval > 0 && (
                        <p className="text-xs text-orange-900 dark:text-orange-100">
                          <strong>Cycle:</strong> Every {cycle.averageInterval.toFixed(0)} days
                        </p>
                      )}
                      {cycle.commonElements.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">Elements:</p>
                          <div className="flex flex-wrap gap-1">
                            {cycle.commonElements.slice(0, 4).map((element: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs border-orange-300">
                                {element}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {cycle.psychologicalInsight && subscriptionTier === 'vip' && (
                        <p className="text-xs text-orange-700 dark:text-orange-300 italic mt-2 pt-2 border-t border-orange-200">
                          🧠 {cycle.psychologicalInsight}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Basic recommendations for all tiers */}
              {recurringCycles.length === 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  💡 Recurring dreams often indicate unresolved issues. Keep tracking to identify patterns.
                </p>
              )}
            </div>
          )}

          {/* Upgrade CTA for free/pro users */}
          {(subscriptionTier === 'free' || subscriptionTier === 'pro') && (stats.nightmareCount > 0 || stats.recurringCount > 0) && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">
                    Unlock Advanced Pattern Detection
                  </h4>
                  <p className="text-sm text-purple-700 mb-3">
                    Premium & VIP members get AI-powered cycle detection, frequency analysis, and personalized psychological insights about their nightmare and recurring dream patterns.
                  </p>
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              </div>
            </div>
          )}

          {stats.nightmareCount === 0 && stats.recurringCount === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No nightmare or recurring dream patterns detected yet. Keep recording your dreams to see insights appear here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
