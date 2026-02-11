/**
 * Reflection Streak Indicator Component
 * Shows current reflection streak and provides streak notifications
 * 
 * Phase 2 Implementation
 */

import { useState, useEffect } from 'react'
import { Flame, Trophy, Calendar, TrendingUp, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { ShareStreakButton } from './ShareInsightButton'
import {
  calculateReflectionStreak,
  getStreakNotification,
  analyzeEmotionalPatterns,
  getSessionFrequencyInsights,
  type ReflectionStreak,
  type StreakNotification
} from '../utils/reflectAIPatterns'

interface ReflectionStreakIndicatorProps {
  userId: string
  compact?: boolean
  showInsights?: boolean
  onStreakChange?: (streak: ReflectionStreak) => void
}

export function ReflectionStreakIndicator({
  userId,
  compact = false,
  showInsights = true,
  onStreakChange
}: ReflectionStreakIndicatorProps) {
  const navigate = useNavigate()
  const [streak, setStreak] = useState<ReflectionStreak | null>(null)
  const [notification, setNotification] = useState<StreakNotification | null>(null)
  const [emotionalInsights, setEmotionalInsights] = useState<{
    dominantEmotions: string[]
    emotionalTrend: string
    insight: string
  } | null>(null)
  const [frequencyInsights, setFrequencyInsights] = useState<{
    averageSessionsPerWeek: number
    preferredTimeOfDay: string
    mostActiveDay: string
    consistency: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotification, setShowNotification] = useState(true)

  useEffect(() => {
    const loadStreakData = async () => {
      try {
        setLoading(true)
        
        // Load streak data
        const streakData = await calculateReflectionStreak(userId)
        setStreak(streakData)
        onStreakChange?.(streakData)
        
        // Get notification if any
        const streakNotification = getStreakNotification(streakData)
        setNotification(streakNotification)

        // Load insights if requested
        if (showInsights) {
          const [emotional, frequency] = await Promise.all([
            analyzeEmotionalPatterns(userId),
            getSessionFrequencyInsights(userId)
          ])
          setEmotionalInsights(emotional)
          setFrequencyInsights(frequency)
        }
      } catch (error) {
        console.error('Error loading streak data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStreakData()
  }, [userId, showInsights, onStreakChange])

  // Show toast notification for milestones and at-risk streaks
  useEffect(() => {
    if (notification && showNotification) {
      if (notification.type === 'milestone') {
        toast.success(notification.title, {
          description: notification.message,
          duration: 6000
        })
      } else if (notification.type === 'at_risk') {
        toast.warning(notification.title, {
          description: notification.message,
          duration: 8000,
          action: {
            label: notification.actionLabel || 'Reflect',
            onClick: () => navigate('/reflect-ai')
          }
        })
      }
      setShowNotification(false) // Only show once per load
    }
  }, [notification, showNotification, navigate])

  if (loading) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-4'}>
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!streak) return null

  // Compact view for sidebar/header
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className={`p-2 rounded-full ${streak.currentStreak > 0 ? 'bg-orange-500/20' : 'bg-muted'}`}>
          <Flame className={`w-4 h-4 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {streak.currentStreak > 0 ? `${streak.currentStreak} Day Streak` : 'Start a Streak'}
          </span>
          <span className="text-xs text-muted-foreground">
            {streak.totalSessions} total sessions
          </span>
        </div>
        {streak.currentStreak >= 7 && (
          <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            🔥
          </Badge>
        )}
      </div>
    )
  }

  // Full view with insights
  return (
    <div className="space-y-4">
      {/* Main Streak Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              Reflection Streak
            </div>
            {streak.currentStreak >= 3 && (
              <ShareStreakButton streakDays={streak.currentStreak} />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Current Streak */}
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-2xl font-bold text-orange-500">{streak.currentStreak}</span>
              </div>
              <span className="text-xs text-muted-foreground">Current Streak</span>
            </div>

            {/* Best Streak */}
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-500">{streak.longestStreak}</span>
              </div>
              <span className="text-xs text-muted-foreground">Best Streak</span>
            </div>

            {/* This Week */}
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-500">{streak.sessionsThisWeek}</span>
              </div>
              <span className="text-xs text-muted-foreground">This Week</span>
            </div>

            {/* Total Sessions */}
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-2xl font-bold text-purple-500">{streak.totalSessions}</span>
              </div>
              <span className="text-xs text-muted-foreground">Total Sessions</span>
            </div>
          </div>

          {/* Notification Banner */}
          {notification && (
            <div className={`mt-4 p-3 rounded-lg ${
              notification.type === 'milestone' 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20'
                : notification.type === 'at_risk'
                ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20'
                : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                </div>
                {notification.actionLabel && (
                  <Button
                    size="sm"
                    onClick={() => navigate('/reflect-ai')}
                    className="ml-3 shrink-0"
                  >
                    {notification.actionLabel}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Section */}
      {showInsights && (emotionalInsights || frequencyInsights) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Emotional Patterns */}
          {emotionalInsights && emotionalInsights.dominantEmotions.length > 0 && (
            <Card className="border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Emotional Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {emotionalInsights.dominantEmotions.map((emotion, idx) => (
                    <Badge 
                      key={emotion} 
                      variant="secondary"
                      className={idx === 0 ? 'bg-primary/20 text-primary' : ''}
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
                <div className={`text-xs p-2 rounded ${
                  emotionalInsights.emotionalTrend === 'improving' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
                  emotionalInsights.emotionalTrend === 'challenging' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400' :
                  'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                }`}>
                  {emotionalInsights.insight}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Frequency */}
          {frequencyInsights && frequencyInsights.averageSessionsPerWeek > 0 && (
            <Card className="border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-primary" />
                  Session Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. per week:</span>
                    <span className="font-medium">{frequencyInsights.averageSessionsPerWeek} sessions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preferred time:</span>
                    <span className="font-medium capitalize">{frequencyInsights.preferredTimeOfDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Most active day:</span>
                    <span className="font-medium">{frequencyInsights.mostActiveDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Consistency:</span>
                    <Badge variant={
                      frequencyInsights.consistency === 'high' ? 'default' :
                      frequencyInsights.consistency === 'medium' ? 'secondary' : 'outline'
                    }>
                      {frequencyInsights.consistency}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
