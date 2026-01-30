# DreamCatcher Gamification System

## Overview

The DreamCatcher gamification system is designed to enhance user engagement and create a rewarding experience for dream explorers. It implements a comprehensive system of Dream Coins, achievements, streaks, and leaderboards.

## Dream Coins System

### What are Dream Coins (DC)?

Dream Coins are the primary currency in DreamCatcher's gamification system. Users earn coins by logging dreams and engaging with various features. These coins can be redeemed for exclusive rewards.

### Coin Earning Opportunities

| Activity | Base Reward | Details |
|----------|------------|---------|
| Log Dream | 100 DC | Base reward for logging a dream |
| Add Symbols | 5 DC each | Per symbol added (capped at 20 per dream) |
| Add Emotions | 10 DC each | Per emotion added (capped at 10 per dream) |
| Complete Full Form | 20 DC | Bonus for completing all dream details |
| Daily Open | 5 DC | First action of the day |
| Daily Streak | 25-300 DC | Scales with streak length (see Streaks) |
| Weekly Challenge | 150 DC | Completion of weekly challenges |
| Monthly Challenge | 300 DC | Completion of monthly challenges |
| Share Snapshot | 75 DC | Share dream snapshot image |
| Share Text-to-Speech | 75 DC | Share interpretation audio |
| Referral Bonus | 250 DC | When referred friend completes signup |

### Coin Multipliers

Certain conditions provide coin multipliers:
- Premium subscription: 1.5x multiplier on all earnings
- Special events: Up to 2x multiplier during promotional periods
- Achievement unlock: 1.1x multiplier for next 24 hours

## Streak System

### Streak Mechanics

A streak is maintained when users log at least one dream per day. The streak resets if a user fails to log for 24 hours.

### Streak Rewards

Daily streaks provide escalating rewards:

| Day | Reward | Milestone |
|-----|--------|-----------|
| 1 | 25 DC | Day One Dreamer |
| 2 | 50 DC | - |
| 3 | 75 DC | - |
| 4 | 100 DC | - |
| 5 | 150 DC | - |
| 6 | 200 DC | - |
| 7+ | 300 DC | Week Warrior Badge |
| 14+ | 400 DC | Two Weeks Strong |
| 30+ | 500 DC | Month Mystic Badge |
| 60+ | 750 DC | Streak Master Badge |

After day 7, the reward cycles back to the day 7 amount (300 DC).

### Streak Features

- **Streak Counter**: Real-time display of current and best streaks
- **Warning System**: Users receive notifications 24 hours before streak reset
- **Recovery**: One-time per month, users can skip one day without losing streak
- **Freeze Token**: Premium feature to pause streak timer for 24 hours

## Level Progression System

### XP and Levels

Users progress through 15 levels by accumulating XP. Each Dream Coin earned equals 1 XP.

### Level Thresholds

| Level | Total XP Required | Coins Needed |
|-------|------------------|--------------|
| 1 | 0 | 0 |
| 2 | 500 | 500 |
| 3 | 1,200 | 700 |
| 4 | 2,000 | 800 |
| 5 | 3,000 | 1,000 |
| 6 | 4,500 | 1,500 |
| 7 | 6,500 | 2,000 |
| 8 | 9,000 | 2,500 |
| 9 | 12,000 | 3,000 |
| 10 | 16,000 | 4,000 |
| 11 | 20,000 | 4,000 |
| 12 | 25,000 | 5,000 |
| 13 | 30,000 | 5,000 |
| 14 | 40,000 | 10,000 |
| 15 | 50,000 | 10,000 |

### Level Benefits

- **Visual Representation**: Badges and titles update with each level
- **Unlock Rewards**: New rewards become available at each level
- **Leaderboard Ranking**: Based on total XP (converted from levels)
- **Recognition**: Level 10+ users get special badge on profile

## Achievement Badges System

### Available Badges

| Badge | Icon | Requirement | Reward |
|-------|------|-------------|--------|
| Dream Explorer | 🌙 | Log first dream | 50 DC bonus |
| Nightmare Navigator | 😱 | Log 5 nightmares | Special theme |
| Week Warrior | 🔥 | 7-day streak | 100 DC bonus |
| Dream Master | ⭐ | Log 50 dreams | 200 DC bonus |
| Symbol Sage | 🔮 | Add symbols to 20 dreams | Symbol pack |
| Emotion Expert | 💭 | Add emotions to 30 dreams | Theme unlock |
| Referral Champion | 🎁 | Refer 3 friends | 500 DC bonus |
| Month Mystic | ✨ | 30-day streak | 300 DC bonus |

