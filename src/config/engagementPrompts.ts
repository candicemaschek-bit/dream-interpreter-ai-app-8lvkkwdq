/**
 * Dreamcatcher Engagement Guide
 * Behavior-based engagement messaging system
 * Warm, magical, intuitive tone that adapts to user behavior
 */

export interface EngagementPrompt {
  trigger: string;
  messages: string[];
  condition?: (userState: any) => boolean;
}

export const ENGAGEMENT_PROMPTS: Record<string, EngagementPrompt> = {
  // Morning app opening
  MORNING_OPEN: {
    trigger: 'app_open_morning',
    messages: [
      'Your dreams may still be warm from the night. Want to capture them before they fade?',
      'Something visited you in your sleep. Ready to decode it?'
    ]
  },

  // After new dream is logged
  AFTER_DREAM_LOGGED: {
    trigger: 'dream_logged',
    messages: [
      'Beautiful. A fresh thread in your dream tapestry. Want to see what it means?',
      'This one carries symbols you don\'t often see. Shall we explore them?'
    ]
  },

  // Inactive for 2-3 days
  INACTIVE_2_3_DAYS: {
    trigger: 'inactive_2_3_days',
    messages: [
      'Your inner world has been whispering without a witness. Want to check in?',
      'Dreams don\'t disappear—they wait. Ready to listen again?'
    ]
  },

  // Inactive for 7+ days
  INACTIVE_7_PLUS_DAYS: {
    trigger: 'inactive_7_plus_days',
    messages: [
      'A whole week of unseen dreams… one of them might hold a message for you.',
      'The doorway hasn\'t closed—just knock. Want to reconnect with your dream world?'
    ]
  },

  // Streak motivation
  STREAK_MOTIVATION: {
    trigger: 'streak_milestone',
    messages: [
      'You\'re building a powerful connection to your subconscious. Day {{streak}}—keep going.',
      'Your dream map is expanding beautifully. Want to add today\'s chapter?'
    ]
  },

  // Recurring symbol detected
  RECURRING_SYMBOL: {
    trigger: 'recurring_symbol',
    messages: [
      'This symbol returns for a reason. Want help understanding why it keeps visiting you?',
      'You\'ve unlocked a pattern. Let\'s dig deeper.'
    ]
  },

  // After HD image generation
  AFTER_HD_IMAGES: {
    trigger: 'hd_images_generated',
    messages: [
      'Your dream took shape beautifully. Want to share this vision with someone close?',
      'This image reveals something hidden—want to explore it further?'
    ]
  },

  // Free tier limit approaching
  FREE_LIMIT_APPROACHING: {
    trigger: 'free_limit_approaching',
    messages: [
      'You\'re at the edge of your free analyses. Want deeper clarity this time?'
    ]
  },

  // Pro to Premium upgrade suggestion
  PRO_TO_PREMIUM: {
    trigger: 'pro_to_premium',
    messages: [
      'Your dreams are forming patterns. Premium can reveal what they\'re trying to show you.'
    ]
  },

  // Premium to VIP upgrade suggestion
  PREMIUM_TO_VIP: {
    trigger: 'premium_to_vip',
    messages: [
      'Your journey is reaching new depth—VIP unlocks full access to the tools your subconscious has been hinting at.'
    ]
  },

  // Sharing - general
  SHARE_DREAM: {
    trigger: 'share_dream',
    messages: [
      'This interpretation carries a message someone in your life may need.',
      'Your dream has a story worth sharing—want to send it to someone who\'ll understand?',
      'Some dreams are too fascinating to keep to yourself. Want to share this one with someone who "gets" you?'
    ]
  },

  // Sharing - after powerful interpretation
  SHARE_POWERFUL_INSIGHT: {
    trigger: 'share_powerful_insight',
    messages: [
      'This insight might resonate with someone close to you—share it?'
    ]
  },

  // Sharing - rare symbol
  SHARE_RARE_SYMBOL: {
    trigger: 'share_rare_symbol',
    messages: [
      'Only 1% of dreamers get this symbol. Want to show a friend?'
    ]
  },

  // Sharing - long dream
  SHARE_LONG_DREAM: {
    trigger: 'share_long_dream',
    messages: [
      'This dream reads like a story. Want to share your journey so far?'
    ]
  },

  // Sharing - Dreamworld video
  SHARE_DREAMWORLD_VIDEO: {
    trigger: 'share_dreamworld_video',
    messages: [
      'Your Dreamworld just gained a new chapter—share the magic?',
      'Your Dreamworld video is ready—want to show someone the world your subconscious created?',
      'Dreamers travel further together. Invite a friend to join you on the next chapter.',
      'Your subconscious crafted a masterpiece. Want others to see it?'
    ]
  },

  // Sharing - streak achievement
  SHARE_STREAK_ACHIEVEMENT: {
    trigger: 'share_streak_achievement',
    messages: [
      'You just completed your 7-day dream streak! Want to share your achievement?'
    ]
  },

  // Feature exploration - ReflectAI
  EXPLORE_REFLECT_AI: {
    trigger: 'explore_reflect_ai',
    messages: [
      'A single reflection can reveal the whole pattern. Want to write a few lines?'
    ]
  },

  // Feature exploration - SymbolicaAI
  EXPLORE_SYMBOLICA_AI: {
    trigger: 'explore_symbolica_ai',
    messages: [
      'A symbol you logged recently connects to an ancient archetype. Want to explore it?'
    ]
  },

  // Feature exploration - AtlasAI
  EXPLORE_ATLAS_AI: {
    trigger: 'explore_atlas_ai',
    messages: [
      'Your dream map shifted. Another landmark appeared—shall we visit it?'
    ]
  },

  // Feature exploration - LumenAI
  EXPLORE_LUMEN_AI: {
    trigger: 'explore_lumen_ai',
    messages: [
      'Your emotional tone across dreams suggests something important. Want guidance?'
    ]
  },

  // Feature exploration - DreamcatcherAI
  EXPLORE_DREAMCATCHER_AI: {
    trigger: 'explore_dreamcatcher_ai',
    messages: [
      'Let\'s illuminate what your dream tried to tell you.'
    ]
  },

  // Re-engagement after churn
  REENGAGEMENT_CHURN: {
    trigger: 'reengagement_churn',
    messages: [
      'Before you go… one last message: your dreams still have stories for you.',
      'If the magic faded, I can help bring it back. Want a fresh start?'
    ]
  },

  // Invite sharing - Dream patterns
  SHARE_DREAM_PATTERNS: {
    trigger: 'share_dream_patterns',
    messages: [
      'Know someone who dreams as vividly as you do? Invite them—let\'s explore your dream symbols together.',
      'Dream patterns are even clearer when shared. Send this interpretation to someone who appears in your dream.'
    ]
  },

  // Invite to app
  INVITE_FRIEND: {
    trigger: 'invite_friend',
    messages: [
      'You have a gift for dreaming deeply. Want to share Dreamcatcher with someone who\'d love it too?',
      'Everyone dreams. Only a few know how to listen. Help someone start.'
    ]
  }
};

/**
 * Feature-specific micro-agent prompts
 */
export const FEATURE_PROMPTS: Record<string, string> = {
  dreamcatcherAI: 'Let\'s illuminate what your dream tried to tell you.',
  reflectAI: 'A single reflection can reveal the whole pattern. Want to write a few lines?',
  symbolicaAI: 'A symbol you logged recently connects to an ancient archetype. Want to explore it?',
  atlasAI: 'Your dream map shifted. Another landmark appeared—shall we visit it?',
  lumenAI: 'Your emotional tone across dreams suggests something important. Want guidance?'
};

/**
 * Helper to get random prompt from trigger
 */
export function getEngagementMessage(trigger: string, variables?: Record<string, string>): string | null {
  const prompt = ENGAGEMENT_PROMPTS[trigger];
  if (!prompt) return null;

  const message = prompt.messages[Math.floor(Math.random() * prompt.messages.length)];
  let result = message;

  // Replace variables
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, value);
    });
  }

  return result;
}
