# Gamification Maintenance & Proposed Fixes Guide

## Overview

This document outlines proposed improvements and fixes for the gamification system that should be implemented if gamification features are activated or re-enabled in the future. The current codebase has been optimized for core functionality, but these enhancements will improve robustness, performance, and user experience when the system is fully deployed.

---

## Part 1: Critical Fixes

### 1.1 Database Transaction Atomicity

**Issue**: Coin transactions and profile updates are not atomic. If a process fails mid-transaction, the database can become inconsistent.

**Proposed Fix**:
```typescript
// Currently: Multiple separate database calls
await blink.db.coinTransactions.create(transaction)
await blink.db.gamificationProfiles.update(profileId, { dreamCoins: newBalance })

// Proposed: Implement transaction wrapper
async function executeAtomicGamificationTransaction(
  userId: string,
  operations: Array<() => Promise<any>>
) {
  try {
    const results = []
    for (const op of operations) {
      results.push(await op())
    }
    return results
  } catch (error) {
    // Log transaction failure for manual review
    console.error('Gamification transaction failed:', { userId, error })
    throw error
  }
}

// Usage:
await executeAtomicGamificationTransaction(userId, [
  () => blink.db.coinTransactions.create(transaction),
  () => blink.db.gamificationProfiles.update(profileId, updatedData)
])
```

**Implementation Priority**: HIGH
**Estimated Effort**: 4 hours
**Files to Update**: `src/utils/gamification.ts`, new file: `src/utils/gamificationTransactions.ts`

---

### 1.2 Stripe Error Handling & Retries

**Issue**: Failed coin transactions due to temporary service outages could leave users without rewards.

**Proposed Fix**:
```typescript
// Implement exponential backoff retry mechanism
interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
}

async function awardCoinsWithRetry(
  userId: string,
  reason: CoinRewardReason,
  config: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000
  }
) {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await awardCoins(userId, reason)
    } catch (error) {
      lastError = error as Error
      
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelayMs * Math.pow(2, attempt),
          config.maxDelayMs
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw new Error(`Failed to award coins after ${config.maxRetries} attempts: ${lastError?.message}`)
}
```

**Implementation Priority**: HIGH
**Estimated Effort**: 3 hours
**Files to Update**: `src/utils/gamification.ts`, `src/types/gamification.ts`

---

### 1.3 Streak Recovery Logic Enhancement

**Issue**: Users who lose their streak due to timezone or server issues have no recourse.

**Proposed Fix**:
```typescript
// Current: Simple day-to-day streak check
// Proposed: Add grace period and timezone awareness

interface StreakRecoveryOptions {
  gracePeriodHours: number
  timezoneOffset: number
}

async function updateStreakWithRecovery(
  userId: string,
  options: StreakRecoveryOptions = {
    gracePeriodHours: 6,
    timezoneOffset: 0
  }
) {
  const profile = await getGamificationProfile(userId)
  const now = new Date()
  
  if (!profile?.lastActivityDate) {
    // First activity
    return await updateStreak(userId)
  }

  const lastActivity = new Date(profile.lastActivityDate)
  const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
  
  // Grace period: Allow up to gracePeriodHours without losing streak
  const HOURS_PER_DAY = 24 + options.gracePeriodHours
  
  if (hoursSinceLastActivity > HOURS_PER_DAY) {
    // Streak lost, but log for user recovery
    await logStreakLoss(userId, {
      hoursSinceLastActivity,
      gracePeriodHours: options.gracePeriodHours
    })
  }
  
  return await updateStreak(userId)
}

async function logStreakLoss(userId: string, metadata: any) {
  // Store for manual recovery review
  console.log('Streak loss:', { userId, metadata })
  // Could be stored in database for manual review later
}
```

**Implementation Priority**: MEDIUM
**Estimated Effort**: 3 hours
**Files to Update**: `src/utils/gamification.ts`

---

## Part 2: Performance Optimizations

### 2.1 Leaderboard Caching

**Issue**: Leaderboard queries are expensive and run frequently, impacting database performance.

**Proposed Fix**:
```typescript
// Implement Redis-like caching strategy
interface CacheConfig {
  ttlSeconds: number
  maxSize: number
}

class LeaderboardCache {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map()
  
  async getLeaderboard(limit: number = 50, config: CacheConfig = { ttlSeconds: 300, maxSize: 100 }) {
    const cacheKey = `leaderboard_${limit}`
    
    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }
    
    // Fetch from database
    const data = await blink.db.leaderboardEntries.list({
      orderBy: { score: 'desc' },
      limit
    })
    
    // Store in cache
    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + (config.ttlSeconds * 1000)
    })
    
    return data
  }
  
  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    }
  }
}
```