### Badge Features

- Progressive tracking towards locked badges
- Notification on new badge unlock
- Badge showcase on user profile
- Special badge perks (cosmetic or functional)

## Rewards Store

### Reward Categories

#### Cosmetic Rewards
- **Themes**: Galaxy (500 DC), Sunset (500 DC), Midnight (750 DC)
- **Avatars**: Lunar (250 DC), Stellar (350 DC), Celestial (400 DC)
- **Profile Borders**: Gold (300 DC), Silver (200 DC), Rainbow (500 DC)

#### Functional Rewards
- **Voice Packs**: Calm Female (300 DC), Wise Male (300 DC), Mystical (400 DC)
- **Soundscapes**: Rainy Night (400 DC), Ocean Waves (400 DC), Forest (400 DC)
- **Feature Unlocks**: Extra dream snapshots 3-pack (1,500 DC), Symbol library (750 DC)

#### Content Rewards
- **Symbol Pack**: Mystical (750 DC), Archetypal (800 DC), Cultural (900 DC)
- **Dream Snapshot Pack**: 3 generations (1,500 DC), 10 generations (4,000 DC)

### Reward Mechanics

- **One-Time Purchase**: Cosmetic rewards purchased once remain forever
- **Consumable**: Feature unlocks like snapshot packs are consumable
- **No Refunds**: Coins cannot be refunded after purchase
- **Limited Stock**: Some seasonal rewards are limited-time only

## Leaderboard System

### Leaderboard Types

#### Global Leaderboard
- Ranks users by total XP (converted from Dream Coins)
- Updates in real-time as users earn coins
- Top 50 visible to all users
- Shows user's rank and nearby competitors

#### Friends Leaderboard
- Allows users to compare with added friends
- Requires mutual friend connection
- Optional feature (users can disable)

### Ranking System

- **Medals**: 🥇 #1, 🥈 #2, 🥉 #3, 🏅 #4+
- **Score Calculation**: Total XP accumulated
- **Tie Breaking**: Most recent activity wins
- **Historical Tracking**: Previous month's top rankers archived

## Challenges System

### Daily Challenges

Small, achievable daily tasks:
- Log a dream (100 DC base)
- Add 5+ symbols to dreams (50 DC)
- Add 3+ emotions to dreams (50 DC)
- Complete 2 full dream forms (75 DC)

**Reward**: Base reward + challenge bonus (25 DC)

### Weekly Challenges

Larger tasks spanning 7 days:
- Complete 5 full dream forms (200 DC)
- Maintain a 7-day streak (150 DC)
- Analyze 50+ symbols (150 DC)
- Share 2 dreams (100 DC)

**Reward**: 150 DC on completion

### Monthly Challenges

Major achievements spanning 30 days:
- Log 20 dreams (300 DC)
- Maintain 30-day streak (500 DC)
- Reach Level 5+ (400 DC)
- Unlock 3 badges (300 DC)

**Reward**: 300 DC on completion + special monthly badge

## Referral System

### Referral Mechanics

- **Code Generation**: Each user gets unique referral code (e.g., DRM-ABC123)
- **Signup Bonus**: Referred user gets 50 free Dream Coins on signup
- **Referrer Bonus**: Referrer gets 250 DC when friend logs first dream
- **Caps**: Maximum 10 successful referrals per month

### Referral Tracking

- Track referred users and conversion status
- View referral history and earnings
- Generate custom referral links
- Share via email, social media, or direct link

## Technical Implementation

### Database Tables

```sql
-- Gamification Profile (per user)
gamification_profiles:
  - id, user_id, dream_coins, level, total_xp
  - current_streak, best_streak, last_activity_date
  - badges (JSON), referral_code

-- Coin Transactions
coin_transactions:
  - id, user_id, amount, reason, metadata, created_at

-- Rewards Catalog
rewards_catalog:
  - id, name, description, cost_dc, type, category
  - details, is_active, created_at

-- User Rewards (Owned)
user_rewards:
  - id, user_id, reward_id, redeemed_at

-- Leaderboard Entries
leaderboard_entries:
  - id, user_id, display_name, score, rank, updated_at
```

