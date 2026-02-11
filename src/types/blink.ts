/**
 * Blink SDK Database Type Extensions
 * Extends the Blink SDK types to include all custom tables with proper type safety
 */

import type { BlinkDatabase } from '@blinkdotnew/sdk'

/**
 * Database table operations interface
 * Provides type-safe CRUD operations for any table
 */
export interface TableOperations<T> {
  list(options?: {
    where?: Partial<Record<keyof T, any>>
    orderBy?: Partial<Record<keyof T, 'asc' | 'desc'>>
    limit?: number
  }): Promise<any[]>
  
  count(options?: {
    where?: Partial<Record<keyof T, any>>
  }): Promise<number>
  
  get(id: string): Promise<T | null>
  
  create(data: any): Promise<any>
  
  update(id: string, data: any): Promise<void>
  
  delete(id: string): Promise<void>
  
  createMany(data: any[]): Promise<any[]>
  
  upsertMany(data: any[]): Promise<any[]>
}

/**
 * Database Row Types (as returned from SQLite)
 * All booleans are "0" | "1" strings
 * All numbers are numbers or strings
 * Note: SQLite auto-converts camelCase keys from TypeScript to snake_case
 */
export interface UserRow {
  id: string
  userId: string
  email: string
  emailVerified: "0" | "1"
  passwordHash: string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  phoneVerified: "0" | "1"
  role: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  lastSignIn: string
}

export interface UserProfileRow {
  id: string
  userId: string
  name: string
  age: number | string
  gender: string
  nightmareProne: "0" | "1"
  recurringDreams: "0" | "1"
  onboardingCompleted: "0" | "1"
  createdAt: string
  updatedAt: string
  subscriptionTier: string
  dreamsAnalyzedThisMonth: number | string
  lastResetDate: string | null
  dreamsAnalyzedLifetime: number | string
  referralBonusDreams: number | string
  deviceFingerprint: string | null
  signupIp: string | null
  normalizedEmail: string | null
  accountStatus: string | null
  nightmareDetails: string | null
  recurringDreamDetails: string | null
  ttsGenerationsThisMonth: number | string
  ttsCostThisMonthUsd: number | string
  ttsLastResetDate: string | null
  dateOfBirth: string | null
  preferredTtsVoice: string
  transcriptionsThisMonth: number | string
  transcriptionLastResetDate: string | null
  transcriptionsLifetime: number | string
}

/**
 * Dream table row (as returned from SQLite)
 * inputType: 'text' | 'symbols' | 'image'
 * tags: JSON stringified array
 */
export interface DreamRow {
  id: string
  userId: string
  title: string
  description: string
  inputType: 'text' | 'symbols' | 'image' | 'voice'
  imageUrl: string | null
  symbolsData: string | null
  interpretation: string | null
  videoUrl: string | null
  createdAt: string
  updatedAt: string
  tags: string | null // JSON stringified string[]
}

/**
 * Dream theme tracking row
 * Tracks recurring themes across user dreams
 */
export interface DreamThemeRow {
  id: string
  userId: string
  theme: string
  count: number | string
  lastOccurred: string
}

/**
 * Dream World row (as returned from SQLite)
 * dreamIds: JSON stringified array of dream IDs
 * Represents a collection of dreams merged into a single video
 */
export interface DreamWorldRow {
  id: string
  userId: string
  title: string
  description: string | null
  dreamIds: string // JSON stringified string[]
  videoUrl: string | null
  thumbnailUrl: string | null
  durationSeconds: number | string | null
  generatedAt: string
  createdAt: string
  updatedAt: string
}

export interface ApiUsageLogRow {
  id: string
  userId: string
  operationType: string
  modelUsed: string | null
  tokensUsed: number | string
  estimatedCostUsd: number | string
  inputSize: number | string | null
  outputSize: number | string | null
  success: "0" | "1"
  errorMessage: string | null
  metadata: string | null
  createdAt: string
}

export interface MonthlyUsageSummaryRow {
  id: string
  userId: string
  yearMonth: string
  totalOperations: number | string
  totalTokens: number | string
  totalCostUsd: number | string
  imageGenerations: number | string
  aiInterpretations: number | string
  videoGenerations: number | string
  updatedAt: string
}

export interface AdminTaskRow {
  id: string
  userId: string
  title: string
  description: string
  priority: string
  status: string
  progress: number | string
  dueDate: string
  orderIndex: number | string
  tags: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  promotedFromFeatureId: string | null
}

export interface FeatureRequestRow {
  id: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  requestedBy: string
  requestedByType: string
  targetRelease: string | null
  estimatedHours: number | string | null
  notes: string | null
  technicalDetails: string | null
  dependencies: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  assignedTo: string | null
  votes: number | string
}

export interface EarlyAccessListRow {
  id: string
  name: string
  email: string
  tier: string
  userId: string | null
  createdAt: string
  invitedAt: string | null
  invitationSent: "0" | "1"
  notes: string | null
}

export interface LaunchOfferUserRow {
  id: string
  userId: string
  signupNumber: number | string
  offerActivated: "0" | "1"
  transcriptionsUsed: number | string
  imagesGenerated: number | string
  createdAt: string
  updatedAt: string
}

export interface PatternInsightRow {
  id: string
  userId: string
  insightType: string
  title: string
  description: string
  confidence: number | string
  supportingDreams: string | null // JSON stringified string[]
  generatedAt: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface GlobalSettingRow {
  id: string
  key: string
  value: string
  updatedAt: string
}

/**
 * Extend BlinkDatabase with typed table operations
 * No manual casting needed - TypeScript provides full autocomplete
 */
declare module '@blinkdotnew/sdk' {
  interface BlinkDatabase {
    users: TableOperations<UserRow>
    userProfiles: TableOperations<UserProfileRow>
    dreams: TableOperations<DreamRow>
    dreamThemes: TableOperations<DreamThemeRow>
    dreamWorlds: TableOperations<DreamWorldRow>
    apiUsageLogs: TableOperations<ApiUsageLogRow>
    monthlyUsageSummary: TableOperations<MonthlyUsageSummaryRow>
    adminTasks: TableOperations<AdminTaskRow>
    featureRequests: TableOperations<FeatureRequestRow>
    earlyAccessList: TableOperations<EarlyAccessListRow>
    launchOfferUsers: TableOperations<LaunchOfferUserRow>
    patternInsights: TableOperations<PatternInsightRow>
    globalSettings: TableOperations<GlobalSettingRow>
    referrals: TableOperations<any>
    emailVerificationTokens: TableOperations<any>
    magicLinkTokens: TableOperations<any>
    passwordResetTokens: TableOperations<any>
    videoGenerationQueue: TableOperations<any>
    videoGenerationLimits: TableOperations<any>
    gamificationProfiles: TableOperations<any>
    reflectionSessions: TableOperations<any>
    reflectAiCredits: TableOperations<any>
    authTelemetry: TableOperations<any>
    paymentTransactions: TableOperations<any>
    emailTemplates: TableOperations<any>
    userPrivacySettings: TableOperations<any>
    reflectionMessages: TableOperations<any>
  }
}

// Re-export for convenience
export type { BlinkDatabase } from '@blinkdotnew/sdk'