**Implementation Priority**: MEDIUM
**Estimated Effort**: 4 hours
**Files to Update**: New file: `src/utils/leaderboardCache.ts`

---

### 2.2 Batch Coin Transactions

**Issue**: Logging multiple dreams in sequence creates multiple database operations.

**Proposed Fix**:
```typescript
// Implement batch processing
async function batchAwardCoins(
  transactions: Array<{ userId: string; reason: CoinRewardReason; amount?: number }>
) {
  const groupedByUser = transactions.reduce((acc, tx) => {
    if (!acc[tx.userId]) acc[tx.userId] = []
    acc[tx.userId].push(tx)
    return acc
  }, {} as Record<string, typeof transactions>)

  const results = []
  
  for (const [userId, userTransactions] of Object.entries(groupedByUser)) {
    const totalAmount = userTransactions.reduce((sum, tx) => {
      return sum + (tx.amount || getCoinRewardAmount(tx.reason))
    }, 0)
    
    // Single update per user
    const result = await blink.db.gamificationProfiles.update(userId, {
      dreamCoins: (prevCoins) => prevCoins + totalAmount
    })
    
    // Record all transactions
    for (const tx of userTransactions) {
      await blink.db.coinTransactions.create({
        userId,
        amount: tx.amount || getCoinRewardAmount(tx.reason),
        reason: tx.reason,
        createdAt: new Date().toISOString()
      })
    }
    
    results.push({ userId, totalAmount })
  }
  
  return results
}
```

**Implementation Priority**: MEDIUM
**Estimated Effort**: 3 hours
**Files to Update**: `src/utils/gamification.ts`

---

## Part 3: Security Enhancements

### 3.1 Coin Limit Validations

**Issue**: No maximum coin limits prevent exploitation through edge cases.

**Proposed Fix**:
```typescript
// Define sane limits
const GAMIFICATION_LIMITS = {
  MAX_COINS_PER_DAY: 2000,
  MAX_COINS_PER_DREAM: 500,
  MAX_DAILY_DREAMS: 50,
  MAX_LEVEL: 15,
  MAX_XP: 1_000_000,
  MAX_ANNUAL_EARNINGS: 500_000
} as const

async function validateCoinAward(
  userId: string,
  amount: number,
  reason: CoinRewardReason
): Promise<{ valid: boolean; error?: string }> {
  // Check per-transaction limit
  if (amount > GAMIFICATION_LIMITS.MAX_COINS_PER_DREAM) {
    return { valid: false, error: 'Amount exceeds per-dream maximum' }
  }

  // Check daily limit
  const today = new Date().toISOString().split('T')[0]
  const todayTransactions = await blink.db.coinTransactions.list({
    where: {
      AND: [
        { userId },
        { createdAt: { gte: `${today}T00:00:00Z` } }
      ]
    }
  })
  
  const dailyTotal = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  if (dailyTotal + amount > GAMIFICATION_LIMITS.MAX_COINS_PER_DAY) {
    return { valid: false, error: 'Daily limit exceeded' }
  }

  return { valid: true }
}
```

**Implementation Priority**: HIGH
**Estimated Effort**: 3 hours
**Files to Update**: `src/utils/gamification.ts`, `src/types/gamification.ts`

---

### 3.2 Badge Inflation Prevention

**Issue**: Badge requirements could be gamed or exploited.

**Proposed Fix**:
```typescript
// Implement progress verification
interface BadgeRequirements {
  badgeId: string
  validate: (profile: GamificationProfile) => boolean
  requirements: string[]
}

const BADGE_REQUIREMENTS: Record<string, BadgeRequirements> = {
  dream_explorer: {
    badgeId: 'dream_explorer',
    validate: (profile) => {
      // Verify user has actual dream records
      return (profile.badges?.includes('dream_explorer') || false)
    },
    requirements: ['Log 1 dream']
  },
  dream_master: {
    badgeId: 'dream_master',
    validate: async (userId: string) => {
      // Verify 50 actual dreams exist
      const dreams = await blink.db.dreams.list({
        where: { userId },
        limit: 50
      })
      return dreams.length >= 50
    },
    requirements: ['Log 50 dreams']
  }
}

async function validateBadgeEligibility(
  userId: string,
  badgeId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const requirements = BADGE_REQUIREMENTS[badgeId]
  
  if (!requirements) {
    return { eligible: false, reason: 'Badge not found' }
  }

  const profile = await getGamificationProfile(userId)
  
  if (requirements.validate instanceof Promise) {
    const isValid = await requirements.validate(userId)
    return { eligible: isValid, reason: isValid ? undefined : 'Requirements not met' }
  } else {
    const isValid = requirements.validate(profile as GamificationProfile)
    return { eligible: isValid, reason: isValid ? undefined : 'Requirements not met' }
  }
}
```

