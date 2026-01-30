# DreamCatcher Gamification API Reference

## Overview

This document describes all gamification-related API endpoints and client functions available in the DreamCatcher application.

## Database Operations

All gamification operations use the Blink SDK's database interface.

### Gamification Profiles

#### Get User Profile

```typescript
import { getGamificationProfile } from '@/utils/gamification'

const profile = await getGamificationProfile(userId: string)

// Returns:
{
  id: string
  userId: string
  dreamCoins: number
  level: number
  totalXp: number
  currentStreak: number
  bestStreak: number
  lastActivityDate?: string
  badges: string[]
  referralCode?: string
  createdAt: string
  updatedAt: string
}
```

#### Initialize Profile

```typescript
import { initializeGamificationProfile } from '@/utils/gamification'

const profile = await initializeGamificationProfile(userId: string)
```

### Coin Management

#### Award Coins

```typescript
import { awardCoins } from '@/utils/gamification'

const transaction = await awardCoins(
  userId: string,
  reason: CoinRewardReason,
  multiplier?: number = 1,
  metadata?: Record<string, any>
)

// CoinRewardReason options:
// 'log_dream' | 'add_symbols' | 'add_emotions' | 'complete_form' |
// 'daily_streak' | 'weekly_challenge' | 'monthly_challenge' |
// 'share_snapshot' | 'share_tts' | 'referral' | 'daily_open' |
// 'reward_redemption' | 'admin_grant'
```

#### Award Dream (Comprehensive)

```typescript
import { awardDreamCoins } from '@/utils/gamification'

const result = await awardDreamCoins(userId: string, {
  hasSymbols?: boolean
  symbolCount?: number
  hasEmotions?: boolean
  emotionCount?: number
  isComplete?: boolean
})

// Returns:
{
  total: number // Total coins awarded
  breakdown: CoinTransaction[] // Detailed transaction list
}
```

#### Deduct Coins

```typescript
import { deductCoins } from '@/utils/gamification'

const transaction = await deductCoins(
  userId: string,
  amount: number,
  reason?: string = 'reward_redemption',
  metadata?: Record<string, any>
)

// Throws error if insufficient balance
```

#### Get Transaction History

```typescript
import { getCoinTransactions } from '@/utils/gamification'

const transactions = await getCoinTransactions(
  userId: string,
  limit?: number = 50
)

// Returns: CoinTransaction[]
```

### Streak System

#### Update Streak

```typescript
import { updateStreak } from '@/utils/gamification'

const streakData = await updateStreak(userId: string)

// Returns:
{
  currentStreak: number
  bestStreak: number
  lastActivityDate?: string
  todayRewardEarned: boolean
}
```

### Badges and Achievements

#### Award Badge

```typescript
import { awardBadge } from '@/utils/gamification'

await awardBadge(userId: string, badgeId: string)

// Available badge IDs:
// 'dream_explorer' | 'nightmare_navigator' | 'week_warrior' |
// 'dream_master' | 'symbol_sage' | 'emotion_expert' |
// 'referral_champion' | 'month_mystic'
```

#### Check and Award Badges

```typescript
import { checkAndAwardBadges } from '@/utils/gamification'

const newBadges = await checkAndAwardBadges(userId: string)

// Returns: string[] (IDs of newly unlocked badges)
```

### Level System

#### Get Level Data

```typescript
import { getUserLevelData } from '@/utils/gamification'

const levelData = await getUserLevelData(userId: string)

// Returns:
{
  level: number // Current level (1-15)
  totalXp: number // Total XP accumulated
  xpForNextLevel: number // XP needed for next level
  progress: number // Progress percentage (0-100)
}
```

#### Calculate Level

```typescript
import { calculateLevel } from '@/types/gamification'

const levelData = calculateLevel(totalXp: number)

// Returns same structure as getUserLevelData
```

### Leaderboard

#### Update Leaderboard

```typescript
import { updateLeaderboard } from '@/utils/gamification'

await updateLeaderboard(userId: string)
```

#### Get Global Leaderboard

```typescript
const entries = await blink.db.leaderboardEntries.list({
  orderBy: { score: 'desc' },
  limit: 50
})

// Returns: LeaderboardEntry[]
{
  id: string
  userId: string
  displayName: string
  score: number // Total XP
  rank?: number
  updatedAt: string
}
```