### Key Files

- `src/types/gamification.ts` - TypeScript types and constants
- `src/utils/gamification.ts` - Core gamification logic
- `src/hooks/useGamification.ts` - React hook for gamification integration
- `src/components/DreamCoinsDisplay.tsx` - Coin counter component
- `src/components/StreakTracker.tsx` - Streak display component
- `src/components/RewardsStore.tsx` - Rewards store component
- `src/components/Leaderboard.tsx` - Leaderboard component
- `src/components/AchievementBadges.tsx` - Badges display component

## Integration Guide

### Using the Gamification Hook

```typescript
import { useGamification } from '@/hooks/useGamification'

function DreamForm({ userId }: { userId: string }) {
  const { logDream, profile, newBadges } = useGamification(userId)

  const handleSubmit = async (dreamData: any) => {
    await logDream({
      hasSymbols: dreamData.symbols?.length > 0,
      symbolCount: dreamData.symbols?.length || 0,
      hasEmotions: dreamData.emotions?.length > 0,
      emotionCount: dreamData.emotions?.length || 0,
      isComplete: dreamData.completed,
    })

    if (newBadges.length > 0) {
      toast.success(`Unlocked: ${newBadges.join(', ')}`)
    }
  }

  return (
    <div>
      <p>Balance: {profile?.dreamCoins} DC</p>
      {/* Form fields */}
    </div>
  )
}
```

### Displaying Components

```typescript
function Dashboard() {
  const [storeOpen, setStoreOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)

  return (
    <>
      <DreamCoinsDisplay userId={userId} onOpenStore={() => setStoreOpen(true)} />
      <StreakTracker userId={userId} />
      
      <RewardsStore userId={userId} open={storeOpen} onOpenChange={setStoreOpen} />
      <Leaderboard userId={userId} open={leaderboardOpen} onOpenChange={setLeaderboardOpen} />
      <AchievementBadges userId={userId} open={achievementsOpen} onOpenChange={setAchievementsOpen} />
    </>
  )
}
```

## Design Principles

1. **Progression**: Users see constant progress through levels and streaks
2. **Reward Frequency**: Frequent small rewards encourage daily engagement
3. **Challenges**: Varying difficulty levels keep experiences fresh
4. **Social**: Leaderboards and referrals add competitive element
5. **Accessibility**: All rewards can be earned without spending money
6. **Fairness**: No pay-to-win mechanics; premium only provides cosmetics

## Maintenance & Future Improvements

**⚠️ IMPORTANT: Before re-enabling gamification in production, review GAMIFICATION_MAINTENANCE_GUIDE.md**

This guide contains critical fixes and enhancements recommended for robustness, security, and performance:

### Critical Fixes (HIGH Priority)
1. Database transaction atomicity for coin operations
2. Retry logic with exponential backoff for failed transactions
3. Coin limit validations to prevent exploitation
4. Enhanced streak recovery with timezone awareness

### Optimizations (MEDIUM Priority)
5. Leaderboard query caching strategy
6. Batch coin transaction processing
7. Badge requirement verification to prevent inflation
8. Error logging and monitoring infrastructure

### Enhancements (LOW Priority)
9. Seasonal challenges and events system
10. Social features (friends leaderboards, team challenges)
11. Advanced metrics dashboard
12. Comprehensive unit test suite

See **GAMIFICATION_MAINTENANCE_GUIDE.md** for detailed implementation specifications, code examples, and rollout plan.

## Future Enhancements

- Social leagues and team challenges
- Seasonal events with limited-time rewards
- Dream journal milestones (1st dream, 100th dream, etc.)
- Community challenges with group rewards
- Dream analysis achievements (pattern recognition)
- Partner integrations for exclusive rewards
- Tiered VIP system with escalating perks

## Metrics and Analytics

Track user engagement through:
- Average coins earned per user per day
- Streak retention rates
- Badge unlock distribution
- Reward redemption patterns
- Leaderboard participation
- Challenge completion rates

## Monetization Strategy

The gamification system is designed to:
1. **Increase Engagement**: Keep users coming back daily
2. **Reduce Churn**: Streaks and achievements create habit formation
3. **Support Premium**: Cosmetic rewards encourage premium subscriptions
4. **Viral Growth**: Referral system incentivizes word-of-mouth
5. **In-App Purchases**: Optional coins can be purchased (future feature)