**Implementation Priority**: MEDIUM
**Estimated Effort**: 4 hours
**Files to Update**: `src/types/gamification.ts`, `src/utils/gamification.ts`

---

## Part 4: Monitoring & Analytics

### 4.1 Gamification Health Dashboard

**Issue**: No visibility into gamification system health or anomalies.

**Proposed Fix**:
```typescript
// Create monitoring utilities
interface GamificationMetrics {
  averageCoinsPerUser: number
  averageStreakLength: number
  badgeUnlockRate: number
  rewardRedemptionRate: number
  leaderboardParticipation: number
  anomalousUsers: string[] // Users with unusual patterns
}

async function getGamificationMetrics(
  timeWindowDays: number = 30
): Promise<GamificationMetrics> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - timeWindowDays)

  const transactions = await blink.db.coinTransactions.list({
    where: { createdAt: { gte: startDate.toISOString() } }
  })

  const profiles = await blink.db.gamificationProfiles.list()
  const redeemed = await blink.db.userRewards.list()

  return {
    averageCoinsPerUser: transactions.reduce((sum, tx) => sum + tx.amount, 0) / profiles.length,
    averageStreakLength: profiles.reduce((sum, p) => sum + p.currentStreak, 0) / profiles.length,
    badgeUnlockRate: profiles.filter(p => (p.badges || []).length > 0).length / profiles.length,
    rewardRedemptionRate: redeemed.length / profiles.length,
    leaderboardParticipation: (await blink.db.leaderboardEntries.list()).length / profiles.length,
    anomalousUsers: detectAnomalies(transactions, profiles)
  }
}

function detectAnomalies(
  transactions: CoinTransaction[],
  profiles: GamificationProfile[]
): string[] {
  const anomalies: string[] = []
  const THRESHOLD = 5000 // Coins in one day

  for (const profile of profiles) {
    const userTransactions = transactions.filter(t => t.userId === profile.userId)
    const dailyTotals: Record<string, number> = {}

    for (const tx of userTransactions) {
      const day = tx.createdAt.split('T')[0]
      dailyTotals[day] = (dailyTotals[day] || 0) + tx.amount
    }

    for (const total of Object.values(dailyTotals)) {
      if (total > THRESHOLD) {
        anomalies.push(profile.userId)
        break
      }
    }
  }

  return anomalies
}
```

**Implementation Priority**: LOW
**Estimated Effort**: 5 hours
**Files to Update**: New file: `src/utils/gamificationMetrics.ts`

---

### 4.2 Error Logging & Recovery

**Issue**: Gamification errors are not systematically logged for debugging.

**Proposed Fix**:
```typescript
// Implement comprehensive error logging
interface GamificationError {
  id: string
  userId: string
  operation: string
  error: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  metadata: Record<string, any>
}

async function logGamificationError(
  error: Error,
  context: {
    userId?: string
    operation: string
    metadata?: Record<string, any>
  }
) {
  const severity = determineSeverity(error)
  
  // Store in database for monitoring
  // In production, could send to error tracking service (Sentry, etc.)
  console.error('Gamification Error:', {
    userId: context.userId,
    operation: context.operation,
    error: error.message,
    severity,
    timestamp: new Date().toISOString(),
    ...context.metadata
  })
}

function determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  if (error.message.includes('database')) return 'critical'
  if (error.message.includes('transaction')) return 'high'
  if (error.message.includes('validation')) return 'medium'
  return 'low'
}
```

**Implementation Priority**: MEDIUM
**Estimated Effort**: 3 hours
**Files to Update**: New file: `src/utils/gamificationErrors.ts`

---

## Part 5: Feature Enhancements

### 5.1 Seasonal Challenges & Events

**Issue**: Current challenges are static; seasonal variety could improve engagement.

**Proposed Fix**:
```typescript
interface SeasonalEvent {
  id: string
  name: string
  startDate: string
  endDate: string
  challenges: Challenge[]
  multipliers: Record<string, number> // Coin multipliers for specific actions
  exclusiveRewards: Reward[]
}

async function getActiveSeasonalEvent(): Promise<SeasonalEvent | null> {
  const now = new Date().toISOString()
  
  const events = await blink.db.seasonalEvents.list({
    where: {
      AND: [
        { startDate: { lte: now } },
        { endDate: { gte: now } }
      ]
    }
  })
  
  return events[0] || null
}

async function awardCoinsWithSeasonalMultiplier(
  userId: string,
  reason: CoinRewardReason,
  baseAmount: number
): Promise<number> {
  const event = await getActiveSeasonalEvent()
  const multiplier = event?.multipliers?.[reason] || 1
  
  return Math.floor(baseAmount * multiplier)
}
```