#### Get User Rank

```typescript
const entries = await blink.db.leaderboardEntries.list({
  where: { userId },
  limit: 1
})

const userEntry = entries?.[0]
const userRank = await blink.db.leaderboardEntries.list({
  orderBy: { score: 'desc' }
})
const rank = (userRank || []).findIndex(e => e.userId === userId) + 1
```

## React Hook Interface

### useGamification Hook

```typescript
import { useGamification } from '@/hooks/useGamification'

const {
  profile,              // GamificationProfile | null
  levelData,            // LevelData | null
  streak,               // StreakData | null
  recentTransactions,   // CoinTransaction[]
  loading,              // boolean
  error,                // string | null
  refreshProfile,       // () => Promise<void>
  logDream,             // (dreamData) => Promise<void>
  claimDailyBonus,      // () => Promise<void>
  newBadges,            // string[]
} = useGamification(userId)

// Usage in logDream:
await logDream({
  hasSymbols: true,
  symbolCount: 3,
  hasEmotions: true,
  emotionCount: 2,
  isComplete: true
})
```

## Component Integration

### DreamCoinsDisplay

```typescript
import { DreamCoinsDisplay } from '@/components/DreamCoinsDisplay'

<DreamCoinsDisplay 
  userId={userId}
  onOpenStore={() => setStoreOpen(true)}
/>
```

**Props:**
- `userId: string` - User ID to display coins for
- `onOpenStore?: () => void` - Callback when store button clicked

**Displays:**
- Current Dream Coins balance (animated)
- Current level with XP progress bar
- Current streak with flame emoji
- Best streak reference

### StreakTracker

```typescript
import { StreakTracker } from '@/components/StreakTracker'

<StreakTracker 
  userId={userId}
  onStreakUpdate={(streak) => console.log(streak)}
/>
```

**Props:**
- `userId: string` - User ID to track streak for
- `onStreakUpdate?: (streak: StreakData) => void` - Callback on updates

**Displays:**
- Current/best streak comparison
- Daily reward amount
- Reward progress to next milestone
- Time until streak reset
- Weekly progress calendar
- Milestone badges (7/14/30/60 days)

### RewardsStore

```typescript
import { RewardsStore } from '@/components/RewardsStore'

<RewardsStore 
  userId={userId}
  open={open}
  onOpenChange={setOpen}
/>
```

**Props:**
- `userId: string` - User ID for coin deduction
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - Dialog state callback

**Features:**
- Tab-based filtering (All/Cosmetic/Functional/Content)
- Real-time coin balance display
- Reward redemption
- Owned reward indicators
- Insufficient coins warning

### Leaderboard

```typescript
import { Leaderboard } from '@/components/Leaderboard'

<Leaderboard 
  userId={userId}
  open={open}
  onOpenChange={setOpen}
/>
```

**Props:**
- `userId: string` - User ID for rank lookup
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - Dialog state callback

**Features:**
- Global leaderboard (top 50)
- User rank details
- Medal indicators (🥇🥈🥉)
- Nearby rankings
- XP to next rank calculation

### AchievementBadges

```typescript
import { AchievementBadges } from '@/components/AchievementBadges'

<AchievementBadges 
  userId={userId}
  open={open}
  onOpenChange={setOpen}
/>
```

**Props:**
- `userId: string` - User ID to display achievements for
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - Dialog state callback

**Features:**
- Earned badges showcase
- Locked badges preview
- Badge descriptions and requirements
- Category information

## Data Flow Examples

### Complete Dream Logging Flow

```typescript
import { useGamification } from '@/hooks/useGamification'

function DreamForm({ userId }: { userId: string }) {
  const { logDream, profile, newBadges } = useGamification(userId)
  const [formData, setFormData] = useState({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Log dream with gamification
      await logDream({
        hasSymbols: formData.symbols?.length > 0,
        symbolCount: formData.symbols?.length || 0,
        hasEmotions: formData.emotions?.length > 0,
        emotionCount: formData.emotions?.length || 0,
        isComplete: validateForm(formData),
      })

      // Show achievements
      if (newBadges.length > 0) {
        toast.success(`🎉 Earned: ${newBadges.join(', ')}`)
      }

      // Show coin rewards
      toast.success('✨ Dream Coins earned!')

      // Clear form and refresh
      setFormData({})
    } catch (error) {
      toast.error('Failed to log dream')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>Balance: {profile?.dreamCoins} DC</div>
      {/* Form fields */}
      <button type="submit">Log Dream</button>
    </form>
  )
}
```

