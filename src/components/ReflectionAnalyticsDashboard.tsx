/**
 * Reflection Analytics Dashboard Component
 * Provides visual analytics for reflection sessions
 * 
 * Phase 5 Implementation
 */

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  MessageSquare,
  Brain,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { blink } from '../blink/client'

interface ReflectionAnalyticsDashboardProps {
  userId: string
  compact?: boolean
}

interface AnalyticsData {
  totalSessions: number
  totalMessages: number
  averageSessionLength: number
  sessionsThisWeek: number
  sessionsThisMonth: number
  weeklyGrowth: number
  monthlyGrowth: number
  sessionsByType: Record<string, number>
  sessionsByDayOfWeek: Record<string, number>
  sessionsByTimeOfDay: Record<string, number>
  topEmotionalThemes: Array<{ theme: string; count: number }>
  recentActivity: Array<{ date: string; sessions: number }>
  insights: string[]
}

export function ReflectionAnalyticsDashboard({
  userId,
  compact = false
}: ReflectionAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        
        // Fetch all sessions
        const sessions = await blink.db.reflectionSessions.list({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          limit: 365
        })

        if (!sessions || sessions.length === 0) {
          setAnalytics({
            totalSessions: 0,
            totalMessages: 0,
            averageSessionLength: 0,
            sessionsThisWeek: 0,
            sessionsThisMonth: 0,
            weeklyGrowth: 0,
            monthlyGrowth: 0,
            sessionsByType: {},
            sessionsByDayOfWeek: {},
            sessionsByTimeOfDay: {},
            topEmotionalThemes: [],
            recentActivity: [],
            insights: ['Start your reflection journey to see analytics!']
          })
          return
        }

        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        // Calculate metrics
        const totalSessions = sessions.length
        const totalMessages = sessions.reduce((sum: number, s: any) => sum + (Number(s.messageCount) || 0), 0)
        const averageSessionLength = totalMessages / Math.max(1, totalSessions)

        // This week/month
        const sessionsThisWeek = sessions.filter((s: any) => new Date(s.createdAt) >= oneWeekAgo).length
        const sessionsLastWeek = sessions.filter((s: any) => {
          const date = new Date(s.createdAt)
          return date >= twoWeeksAgo && date < oneWeekAgo
        }).length
        const sessionsThisMonth = sessions.filter((s: any) => new Date(s.createdAt) >= oneMonthAgo).length
        const sessionsLastMonth = sessions.filter((s: any) => {
          const date = new Date(s.createdAt)
          return date >= twoMonthsAgo && date < oneMonthAgo
        }).length

        // Growth calculations
        const weeklyGrowth = sessionsLastWeek > 0 
          ? Math.round(((sessionsThisWeek - sessionsLastWeek) / sessionsLastWeek) * 100) 
          : 0
        const monthlyGrowth = sessionsLastMonth > 0 
          ? Math.round(((sessionsThisMonth - sessionsLastMonth) / sessionsLastMonth) * 100) 
          : 0

        // Group by type
        const sessionsByType: Record<string, number> = {}
        sessions.forEach((s: any) => {
          const type = s.sessionType || 'unknown'
          sessionsByType[type] = (sessionsByType[type] || 0) + 1
        })

        // Group by day of week
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const sessionsByDayOfWeek: Record<string, number> = {}
        dayNames.forEach(day => sessionsByDayOfWeek[day] = 0)
        sessions.forEach((s: any) => {
          const day = dayNames[new Date(s.createdAt).getDay()]
          sessionsByDayOfWeek[day]++
        })

        // Group by time of day
        const sessionsByTimeOfDay: Record<string, number> = {
          'Morning (5-12)': 0,
          'Afternoon (12-17)': 0,
          'Evening (17-21)': 0,
          'Night (21-5)': 0
        }
        sessions.forEach((s: any) => {
          const hour = new Date(s.createdAt).getHours()
          if (hour >= 5 && hour < 12) sessionsByTimeOfDay['Morning (5-12)']++
          else if (hour >= 12 && hour < 17) sessionsByTimeOfDay['Afternoon (12-17)']++
          else if (hour >= 17 && hour < 21) sessionsByTimeOfDay['Evening (17-21)']++
          else sessionsByTimeOfDay['Night (21-5)']++
        })

        // Get recent activity (last 14 days)
        const recentActivity: Array<{ date: string; sessions: number }> = []
        for (let i = 13; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const count = sessions.filter((s: any) => 
            s.createdAt.startsWith(dateStr)
          ).length
          recentActivity.push({ date: dateStr, sessions: count })
        }

        // Generate insights
        const insights: string[] = []
        const mostActiveDay = Object.entries(sessionsByDayOfWeek)
          .sort((a, b) => b[1] - a[1])[0]
        if (mostActiveDay[1] > 0) {
          insights.push(`You reflect most on ${mostActiveDay[0]}s`)
        }
        
        const preferredTime = Object.entries(sessionsByTimeOfDay)
          .sort((a, b) => b[1] - a[1])[0]
        if (preferredTime[1] > 0) {
          insights.push(`Your favorite reflection time is ${preferredTime[0].split(' ')[0].toLowerCase()}`)
        }

        if (weeklyGrowth > 20) {
          insights.push('Your reflection practice is growing! Keep it up! 🌱')
        } else if (weeklyGrowth < -30 && sessionsLastWeek > 0) {
          insights.push('Your reflection frequency dropped this week. Every session counts!')
        }

        if (averageSessionLength > 10) {
          insights.push('Your sessions are deeply engaged with high message counts')
        }

        setAnalytics({
          totalSessions,
          totalMessages,
          averageSessionLength,
          sessionsThisWeek,
          sessionsThisMonth,
          weeklyGrowth,
          monthlyGrowth,
          sessionsByType,
          sessionsByDayOfWeek,
          sessionsByTimeOfDay,
          topEmotionalThemes: [], // Would need message analysis
          recentActivity,
          insights
        })
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [userId])

  if (loading) {
    return (
      <Card className="border-primary/10">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) return null

  // Compact view for dashboard embedding
  if (compact) {
    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4 text-primary" />
            Reflection Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="text-2xl font-bold text-primary">{analytics.totalSessions}</div>
              <div className="text-xs text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="text-2xl font-bold text-primary">{analytics.sessionsThisWeek}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full analytics view
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Reflection Analytics
          </CardTitle>
          <CardDescription>
            Insights into your reflection journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Total Sessions"
                  value={analytics.totalSessions}
                  color="blue"
                />
                <MetricCard
                  icon={<Brain className="w-4 h-4" />}
                  label="Messages Exchanged"
                  value={analytics.totalMessages}
                  color="purple"
                />
                <MetricCard
                  icon={<Calendar className="w-4 h-4" />}
                  label="This Week"
                  value={analytics.sessionsThisWeek}
                  growth={analytics.weeklyGrowth}
                  color="green"
                />
                <MetricCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="This Month"
                  value={analytics.sessionsThisMonth}
                  growth={analytics.monthlyGrowth}
                  color="orange"
                />
              </div>

              {/* Recent Activity Chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Last 14 Days Activity</h4>
                <div className="flex items-end gap-1 h-24">
                  {analytics.recentActivity.map((day, idx) => (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${day.date}: ${day.sessions} sessions`}
                    >
                      <div 
                        className={`w-full rounded-t transition-all ${
                          day.sessions > 0 
                            ? 'bg-gradient-to-t from-primary to-accent' 
                            : 'bg-muted'
                        }`}
                        style={{ 
                          height: `${Math.max(4, (day.sessions / Math.max(...analytics.recentActivity.map(d => d.sessions), 1)) * 100)}%`,
                          minHeight: day.sessions > 0 ? '16px' : '4px'
                        }}
                      />
                      {idx % 2 === 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(day.date).getDate()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-6">
              {/* Session Types */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Session Types</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.sessionsByType).map(([type, count]) => {
                    const percentage = (count / analytics.totalSessions) * 100
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground">{count} ({Math.round(percentage)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Day of Week Distribution */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">By Day of Week</h4>
                <div className="flex justify-between gap-1">
                  {Object.entries(analytics.sessionsByDayOfWeek).map(([day, count]) => {
                    const maxCount = Math.max(...Object.values(analytics.sessionsByDayOfWeek))
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                    return (
                      <div key={day} className="flex-1 text-center space-y-1">
                        <div 
                          className={`mx-auto w-8 rounded transition-all ${
                            count > 0 ? 'bg-primary' : 'bg-muted'
                          }`}
                          style={{ height: `${Math.max(8, percentage * 0.6)}px` }}
                        />
                        <div className="text-xs font-medium">{day}</div>
                        <div className="text-xs text-muted-foreground">{count}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Time of Day Distribution */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">By Time of Day</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(analytics.sessionsByTimeOfDay).map(([time, count]) => (
                    <div 
                      key={time} 
                      className={`p-3 rounded-lg border text-center ${
                        count > 0 ? 'border-primary/30 bg-primary/5' : 'border-muted'
                      }`}
                    >
                      <Clock className={`w-4 h-4 mx-auto mb-1 ${
                        count > 0 ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="text-xs font-medium">{time.split(' ')[0]}</div>
                      <div className="text-lg font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="space-y-3">
                {analytics.insights.length > 0 ? (
                  analytics.insights.map((insight, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10"
                    >
                      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Keep reflecting to unlock personalized insights!</p>
                  </div>
                )}
              </div>

              {/* Summary Card */}
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Your Reflection Profile</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Average {analytics.averageSessionLength.toFixed(1)} messages per session</li>
                    <li>• {analytics.sessionsThisWeek} sessions in the last 7 days</li>
                    <li>• {analytics.totalSessions} total reflection sessions</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for metric cards
function MetricCard({ 
  icon, 
  label, 
  value, 
  growth,
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: number
  growth?: number
  color: 'blue' | 'purple' | 'green' | 'orange'
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-600 dark:text-green-400',
    orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400'
  }

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={colorClasses[color].split(' ').pop()}>
          {icon}
        </div>
        {growth !== undefined && growth !== 0 && (
          <Badge 
            variant="outline" 
            className={`text-xs ${growth > 0 ? 'text-green-600 border-green-500/50' : 'text-red-600 border-red-500/50'}`}
          >
            {growth > 0 ? '+' : ''}{growth}%
          </Badge>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
