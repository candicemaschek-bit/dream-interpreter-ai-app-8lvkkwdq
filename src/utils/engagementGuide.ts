/**
 * Dreamcatcher Engagement Guide Service
 * Analyzes user behavior and determines optimal engagement messaging
 */

import { getEngagementMessage, FEATURE_PROMPTS } from '../config/engagementPrompts';

export interface UserEngagementState {
  userId: string;
  totalDreamsLogged: number;
  lastDreamLoggedAt: string | null;
  currentStreak: number;
  bestStreak: number;
  lastAppOpenedAt: string | null;
  subscriptionTier: 'free' | 'pro' | 'premium' | 'vip';
  recurringSymbols: string[];
  lastEngagementMessageAt: string | null;
  dreamsThisMonth: number;
  hasGeneratedImages: boolean;
  hasGeneratedVideo: boolean;
}

export interface EngagementContext {
  trigger: string;
  userState: UserEngagementState;
  variables?: Record<string, string>;
  priority?: 'low' | 'medium' | 'high';
}

export const EngagementGuide = {
  /**
   * Analyze user behavior and return engagement message
   */
  getAdaptiveMessage(context: EngagementContext): {
    message: string | null;
    trigger: string;
    priority: 'low' | 'medium' | 'high';
  } | null {
    if (!context.userState) {
      return null;
    }

    const message = getEngagementMessage(context.trigger, context.variables);

    return message
      ? {
          message,
          trigger: context.trigger,
          priority: context.priority || 'medium'
        }
      : null;
  },

  /**
   * Determine engagement trigger based on user behavior
   */
  determineBehaviorTrigger(userState: UserEngagementState): {
    trigger: string;
    variables?: Record<string, string>;
    priority: 'low' | 'medium' | 'high';
  } | null {
    const now = new Date();
    const lastDreamTime = userState.lastDreamLoggedAt ? new Date(userState.lastDreamLoggedAt) : null;
    const lastAppTime = userState.lastAppOpenedAt ? new Date(userState.lastAppOpenedAt) : null;

    // Check if opening app in morning (5 AM - 10 AM)
    const hourOfDay = now.getHours();
    if (hourOfDay >= 5 && hourOfDay < 10 && lastDreamTime) {
      const daysSinceLastDream = this.getDaysDifference(now, lastDreamTime);
      if (daysSinceLastDream > 0) {
        return {
          trigger: 'MORNING_OPEN',
          priority: 'high'
        };
      }
    }

    // Check inactivity - 7+ days
    if (lastDreamTime) {
      const daysSinceLastDream = this.getDaysDifference(now, lastDreamTime);
      if (daysSinceLastDream >= 7) {
        return {
          trigger: 'INACTIVE_7_PLUS_DAYS',
          priority: 'high'
        };
      }

      // Check inactivity - 2-3 days
      if (daysSinceLastDream >= 2 && daysSinceLastDream < 7) {
        return {
          trigger: 'INACTIVE_2_3_DAYS',
          priority: 'medium'
        };
      }
    }

    // Check streak milestone (7, 14, 30 days)
    if (userState.currentStreak > 0 && [7, 14, 30].includes(userState.currentStreak)) {
      return {
        trigger: 'STREAK_MOTIVATION',
        variables: { streak: userState.currentStreak.toString() },
        priority: 'high'
      };
    }

    // Check for recurring symbols
    if (userState.recurringSymbols.length > 0) {
      return {
        trigger: 'RECURRING_SYMBOL',
        priority: 'medium'
      };
    }

    // Check subscription tier limits
    if (userState.subscriptionTier === 'free' && userState.dreamsThisMonth >= 9) {
      return {
        trigger: 'FREE_LIMIT_APPROACHING',
        priority: 'high'
      };
    }

    // Check for upgrade opportunity
    if (userState.subscriptionTier === 'pro' && userState.totalDreamsLogged >= 20) {
      return {
        trigger: 'PRO_TO_PREMIUM',
        priority: 'medium'
      };
    }

    return null;
  },

  /**
   * Get feature exploration suggestion based on usage patterns
   */
  getFeatureSuggestion(userState: UserEngagementState): string | null {
    // If they've logged many dreams but haven't used features, suggest exploration
    if (userState.totalDreamsLogged >= 5) {
      const suggestions = [
        'EXPLORE_REFLECT_AI',
        'EXPLORE_SYMBOLICA_AI',
        'EXPLORE_ATLAS_AI',
        'EXPLORE_LUMEN_AI'
      ];

      // Random selection from available features
      const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      return getEngagementMessage(suggestion);
    }

    return null;
  },

  /**
   * Get sharing suggestion based on content generation
   */
  getSharingSuggestion(userState: UserEngagementState, contentType: 'image' | 'video' | 'interpretation'): string | null {
    if (contentType === 'image' && userState.hasGeneratedImages) {
      return getEngagementMessage('SHARE_DREAM');
    }

    if (contentType === 'video' && userState.hasGeneratedVideo) {
      return getEngagementMessage('SHARE_DREAMWORLD_VIDEO');
    }

    if (contentType === 'interpretation') {
      return getEngagementMessage('SHARE_POWERFUL_INSIGHT');
    }

    return null;
  },

  /**
   * Get re-engagement message for inactive users
   */
  getReengagementMessage(userState: UserEngagementState): string | null {
    if (userState.lastAppOpenedAt) {
      const daysSinceOpen = this.getDaysDifference(new Date(), new Date(userState.lastAppOpenedAt));
      if (daysSinceOpen > 14) {
        return getEngagementMessage('REENGAGEMENT_CHURN');
      }
    }

    return null;
  },

  /**
   * Helper: Calculate days difference
   */
  getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  /**
   * Check if enough time has passed since last engagement message
   */
  shouldShowMessage(userState: UserEngagementState, minIntervalHours: number = 4): boolean {
    if (!userState.lastEngagementMessageAt) {
      return true;
    }

    const lastMessageTime = new Date(userState.lastEngagementMessageAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

    return hoursDiff >= minIntervalHours;
  },

  /**
   * Get feature-specific prompt
   */
  getFeaturePrompt(featureName: keyof typeof FEATURE_PROMPTS): string | null {
    return FEATURE_PROMPTS[featureName] || null;
  },

  /**
   * Build engagement context from user data
   */
  buildContextFromUserData(user: any, dreamData: any): EngagementContext | null {
    if (!user || !user.id) {
      return null;
    }

    const userState: UserEngagementState = {
      userId: user.id,
      totalDreamsLogged: dreamData?.totalCount || 0,
      lastDreamLoggedAt: dreamData?.lastLoggedAt || null,
      currentStreak: user.gamification?.current_streak || 0,
      bestStreak: user.gamification?.best_streak || 0,
      lastAppOpenedAt: user.last_sign_in || null,
      subscriptionTier: user.subscription_tier || 'free',
      recurringSymbols: dreamData?.recurringSymbols || [],
      lastEngagementMessageAt: user.last_engagement_message_at || null,
      dreamsThisMonth: dreamData?.thisMonthCount || 0,
      hasGeneratedImages: dreamData?.hasImages || false,
      hasGeneratedVideo: dreamData?.hasVideo || false
    };

    const trigger = this.determineBehaviorTrigger(userState);

    if (!trigger) {
      return null;
    }

    return {
      trigger: trigger.trigger,
      userState,
      variables: trigger.variables,
      priority: trigger.priority
    };
  }
}
