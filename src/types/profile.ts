import type { SubscriptionTier } from './subscription'

export interface NightmareDetails {
  scene: string
  feelings: string
  lackOfControl: boolean
  frequency: string
}

export interface RecurringDreamDetails {
  scene: string
  isFamiliarPlace: boolean
  reactions: string
  specificElements: string
  frequency: string
  duration: string
}

export interface UserProfile {
  id: string
  userId: string
  name: string
  age: number
  dateOfBirth?: string
  gender: 'male' | 'female' | 'none' | 'both'
  nightmareProne: boolean
  recurringDreams: boolean
  nightmareDetails?: NightmareDetails
  recurringDreamDetails?: RecurringDreamDetails
  onboardingCompleted: boolean
  subscriptionTier: SubscriptionTier
  hasLaunchOffer?: boolean
  dreamsAnalyzedLifetime: number
  dreamsAnalyzedThisMonth: number
  lastResetDate?: string
  referralBonusDreams: number
  createdAt: string
  updatedAt: string
}

export interface UserPrivacySettings {
  id: string
  userId: string
  patternTrackingConsent: boolean
  patternTrackingConsentDate?: string
  sensitiveContentFilter: boolean
  redactTrauma: boolean
  redactSexuality: boolean
  redactViolence: boolean
  redactFears: boolean
  allowCloudAnalysis: boolean
  consentVersion: string
  onboardingPrivacyReviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface DreamTheme {
  id: string
  userId: string
  theme: string
  count: number
  lastOccurred: string
}

export interface DreamStatistics {
  totalDreams: number
  nightmareCount: number
  recurringCount: number
  topThemes: Array<{ theme: string; count: number }>
  recentActivity: Array<{ date: string; count: number }>
}
