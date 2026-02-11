/**
 * Engagement Tracking Database Operations
 * Tracks user engagement metrics for behavior analysis
 */

import { blink } from '../blink/client';

export interface EngagementRecord {
  id?: string;
  userId: string;
  trigger: string;
  messageShown: string;
  timestamp: string;
  userInteraction: 'clicked' | 'dismissed' | 'auto_closed' | 'no_interaction';
  featureExplored?: string;
  timeToInteraction?: number; // milliseconds
}

export interface UserEngagementMetrics {
  userId: string;
  totalMessagesShown: number;
  totalMessagesInteracted: number;
  interactionRate: number;
  lastEngagementAt: string;
  engagementStreak: number;
  mostEffectiveTriggers: string[];
}

/**
 * Create engagement tracking schema
 * Run this once to initialize the table
 */
export async function initializeEngagementSchema(): Promise<void> {
  try {
    // The table will be created via migration/seeding
    // For now, we use application-level tracking
    console.log('Engagement schema initialized');
  } catch (error) {
    console.error('Failed to initialize engagement schema:', error);
  }
}

/**
 * Log an engagement event
 */
export async function logEngagementEvent(record: Omit<EngagementRecord, 'id'>): Promise<EngagementRecord | null> {
  try {
    const data = {
      user_id: record.userId,
      trigger: record.trigger,
      message_shown: record.messageShown,
      timestamp: record.timestamp,
      user_interaction: record.userInteraction,
      feature_explored: record.featureExplored || null,
      time_to_interaction: record.timeToInteraction || null
    };

    // Since we don't have a dedicated engagement_logs table yet,
    // we'll store in localStorage for now and sync with backend
    const engagementLogs = JSON.parse(localStorage.getItem('dreamcatcher_engagement_logs') || '[]');
    engagementLogs.push(data);
    localStorage.setItem('dreamcatcher_engagement_logs', JSON.stringify(engagementLogs));

    return {
      ...record,
      id: crypto.randomUUID?.() || Date.now().toString()
    };
  } catch (error) {
    console.error('Failed to log engagement event:', error);
    return null;
  }
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagementMetrics(userId: string): Promise<UserEngagementMetrics | null> {
  try {
    const engagementLogs = JSON.parse(localStorage.getItem('dreamcatcher_engagement_logs') || '[]');
    const userLogs = engagementLogs.filter((log: any) => log.user_id === userId);

    if (userLogs.length === 0) {
      return {
        userId,
        totalMessagesShown: 0,
        totalMessagesInteracted: 0,
        interactionRate: 0,
        lastEngagementAt: new Date().toISOString(),
        engagementStreak: 0,
        mostEffectiveTriggers: []
      };
    }

    const interactedCount = userLogs.filter(
      (log: any) => log.user_interaction !== 'auto_closed' && log.user_interaction !== 'no_interaction'
    ).length;

    const triggerCounts: Record<string, number> = {};
    userLogs.forEach((log: any) => {
      triggerCounts[log.trigger] = (triggerCounts[log.trigger] || 0) + 1;
    });

    const mostEffectiveTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([trigger]) => trigger);

    const lastLog = userLogs[userLogs.length - 1];
    const lastEngagementAt = lastLog?.timestamp || new Date().toISOString();

    return {
      userId,
      totalMessagesShown: userLogs.length,
      totalMessagesInteracted: interactedCount,
      interactionRate: userLogs.length > 0 ? (interactedCount / userLogs.length) * 100 : 0,
      lastEngagementAt,
      engagementStreak: calculateEngagementStreak(userLogs),
      mostEffectiveTriggers
    };
  } catch (error) {
    console.error('Failed to get engagement metrics:', error);
    return null;
  }
}

/**
 * Calculate engagement streak from logs
 */
function calculateEngagementStreak(logs: any[]): number {
  if (logs.length === 0) return 0;

  let streak = 0;
  const today = new Date().toDateString();
  const seenDates = new Set<string>();

  logs.forEach((log: any) => {
    const logDate = new Date(log.timestamp).toDateString();
    seenDates.add(logDate);
  });

  const dates = Array.from(seenDates).sort().reverse();
  let currentDate = new Date();

  for (const date of dates) {
    const compareDate = new Date(date);
    const diff = (currentDate.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diff <= 1) {
      streak++;
      currentDate = compareDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Track engagement interaction
 */
export async function trackEngagementInteraction(
  userId: string,
  trigger: string,
  interaction: 'clicked' | 'dismissed' | 'auto_closed' | 'no_interaction',
  timeToInteraction?: number,
  featureExplored?: string
): Promise<void> {
  await logEngagementEvent({
    userId,
    trigger,
    messageShown: trigger,
    timestamp: new Date().toISOString(),
    userInteraction: interaction,
    featureExplored,
    timeToInteraction
  });
}

/**
 * Get least shown triggers (for diversity)
 */
export async function getLeastShownTriggers(userId: string, limit: number = 3): Promise<string[]> {
  try {
    const engagementLogs = JSON.parse(localStorage.getItem('dreamcatcher_engagement_logs') || '[]');
    const userLogs = engagementLogs.filter((log: any) => log.user_id === userId);

    const triggerCounts: Record<string, number> = {};
    userLogs.forEach((log: any) => {
      triggerCounts[log.trigger] = (triggerCounts[log.trigger] || 0) + 1;
    });

    return Object.entries(triggerCounts)
      .sort((a, b) => a[1] - b[1])
      .slice(0, limit)
      .map(([trigger]) => trigger);
  } catch (error) {
    console.error('Failed to get least shown triggers:', error);
    return [];
  }
}

/**
 * Update user's last engagement message timestamp
 */
export async function updateUserLastEngagement(userId: string): Promise<void> {
  try {
    // This would update the user_profiles table in production
    // For now, we track it in localStorage
    localStorage.setItem(
      `user_${userId}_last_engagement`,
      new Date().toISOString()
    );
  } catch (error) {
    console.error('Failed to update last engagement:', error);
  }
}
