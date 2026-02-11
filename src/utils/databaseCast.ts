/**
 * Database Type Casting Utilities
 * Converts SQLite row data to application types
 * Handles boolean (0/1) and number conversions consistently
 */

import type { 
  UserRow, 
  UserProfileRow, 
  DreamRow,
  DreamWorldRow,
  AdminTaskRow,
  FeatureRequestRow,
  EarlyAccessListRow,
  PatternInsightRow
} from '../types/blink'
import type { Dream } from '../types/dream'
import type { UserProfile } from '../types/profile'
import type { PatternInsight, InsightType } from '../types/insight'

/**
 * Convert SQLite boolean (0/1) to JavaScript boolean
 */
export function toBoolean(value: "0" | "1" | 0 | 1 | boolean | null | undefined): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return value
  return Number(value) > 0
}

/**
 * Convert JavaScript boolean to SQLite boolean (0/1)
 */
export function fromBoolean(value: boolean): "0" | "1" {
  return value ? "1" : "0"
}

/**
 * Convert value to number, handling string inputs
 */
export function toNumber(value: number | string | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue
  if (typeof value === 'number') return value
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Parse JSON string safely
 */
export function parseJSON<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

/**
 * Cast UserProfileRow to UserProfile (application type)
 */
export function castUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    name: row.name,
    age: toNumber(row.age),
    dateOfBirth: row.date_of_birth || row.dateOfBirth || undefined,
    gender: row.gender as 'male' | 'female' | 'none' | 'both',
    nightmareProne: toBoolean(row.nightmare_prone || row.nightmareProne),
    recurringDreams: toBoolean(row.recurring_dreams || row.recurringDreams),
    nightmareDetails: parseJSON(row.nightmare_details || row.nightmareDetails, undefined),
    recurringDreamDetails: parseJSON(row.recurring_dream_details || row.recurringDreamDetails, undefined),
    onboardingCompleted: toBoolean(row.onboarding_completed || row.onboardingCompleted),
    subscriptionTier: (row.subscription_tier || row.subscriptionTier) as 'free' | 'pro' | 'premium' | 'vip',
    dreamsAnalyzedLifetime: toNumber(row.dreams_analyzed_lifetime || row.dreamsAnalyzedLifetime),
    dreamsAnalyzedThisMonth: toNumber(row.dreams_analyzed_this_month || row.dreamsAnalyzedThisMonth),
    lastResetDate: row.last_reset_date || row.lastResetDate || undefined,
    referralBonusDreams: toNumber(row.referral_bonus_dreams || row.referralBonusDreams),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  }
}

/**
 * Cast UserProfile (application type) to UserProfileRow (database type)
 */
export function toUserProfileRow(profile: Partial<UserProfile>): Partial<UserProfileRow> {
  const row: Partial<UserProfileRow> = {}
  
  if (profile.id !== undefined) row.id = profile.id
  if (profile.userId !== undefined) row.userId = profile.userId
  if (profile.name !== undefined) row.name = profile.name
  if (profile.age !== undefined) row.age = profile.age
  if (profile.dateOfBirth !== undefined) row.dateOfBirth = profile.dateOfBirth || null
  if (profile.gender !== undefined) row.gender = profile.gender
  if (profile.nightmareProne !== undefined) row.nightmareProne = fromBoolean(profile.nightmareProne)
  if (profile.recurringDreams !== undefined) row.recurringDreams = fromBoolean(profile.recurringDreams)
  if (profile.nightmareDetails !== undefined) row.nightmareDetails = JSON.stringify(profile.nightmareDetails)
  if (profile.recurringDreamDetails !== undefined) row.recurringDreamDetails = JSON.stringify(profile.recurringDreamDetails)
  if (profile.onboardingCompleted !== undefined) row.onboardingCompleted = fromBoolean(profile.onboardingCompleted)
  if (profile.subscriptionTier !== undefined) row.subscriptionTier = profile.subscriptionTier
  if (profile.dreamsAnalyzedLifetime !== undefined) row.dreamsAnalyzedLifetime = profile.dreamsAnalyzedLifetime
  if (profile.dreamsAnalyzedThisMonth !== undefined) row.dreamsAnalyzedThisMonth = profile.dreamsAnalyzedThisMonth
  if (profile.lastResetDate !== undefined) row.lastResetDate = profile.lastResetDate || null
  if (profile.referralBonusDreams !== undefined) row.referralBonusDreams = profile.referralBonusDreams
  if (profile.createdAt !== undefined) row.createdAt = profile.createdAt
  if (profile.updatedAt !== undefined) row.updatedAt = profile.updatedAt
  
  return row
}