### Daily Bonus Claim

```typescript
import { useGamification } from '@/hooks/useGamification'

function DailyBonusCard({ userId }: { userId: string }) {
  const { claimDailyBonus, profile } = useGamification(userId)
  const [claimed, setClaimed] = useState(false)

  const handleClaim = async () => {
    try {
      await claimDailyBonus()
      setClaimed(true)
      toast.success('Daily bonus claimed!')
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const lastActivity = profile?.lastActivityDate?.split('T')[0]
  const alreadyClaimed = lastActivity === today

  return (
    <Card>
      <CardHeader>Daily Bonus</CardHeader>
      <CardContent>
        <p>{alreadyClaimed ? 'Already claimed!' : 'Claim 5 DC now'}</p>
        <Button onClick={handleClaim} disabled={alreadyClaimed || claimed}>
          Claim
        </Button>
      </CardContent>
    </Card>
  )
}
```

## Error Handling

```typescript
import { useGamification } from '@/hooks/useGamification'

function GameComponent({ userId }: { userId: string }) {
  const { error, loading, logDream } = useGamification(userId)

  const handleAction = async () => {
    try {
      await logDream({ isComplete: true })
    } catch (err) {
      console.error('Gamification error:', err)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />

  return <button onClick={handleAction}>Take Action</button>
}
```

## Type Definitions

### CoinRewardReason

```typescript
type CoinRewardReason =
  | 'log_dream'
  | 'add_symbols'
  | 'add_emotions'
  | 'complete_form'
  | 'daily_streak'
  | 'weekly_challenge'
  | 'monthly_challenge'
  | 'share_snapshot'
  | 'share_tts'
  | 'referral'
  | 'daily_open'
  | 'reward_redemption'
  | 'admin_grant'
```

### RewardType

```typescript
type RewardType =
  | 'theme'
  | 'voice_pack'
  | 'symbol_pack'
  | 'snapshot_pack'
  | 'avatar'
  | 'soundscape'
  | 'feature_unlock'
```

### RewardCategory

```typescript
type RewardCategory = 'cosmetic' | 'functional' | 'content'
```

## Rate Limiting

No explicit rate limiting is implemented, but consider these limits:
- Max 1 coin transaction per dream log
- Streak updates once per 24-hour period
- Badge checks run on dream log only

## Best Practices

1. **Always await async operations** - Gamification operations update database
2. **Refresh profile after major actions** - Ensures UI stays in sync
3. **Handle errors gracefully** - Show user-friendly messages
4. **Debounce rapid requests** - Prevent duplicate coin awards
5. **Display feedback immediately** - Use optimistic updates
6. **Track new badges** - Show achievements prominently
7. **Consider mobile performance** - Lazy load leaderboard data

## Testing

```typescript
// Mock gamification for testing
vi.mock('@/utils/gamification', () => ({
  getGamificationProfile: vi.fn(() => ({
    dreamCoins: 1000,
    level: 5,
    totalXp: 3000,
  })),
  awardCoins: vi.fn(),
  logDream: vi.fn(),
}))
```

## Production Deployment Notes

⚠️ **IMPORTANT: Before deploying gamification to production environment:**

1. **Review GAMIFICATION_MAINTENANCE_GUIDE.md** for critical security and reliability fixes
2. **Implement retry logic** with exponential backoff for transaction failures
3. **Add coin limit validations** to prevent exploitation
4. **Enable monitoring** of gamification health metrics
5. **Plan data migration** carefully to avoid consistency issues
6. **Test under load** to ensure database performance
7. **Set up error logging** and alerting for anomalies

Current implementation is production-ready for core features, but enhancements listed in the maintenance guide are strongly recommended before full rollout.

## Future API Additions

- `/api/gamification/challenges` - Get active challenges
- `/api/gamification/statistics` - User gamification statistics
- `/api/gamification/friends` - Friends leaderboard
- `/api/gamification/events` - Special events and promotions
- `/api/gamification/health` - System health metrics (admin only)
- `/api/gamification/anomalies` - Detect suspicious patterns (admin only)