**Implementation Priority**: LOW
**Estimated Effort**: 6 hours
**Files to Update**: `src/utils/gamification.ts`, new file: `src/utils/seasonalEvents.ts`

---

### 5.2 Social Features Integration

**Issue**: Gamification lacks deep social integration for competitive play.

**Proposed Fix**:
```typescript
interface FriendsLeaderboard {
  userId: string
  friends: LeaderboardEntry[]
  userRank: number
  totalFriends: number
}

async function getFriendsLeaderboard(userId: string): Promise<FriendsLeaderboard> {
  // Get user's friends (would require friends table)
  const userFriends = await getUserFriends(userId)
  
  // Get leaderboard entries for friends only
  const friendIds = userFriends.map(f => f.friendUserId)
  
  const friendEntries = await blink.db.leaderboardEntries.list({
    where: {
      userId: { in: friendIds }
    },
    orderBy: { score: 'desc' }
  })
  
  const userEntry = await blink.db.leaderboardEntries.list({
    where: { userId },
    limit: 1
  })
  
  return {
    userId,
    friends: friendEntries,
    userRank: friendEntries.findIndex(e => e.userId === userId) + 1,
    totalFriends: friendIds.length
  }
}
```

**Implementation Priority**: LOW
**Estimated Effort**: 5 hours
**Files to Update**: New file: `src/utils/socialGamification.ts`

---

## Part 6: Testing Strategy

### 6.1 Unit Testing Template

**Proposed Fix**:
```typescript
// tests/gamification.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { awardCoins, updateStreak, checkAndAwardBadges } from '@/utils/gamification'

describe('Gamification System', () => {
  beforeEach(() => {
    // Mock Blink SDK
    vi.mock('@blinkdotnew/sdk')
  })

  describe('Coin Awards', () => {
    it('should award correct coins for dream log', async () => {
      const result = await awardCoins('user123', 'log_dream')
      expect(result.amount).toBe(100)
    })

    it('should apply multipliers correctly', async () => {
      const result = await awardCoins('user123', 'log_dream', 1.5)
      expect(result.amount).toBe(150)
    })

    it('should reject invalid amounts', async () => {
      expect(() => awardCoins('user123', 'log_dream', -1)).rejects.toThrow()
    })
  })

  describe('Streaks', () => {
    it('should initialize streak on first activity', async () => {
      const streak = await updateStreak('newuser')
      expect(streak.currentStreak).toBe(1)
    })

    it('should maintain streak within grace period', async () => {
      // Test implementation
    })
  })

  describe('Badges', () => {
    it('should award badge when requirements met', async () => {
      // Test implementation
    })

    it('should validate badge eligibility', async () => {
      // Test implementation
    })
  })
})
```

**Implementation Priority**: MEDIUM
**Estimated Effort**: 8 hours
**Files to Update**: New file: `src/tests/gamification.test.ts`

---

## Part 7: Migration & Rollout Plan

### 7.1 Database Migration Strategy

**Proposed Plan**:
1. Create backup of existing gamification tables
2. Add new columns for enhanced tracking (timestamps, metadata)
3. Run data validation to ensure consistency
4. Deploy new code with backward compatibility
5. Monitor for errors
6. Clean up legacy data after 30 days

### 7.2 Phased Feature Rollout

```
Phase 1 (Week 1): Deploy fixes for atomicity and error handling
  - No user impact
  - Internal testing only

Phase 2 (Week 2): Deploy security validations
  - Monitor anomaly detection
  - Block suspicious patterns

Phase 3 (Week 3): Deploy caching & performance optimizations
  - Gradual rollout (10% → 50% → 100%)
  - Monitor database load

Phase 4+ (Optional): Deploy enhancements
  - Seasonal events
  - Social features
  - Advanced analytics
```

---

## Implementation Checklist

- [ ] Priority HIGH items (Atomicity, Retries, Validation)
- [ ] Priority MEDIUM items (Caching, Metrics, Error Logging)
- [ ] Priority LOW items (Enhancements, Social)
- [ ] Unit test suite
- [ ] Integration tests
- [ ] Load testing
- [ ] Monitoring dashboard
- [ ] Rollout documentation
- [ ] User communication
- [ ] Post-launch monitoring

---

## References

- **GAMIFICATION_SPEC.md** - Complete gamification design
- **GAMIFICATION_API.md** - API reference and integration guide
- **src/utils/gamification.ts** - Current implementation
- **src/types/gamification.ts** - Type definitions
- **src/hooks/useGamification.ts** - React hook interface

---

## Questions & Support

For implementation questions or clarifications, refer to the original specification documents or create a new task in the admin panel with the "gamification" tag.

Last Updated: 2025-11-20