/**
 * Cast DreamRow to Dream (application type)
 */
export function castDream(row: any): Dream {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    title: row.title,
    description: row.description,
    inputType: (row.input_type || row.inputType) as 'text' | 'symbols' | 'image',
    imageUrl: row.image_url || row.imageUrl || undefined,
    symbolsData: row.symbols_data || row.symbolsData || undefined,
    interpretation: row.interpretation || undefined,
    videoUrl: row.video_url || row.videoUrl || undefined,
    tags: parseJSON(row.tags, []),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  }
}

/**
 * Cast Dream (application type) to DreamRow (database type)
 */
export function toDreamRow(dream: Partial<Dream>): Partial<DreamRow> {
  const row: Partial<DreamRow> = {}
  
  if (dream.id !== undefined) row.id = dream.id
  if (dream.userId !== undefined) row.userId = dream.userId
  if (dream.title !== undefined) row.title = dream.title
  if (dream.description !== undefined) row.description = dream.description
  if (dream.inputType !== undefined) row.inputType = dream.inputType
  if (dream.imageUrl !== undefined) row.imageUrl = dream.imageUrl || null
  if (dream.symbolsData !== undefined) row.symbolsData = dream.symbolsData || null
  if (dream.interpretation !== undefined) row.interpretation = dream.interpretation || null
  if (dream.videoUrl !== undefined) row.videoUrl = dream.videoUrl || null
  if (dream.tags !== undefined) row.tags = JSON.stringify(dream.tags)
  if (dream.createdAt !== undefined) row.createdAt = dream.createdAt
  if (dream.updatedAt !== undefined) row.updatedAt = dream.updatedAt
  
  return row
}

/**
 * Cast multiple DreamRows to Dreams
 */
export function castDreams(rows: DreamRow[]): Dream[] {
  return rows.map(castDream)
}

/**
 * Cast multiple UserProfileRows to UserProfiles
 */
export function castUserProfiles(rows: UserProfileRow[]): UserProfile[] {
  return rows.map(castUserProfile)
}

/**
 * Cast PatternInsightRow to PatternInsight (application type)
 */
export function castPatternInsight(row: PatternInsightRow): PatternInsight {
  return {
    id: row.id,
    userId: row.userId,
    insightType: row.insightType as InsightType,
    title: row.title,
    description: row.description,
    confidence: toNumber(row.confidence),
    supportingDreams: parseJSON(row.supportingDreams, []),
    generatedAt: row.generatedAt,
    expiresAt: row.expiresAt || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Batch cast any array of database rows using a cast function
 */
export function batchCast<TRow, TApp>(rows: TRow[], castFn: (row: TRow) => TApp): TApp[] {
  return rows.map(castFn)
}

/**
 * Cast GamificationProfile (database type) to GamificationProfile (application type)
 */
export function castGamificationProfile(row: any) {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    dreamCoins: toNumber(row.dream_coins || row.dreamCoins),
    level: toNumber(row.level),
    totalXp: toNumber(row.total_xp || row.totalXp),
    currentStreak: toNumber(row.current_streak || row.currentStreak),
    bestStreak: toNumber(row.best_streak || row.bestStreak),
    lastActivityDate: row.last_activity_date || row.lastActivityDate || undefined,
    badges: parseJSON(row.badges, []),
    referralCode: row.referral_code || row.referralCode || undefined,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  }
}

/**
 * Cast DreamSymbol (database type) to DreamSymbol (application type)
 */
export function castDreamSymbol(row: any) {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    symbol: row.symbol,
    archetypeCategory: row.archetype_category || row.archetypeCategory || undefined,
    jungianMeaning: row.jungian_meaning || row.jungianMeaning || undefined,
    personalMeaning: row.personal_meaning || row.personalMeaning || undefined,
    occurrenceCount: toNumber(row.occurrence_count || row.occurrenceCount),
    contexts: parseJSON(row.contexts, []),
    emotionalValence: toNumber(row.emotional_valence || row.emotionalValence, 0),
    firstSeen: row.first_seen || row.firstSeen,
    lastSeen: row.last_seen || row.lastSeen,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  }
}