export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'vip'

export type AddOnType = 'deep_dive_report' | 'dreamworlds_pass' | 'extra_dreamworld'

export interface AddOn {
  id: AddOnType
  name: string
  description: string
  price: number
  eligibleTiers: SubscriptionTier[]
  isRecurring: boolean // true for monthly subscriptions, false for one-time purchases
  features: string[]
  isComingSoon?: boolean // true for features not yet available
}

export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  monthlyPrice: number
  annualPrice: number
  monthlyCredits: number
  features: string[]
  dreamworldsAccess: 'demo' | 'purchase' | 'included'
  dreamworldsPrice?: number
  maxDreamworldsPerMonth?: number
  isComingSoon?: boolean // true for tiers not yet available
}

export interface UserSubscription {
  userId: string
  tier: SubscriptionTier
  startDate: string
  endDate?: string
  billingCycle: 'monthly' | 'annual'
  autoRenew: boolean
  dreamworldsGenerated: number
  dreamworldsLimit?: number
  dreamworldsResetDate?: string
  createdAt: string
  updatedAt: string
}

export interface Dreamworlds {
  id: string
  userId: string
  title: string
  description: string
  dreamIds: string[] // Array of dream IDs included
  videoUrl?: string
  generatedAt?: string
  durationSeconds?: number
  createdAt: string
  updatedAt: string
}

export const ADD_ONS: Record<AddOnType, AddOn> = {
  deep_dive_report: {
    id: 'deep_dive_report',
    name: 'Dream Deep Dive Report',
    description: 'One-time comprehensive analysis across your entire dream history',
    price: 4.99,
    eligibleTiers: ['free', 'pro', 'premium', 'vip'],
    isRecurring: false,
    isComingSoon: true,
    features: [
      'Cross-dream pattern analysis',
      'Recurring theme identification',
      'Emotional arc mapping',
      'Personalized insights report',
      'PDF export of findings'
    ]
  },
  dreamworlds_pass: {
    id: 'dreamworlds_pass',
    name: 'Additional Dreamworlds',
    description: 'One-time or bundle purchase for extra Dreamworlds generations',
    price: 6.99,
    eligibleTiers: ['free', 'pro', 'premium', 'vip'],
    isRecurring: false,
    isComingSoon: true,
    features: [
      'Single Dreamworlds generation',
      'Full video quality',
      'Unlimited replays',
      'Professional editing tools'
    ]
  },
  extra_dreamworld: {
    id: 'extra_dreamworld',
    name: 'Dreamworlds Bundle',
    description: 'Special bundle: 3 Dreamworlds for discounted price',
    price: 14.99,
    eligibleTiers: ['free', 'pro', 'premium', 'vip'],
    isRecurring: false,
    isComingSoon: true,
    features: [
      '3 Dreamworlds generations',
      'Bundle discount (save $6.97)',
      'Full video quality',
      'Unlimited replays'
    ]
  }
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Dreamer',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCredits: 2, // 2 LIFETIME dream analyses (not per month) - total lifetime access
    features: [
      'No credit card required',
      '2 personalised dream analyses',
      'Symbolic tags',
    ],
    dreamworldsAccess: 'purchase',
    dreamworldsPrice: 0,
    maxDreamworldsPerMonth: 0
  },
  pro: {
    tier: 'pro',
    name: 'Visionary',
    monthlyPrice: 9.99,
    annualPrice: 99.90, // Annual pricing (save ~17%)
    monthlyCredits: 10,
    features: [
      '10 personalised dream analyses per month',
      'Symbolic tags',
      'Deep insights',
      'HD Dream Images'
    ],
    dreamworldsAccess: 'purchase',
    dreamworldsPrice: 6.99,
    maxDreamworldsPerMonth: 0
  },
  premium: {
    tier: 'premium',
    name: 'Architect',
    monthlyPrice: 19.99,
    annualPrice: 199.90, // Annual pricing (save ~17%)
    monthlyCredits: 20,
    isComingSoon: true,
    features: [
      '20 personalised dream analyses per month',
      'Symbolic tags',
      'Deep Insights',
      'HD Dream Images',
      '6-second cinematic dream videos',
      'PLUS:',
      'Reflection Journal (ReflectAI) Access',
      'Symbol Orchard (Symbolica AI) Access',
      'Advanced recurring & nightmare cycle detection'
    ],
    dreamworldsAccess: 'purchase',
    dreamworldsPrice: 6.99,
    maxDreamworldsPerMonth: 0
  },
  vip: {
    tier: 'vip',
    name: 'Star',
    monthlyPrice: 29.99,
    annualPrice: 299.90, // Annual pricing (save ~17%)
    monthlyCredits: 25,
    isComingSoon: true,
    features: [
      '25 personalised dream analyses per month',
      'Symbolic tags',
      'Deep Insights',
      'HD Dream Images',
      'AI Narrated Interpretation',
      '6-second cinematic dream videos',
      'PLUS:',
      'Persona Avatar across all dream visuals',
      '1 x Dreamworlds cinematic video generation',
      'Full Access to:',
      'Reflection Journal (ReflectAI)',
      'Symbol Orchard (SymbolicaAI)',
      'Emotional Guidance and Mindfulness (LumenAI)'
    ],
    dreamworldsAccess: 'included',
    dreamworldsPrice: 6.99, // Additional Dreamworlds: $6.99 each (after first included)
    maxDreamworldsPerMonth: 1
  }
}
