/**
 * ReflectAI Pattern Recognition System
 * Tracks reflection session patterns, streaks, and generates insights
 * 
 * Phase 2 Implementation:
 * - Pattern detection across reflection sessions
 * - Streak tracking and notifications
 * - Emotional theme analysis
 */

import { blink } from '../blink/client'

export interface ReflectionPattern {
  userId: string
  patternType: 'emotional_trend' | 'symbol_frequency' | 'theme_evolution' | 'session_frequency'
  description: string
  confidence: number // 0-1
  relatedSessions: string[]
  detectedAt: string
}

export interface ReflectionStreak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastSessionDate: string
  streakStartDate: string
  totalSessions: number
  sessionsThisWeek: number
  sessionsThisMonth: number
}

export interface StreakNotification {
  type: 'milestone' | 'at_risk' | 'broken' | 'encouragement'
  title: string
  message: string
  streakDays: number
  actionLabel?: string
}

/**
 * Calculate reflection streak for a user
 */
export async function calculateReflectionStreak(userId: string): Promise<ReflectionStreak> {
  try {
    // Fetch all sessions ordered by date
    const sessions = await blink.db.reflectionSessions.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 365 // Up to a year of data
    })

    if (!sessions || sessions.length === 0) {
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: '',
        streakStartDate: '',
        totalSessions: 0,
        sessionsThisWeek: 0,
        sessionsThisMonth: 0
      }
    }

    const now = new Date()
    const today = now.toDateString()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get unique session dates
    const sessionDates = [...new Set(
      sessions.map((s: any) => new Date(s.createdAt).toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    // Calculate current streak
    let currentStreak = 0
    let streakStartDate = ''
    let currentDate = new Date()
    
    // Check if there's a session today or yesterday to start counting
    const lastSessionDate = sessionDates[0]
    const daysSinceLastSession = Math.floor(
      (currentDate.getTime() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // If last session was more than 1 day ago, streak is broken
    if (daysSinceLastSession > 1) {
      currentStreak = 0
      streakStartDate = ''
    } else {
      // Count consecutive days
      for (let i = 0; i < sessionDates.length; i++) {
        const sessionDate = new Date(sessionDates[i])
        const expectedDate = new Date(currentDate)
        expectedDate.setDate(expectedDate.getDate() - currentStreak)
        
        const dayDiff = Math.abs(
          Math.floor((sessionDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
        )
        
        if (dayDiff <= 1) {
          currentStreak++
          streakStartDate = sessionDates[i]
        } else {
          break
        }
      }
    }

    // Calculate longest streak ever
    let longestStreak = currentStreak
    let tempStreak = 1
    for (let i = 1; i < sessionDates.length; i++) {
      const prevDate = new Date(sessionDates[i - 1])
      const currDate = new Date(sessionDates[i])
      const dayDiff = Math.floor(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (dayDiff === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    // Count sessions this week/month
    const sessionsThisWeek = sessions.filter((s: any) => 
      new Date(s.createdAt) >= oneWeekAgo
    ).length

    const sessionsThisMonth = sessions.filter((s: any) => 
      new Date(s.createdAt) >= oneMonthAgo
    ).length

    return {
      userId,
      currentStreak,
      longestStreak,
      lastSessionDate: lastSessionDate || '',
      streakStartDate,
      totalSessions: sessions.length,
      sessionsThisWeek,
      sessionsThisMonth
    }
  } catch (error) {
    console.error('Error calculating reflection streak:', error)
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: '',
      streakStartDate: '',
      totalSessions: 0,
      sessionsThisWeek: 0,
      sessionsThisMonth: 0
    }
  }
}

/**
 * Get streak notification based on current state
 */
export function getStreakNotification(streak: ReflectionStreak): StreakNotification | null {
  const now = new Date()
  const lastSession = streak.lastSessionDate ? new Date(streak.lastSessionDate) : null
  const hoursSinceLastSession = lastSession 
    ? (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60)
    : Infinity

  // Milestone notifications (3, 7, 14, 30, 60, 100 days)
  const milestones = [3, 7, 14, 30, 60, 100]
  for (const milestone of milestones) {
    if (streak.currentStreak === milestone) {
      return {
        type: 'milestone',
        title: `🎉 ${milestone}-Day Streak!`,
        message: getMilestoneMessage(milestone),
        streakDays: streak.currentStreak,
        actionLabel: 'Continue Reflecting'
      }
    }
  }

  // At-risk notification (18-24 hours without session, has active streak)
  if (streak.currentStreak > 0 && hoursSinceLastSession >= 18 && hoursSinceLastSession < 24) {
    return {
      type: 'at_risk',
      title: '⏰ Streak at Risk!',
      message: `Your ${streak.currentStreak}-day reflection streak is at risk! Take a few minutes to reflect and keep your momentum going.`,
      streakDays: streak.currentStreak,
      actionLabel: 'Reflect Now'
    }
  }

  // Broken streak notification (had a streak, now at 0)
  if (streak.currentStreak === 0 && streak.longestStreak > 2 && hoursSinceLastSession < 72) {
    return {
      type: 'broken',
      title: '💫 Start Fresh',
      message: `Your ${streak.longestStreak}-day streak ended, but every journey has pauses. Ready to start a new reflection chapter?`,
      streakDays: 0,
      actionLabel: 'Begin Again'
    }
  }

  // Encouragement for new users or returning after break
  if (streak.totalSessions > 0 && streak.totalSessions < 5 && streak.currentStreak > 0) {
    return {
      type: 'encouragement',
      title: '🌱 Building Momentum',
      message: `Day ${streak.currentStreak} of your reflection journey! Each session deepens your self-understanding.`,
      streakDays: streak.currentStreak
    }
  }

  return null
}

/**
 * Get milestone message based on streak days
 */
function getMilestoneMessage(days: number): string {
  const messages: Record<number, string> = {
    3: "Three days of consistent reflection! You're building a powerful self-discovery habit.",
    7: "A full week of reflection! Your commitment to understanding yourself is inspiring.",
    14: "Two weeks of daily reflection! You're developing deep self-awareness patterns.",
    30: "One month of reflection! This dedication to your inner journey is remarkable.",
    60: "Two months of reflection mastery! You've truly made self-discovery part of your life.",
    100: "100 days of reflection! You're a true champion of self-understanding. Incredible!"
  }
  return messages[days] || `${days} days of reflection! Keep going!`
}

/**
 * Analyze emotional themes across reflection sessions
 */
export async function analyzeEmotionalPatterns(
  userId: string,
  sessionLimit: number = 20
): Promise<{
  dominantEmotions: string[]
  emotionalTrend: 'improving' | 'stable' | 'challenging' | 'mixed'
  insight: string
}> {
  try {
    // Get recent sessions
    const sessions = await blink.db.reflectionSessions.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: sessionLimit
    })

    if (!sessions || sessions.length < 3) {
      return {
        dominantEmotions: [],
        emotionalTrend: 'stable',
        insight: 'Keep reflecting to discover your emotional patterns.'
      }
    }

    // Get messages from these sessions to analyze emotional tags
    const sessionIds = sessions.map((s: any) => s.id)
    const allMessages: any[] = []
    
    for (const sessionId of sessionIds.slice(0, 10)) {
      const messages = await blink.db.reflectionMessages.list({
        where: { sessionId },
        limit: 50
      })
      allMessages.push(...messages)
    }

    // Extract emotional tags
    const emotionCounts: Record<string, number> = {}
    for (const msg of allMessages) {
      if (msg.emotionalTags) {
        try {
          const tags = typeof msg.emotionalTags === 'string' 
            ? JSON.parse(msg.emotionalTags) 
            : msg.emotionalTags
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              emotionCounts[tag.toLowerCase()] = (emotionCounts[tag.toLowerCase()] || 0) + 1
            })
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Get top emotions
    const sortedEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion]) => emotion)

    // Determine emotional trend based on common emotion types
    const positiveEmotions = ['happy', 'joy', 'peace', 'calm', 'excited', 'hopeful', 'grateful', 'content']
    const challengingEmotions = ['anxious', 'sad', 'fear', 'angry', 'confused', 'overwhelmed', 'stressed']
    
    const positiveCount = sortedEmotions.filter(e => 
      positiveEmotions.some(p => e.includes(p))
    ).length
    const challengingCount = sortedEmotions.filter(e => 
      challengingEmotions.some(c => e.includes(c))
    ).length

    let emotionalTrend: 'improving' | 'stable' | 'challenging' | 'mixed'
    let insight: string

    if (positiveCount > challengingCount * 2) {
      emotionalTrend = 'improving'
      insight = 'Your reflections show a positive emotional pattern. This could suggest your self-exploration is bringing valuable insights.'
    } else if (challengingCount > positiveCount * 2) {
      emotionalTrend = 'challenging'
      insight = 'Your reflections are touching on challenging emotions. This is often where the deepest growth happens. Consider speaking with a professional if these feelings persist.'
    } else if (positiveCount === 0 && challengingCount === 0) {
      emotionalTrend = 'stable'
      insight = 'Continue your reflection journey to discover patterns in your emotional landscape.'
    } else {
      emotionalTrend = 'mixed'
      insight = 'Your reflections show a mix of emotions - this is natural and healthy. Life contains multitudes!'
    }

    return {
      dominantEmotions: sortedEmotions,
      emotionalTrend,
      insight
    }
  } catch (error) {
    console.error('Error analyzing emotional patterns:', error)
    return {
      dominantEmotions: [],
      emotionalTrend: 'stable',
      insight: 'Keep reflecting to discover your emotional patterns.'
    }
  }
}

/**
 * Get session frequency insights
 */
export async function getSessionFrequencyInsights(
  userId: string
): Promise<{
  averageSessionsPerWeek: number
  preferredTimeOfDay: string
  mostActiveDay: string
  consistency: 'high' | 'medium' | 'low'
}> {
  try {
    const sessions = await blink.db.reflectionSessions.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 100
    })

    if (!sessions || sessions.length < 3) {
      return {
        averageSessionsPerWeek: 0,
        preferredTimeOfDay: 'evening',
        mostActiveDay: 'Sunday',
        consistency: 'low'
      }
    }

    // Calculate average sessions per week
    const firstSession = new Date(sessions[sessions.length - 1].createdAt)
    const lastSession = new Date(sessions[0].createdAt)
    const weeksDiff = Math.max(1, (lastSession.getTime() - firstSession.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const averageSessionsPerWeek = Math.round((sessions.length / weeksDiff) * 10) / 10

    // Find preferred time of day
    const hourCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 }
    sessions.forEach((s: any) => {
      const hour = new Date(s.createdAt).getHours()
      if (hour >= 5 && hour < 12) hourCounts.morning++
      else if (hour >= 12 && hour < 17) hourCounts.afternoon++
      else if (hour >= 17 && hour < 21) hourCounts.evening++
      else hourCounts.night++
    })
    const preferredTimeOfDay = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0][0]

    // Find most active day
    const dayCounts: Record<string, number> = {}
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    sessions.forEach((s: any) => {
      const day = dayNames[new Date(s.createdAt).getDay()]
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    const mostActiveDay = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])[0][0]

    // Determine consistency
    let consistency: 'high' | 'medium' | 'low'
    if (averageSessionsPerWeek >= 5) consistency = 'high'
    else if (averageSessionsPerWeek >= 2) consistency = 'medium'
    else consistency = 'low'

    return {
      averageSessionsPerWeek,
      preferredTimeOfDay,
      mostActiveDay,
      consistency
    }
  } catch (error) {
    console.error('Error getting session frequency insights:', error)
    return {
      averageSessionsPerWeek: 0,
      preferredTimeOfDay: 'evening',
      mostActiveDay: 'Sunday',
      consistency: 'low'
    }
  }
}

/**
 * Store reflection pattern in database (for future AI analysis)
 */
export async function saveReflectionPattern(pattern: ReflectionPattern): Promise<void> {
  try {
    await blink.db.patternInsights.create({
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: pattern.userId,
      insightType: pattern.patternType,
      title: pattern.patternType.replace(/_/g, ' '),
      description: pattern.description,
      confidence: pattern.confidence,
      supportingDreams: JSON.stringify(pattern.relatedSessions) as any,
      generatedAt: pattern.detectedAt,
      createdAt: pattern.detectedAt,
      updatedAt: pattern.detectedAt
    })
  } catch (error) {
    console.error('Error saving reflection pattern:', error)
  }
}
