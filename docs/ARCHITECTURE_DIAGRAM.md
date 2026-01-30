# Dreamcatcher Architecture Diagrams

## 1. Subscription Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                    USER TIER HIERARCHY                      │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   Premium   │  $16.99/mo or $149.99/yr
                    │ Architect   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    Unlimited        Cinematic Videos    1 Free/Month
    Analyses        (up to 3 min)        DreamWorld
         │                 │                 │
         └────────────────┬┴─────────────────┘
                          │
                   ┌──────▼──────┐
                   │     PRO     │  $8.99/mo or $69.99/yr
                   │  Visionary  │
                   └──────┬──────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
       20/month       Short Videos      Purchase @
       Analyses      (15-30 sec)        $6.99/each
          │               │               │
          └───────────────┼───────────────┘
                          │
                   ┌──────▼──────┐
                   │    FREE     │  $0/month
                   │   Dreamer   │
                   └──────┬──────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
       2/month    Watermarked        Demo Access
       Analyses      Images         + 3 Teasers
          │               │               │
          └───────────────┴───────────────┘
```

## 2. Database Schema Relationship

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                         BLINK AUTH                         │  │
│  │        (Users table - managed by Blink SDK)                │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │ id | email | displayName | avatar | metadata | ... │   │  │
│  │  └────────────┬──────────────────────────────────────┘   │  │
│  └───────────────┼──────────────────────────────────────────┘  │
│                  │ FK: user_id                                   │
│                  │                                               │
│  ┌───────────────▼──────────────────────────────────────────┐  │
│  │              USER_PROFILES                              │  │
│  │     (Subscription & Usage Tracking)                     │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ id (PK)                 TEXT                           │  │
│  │ user_id (FK)            TEXT (indexed)                 │  │
│  │ ◆ subscription_tier     TEXT (free|pro|premium)        │  │
│  │ ◆ dreams_analyzed_this_month  INTEGER                  │  │
│  │ ◆ last_reset_date       TEXT (ISO timestamp)           │  │
│  │ name, age, gender       TEXT/INT (profile)             │  │
│  │ nightmare_prone         INT (0/1 flag)                 │  │
│  │ recurring_dreams        INT (0/1 flag)                 │  │
│  │ onboarding_completed    INT (0/1 flag)                 │  │
│  │ created_at, updated_at  TEXT (audit)                   │  │
│  └────────┬─────────────────────────────┬─────────────────┘  │
│           │ 1:N                         │ 1:N                  │
│           │                             │                      │
│  ┌────────▼──────────────────┐  ┌──────▼──────────────────┐   │
│  │       DREAMS              │  │    DREAM_WORLDS         │   │
│  ├───────────────────────────┤  ├─────────────────────────┤   │
│  │ id (PK)       TEXT         │  │ id (PK)       TEXT      │   │
│  │ user_id (FK)  TEXT         │  │ user_id (FK)  TEXT      │   │
│  │ title         TEXT         │  │ title         TEXT      │   │
│  │ description   TEXT         │  │ description   TEXT      │   │
│  │ input_type    TEXT         │  │ dream_ids     TEXT (JSON)│   │
│  │ image_url     TEXT         │  │ video_url     TEXT      │   │
│  │ interpretation TEXT        │  │ thumbnail_url TEXT      │   │
│  │ video_url     TEXT         │  │ duration_sec  INT       │   │
│  │ tags          TEXT (JSON)  │  │ generated_at  TEXT      │   │
│  │ created_at    TEXT         │  │ created_at    TEXT      │   │
│  │ updated_at    TEXT         │  │ updated_at    TEXT      │   │
│  └───────────────────────────┘  └─────────────────────────┘   │
│                                                                  │
│  ◆ = Subscription-related fields (PRIMARY FOCUS)               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 3. Data Flow: Dream Analysis

```
┌──────────────┐
│    START     │
│  User Input  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Load user_profiles                   │
│ WHERE user_id = current_user         │
└──────┬───────────────────────────────┘
       │ Returns: subscription_tier, dreams_analyzed_this_month
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ canCreateDreamAnalysis()                                 │
│ Check: dreams_analyzed_this_month < tier_limit           │
│                                                           │
│  Free:    2/month     │  Pro: 20/month  │  Premium: ∞   │
└──────┬────────────────────────────────────────────────────┘
       │
   ┌───┴────────────────────────────────┐
   │                                    │
   ▼ ALLOWED                           ▼ DENIED
┌─────────────────┐            ┌──────────────────────┐
│ Proceed with    │            │ Show Limit Reached   │
│ Analysis        │            │ Prompt to Upgrade    │
└────┬────────────┘            └──────────────────────┘
     │
     ├─────────────────────────┬──────────────────────┐
     │                         │                      │
     ▼                         ▼                      ▼
┌─────────────┐      ┌──────────────────┐   ┌────────────────┐
│  1. Create  │      │  2. Generate     │   │  3. Generate   │
│  Dream      │      │  Interpretation  │   │  Image (AI)    │
│  Record     │      │  (AI)            │   │                │
└─────────────┘      └──────────────────┘   └────┬───────────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                             │
                                    ▼ subscription_tier == free   │
                                ┌──────────────┐                 │
                                │  Apply       │ subscription_tier != free
                                │  Watermark   │                 │
                                │  Client-side │                 │
                                │  Canvas API  │                 │
                                └────┬─────────┘                 │
                                     │                           │
                    ┌────────────────┴───────────────┐           │
                    │                                │           │
                    ▼                                ▼           ▼
         ┌──────────────────┐          ┌──────────────────────────────┐
         │ Upload Watermarked│          │ Upload Original (No Watermark)
         │ Version          │          └──────────────────────────────┘
         └────┬─────────────┘                       │
              │                                     │
              └──────────────┬──────────────────────┘
                             │
                             ▼
                  ┌─────────────────────────┐
                  │  Store URL in           │
                  │  dreams.image_url       │
                  └─────────┬───────────────┘
                            │
                            ▼
                  ┌─────────────────────────┐
                  │  Increment              │
                  │  dreams_analyzed_...    │
                  │  in user_profiles       │
                  └─────────┬───────────────┘
                            │
                            ▼
                  ┌─────────────────────────┐
                  │    Show Results         │
                  │    to User              │
                  └─────────────────────────┘
```

## 4. Request Flow: Frontend → Backend

```
Frontend (React)                  Backend (Blink)
────────────────────────────────────────────────────

DreamInput.tsx
    │
    ├─→ await blink.auth.me()
    │   ├─→ Validates JWT
    │   └─→ Returns user { id, email, ... }
    │
    ├─→ await blink.db.userProfiles.list({
    │   │   where: { userId: user.id }
    │   │ })
    │   └─→ Query: SELECT * FROM user_profiles
    │       WHERE user_id = ?
    │       ↓
    │       Returns: [{ subscription_tier, 
    │                   dreams_analyzed_this_month,
    │                   ... }]
    │
    ├─→ canCreateDreamAnalysis(tier, count)
    │   └─→ Client-side validation
    │
    ├─→ await blink.ai.generateImage({
    │   │   prompt: "...",
    │   │   n: 1
    │   │ })
    │   └─→ API Call → Gemini 2.5 Flash
    │       ↓
    │       Returns: { data: [{ url: "https://..." }] }
    │
    ├─→ shouldApplyWatermark(tier)
    │   └─→ Client-side check: tier === 'free'
    │
    ├─→ applyWatermark(imageUrl)
    │   └─→ Canvas API (browser-based)
    │       ↓
    │       Returns: Blob (watermarked image)
    │
    ├─→ await blink.storage.upload(
    │   │   file,
    │   │   `dreams/${userId}/${timestamp}.png`
    │   │ })
    │   └─→ Upload to Blink Storage (S3)
    │       ↓
    │       Returns: { publicUrl: "https://storage...." }
    │
    ├─→ await blink.db.dreams.create({
    │   │   userId, title, description,
    │   │   imageUrl, interpretation, tags
    │   │ })
    │   └─→ INSERT INTO dreams (...)
    │       VALUES (...)
    │
    └─→ await blink.db.userProfiles.update(
        │   profileId,
        │   { dreamsAnalyzedThisMonth: count + 1 }
        │ )
        └─→ UPDATE user_profiles
            SET dreams_analyzed_this_month = ?,
                updated_at = ?
            WHERE id = ?
```

## 5. Monthly Reset Logic

```
User Session Start
       │
       ▼
┌──────────────────────────────────────────┐
│ Load last_reset_date from user_profiles  │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ shouldResetMonthlyUsage(lastResetDate)   │
│                                           │
│ Compares:                                │
│  lastReset.getMonth() == now.getMonth()? │
│  lastReset.getFullYear() ==              │
│    now.getFullYear()?                    │
└──────┬───────────────────────────────────┘
       │
   ┌───┴─────────────────────┐
   │                         │
   ▼ SAME MONTH             ▼ NEW MONTH
┌────────────────┐       ┌─────────────────┐
│ Continue with  │       │ Reset Counter   │
│ current count  │       │                 │
└────────────────┘       │ UPDATE:         │
                         │ - dreams_...    │
                         │   = 0           │
                         │ - last_reset    │
                         │   = NOW()       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Return 0 to     │
                         │ frontend        │
                         │ (fresh limit)   │
                         └─────────────────┘
```

## 6. Scalability Pyramid

```
                      1,000,000+
                    ┌─────────────┐
                    │   SCALE 4   │
                    │ Enterprise  │
                    │ & Analytics │
                    ├─────────────┤
                    │ • Analytics │
                    │   tables    │
                    │ • Cache     │
                    │   layer     │
                    │ • Replicas  │
                    └─────────────┘
                          △
                    ┌─────────────┐
                    │   SCALE 3   │
                    │  500K-1M    │
                    │    Users    │
                    ├─────────────┤
                    │ • Indexes   │
                    │ • Caching   │
                    │ • Monitoring
                    └─────────────┘
                          △
                    ┌─────────────┐
                    │   SCALE 2   │
                    │ 100K-500K   │
                    │    Users    │
                    ├─────────────┤
                    │ • Query opt │
                    │ • Async ops │
                    │ • Logging   │
                    └─────────────┘
                          △
                    ┌─────────────┐
                    │   CURRENT   │
                    │ 1K-100K     │
                    │    Users    │
                    ├─────────────┤
                    │ ✅ Ready    │
                    │    to go    │
                    └─────────────┘
         Current Infrastructure Capacity
```

## 7. Cost Model by Tier

```
FREE TIER
┌─────────────────────────────────────────┐
│ Cost: $0/month                          │
│ Revenue: $0                             │
│ Database: ~100 KB/user (profile+dreams) │
│ Storage: ~500 MB/year (watermarked)     │
│ API Calls: 2 AI calls/month = ~$0.01    │
│                                         │
│ Monthly LTV: $0                         │
└─────────────────────────────────────────┘
              ↓ CONVERSION

PRO TIER
┌─────────────────────────────────────────┐
│ Cost: $8.99/month (monthly) or $69.99   │
│ Revenue: $8.99 - $69.99/year = $20-50   │
│ Database: ~200 KB/user                  │
│ Storage: ~2 GB/year (HD images)         │
│ API Calls: 20 AI calls/month = ~$0.10   │
│                                         │
│ Monthly LTV: ~$8.99                     │
│ Annual LTV: ~$69.99                     │
└─────────────────────────────────────────┘
              ↓ CONVERSION

PREMIUM TIER
┌─────────────────────────────────────────┐
│ Cost: $16.99/month or $149.99/year      │
│ Revenue: $149.99/year or $203.88/year   │
│ Database: ~300 KB/user                  │
│ Storage: ~5 GB/year (cinematic videos)  │
│ API Calls: Unlimited = ~$5-20/month     │
│ DreamWorld generation: ~$10-30/month    │
│                                         │
│ Monthly LTV: ~$16.99 + add-ons          │
│ Annual LTV: ~$149.99 + $150+ add-ons    │
│ Total Annual LTV: ~$300+                │
└─────────────────────────────────────────┘

COHORT ANALYSIS (100K USERS)
┌──────────────────────────────────────────┐
│ Free:     80,000 × $0      = $0           │
│ Pro:      15,000 × $69.99  = $1,049,850   │
│ Premium:   5,000 × $149.99 = $749,950     │
│ ────────────────────────────────────────  │
│ Annual MRR: ~$146,490                    │
│ Customer LTV: ~$58.60 avg                │
└──────────────────────────────────────────┘
```

---

## Key Performance Indicators

### Database Health
```
Metrics to Monitor:

✅ Query Performance
   - user_profiles lookup: <50ms (indexed)
   - dreams list by user: <100ms
   - dream_worlds creation: <200ms

✅ Concurrent Users
   - Target: 100K concurrent
   - Connection pool: 50-100 per region
   - Blink handles scaling automatically

✅ Storage Utilization
   - Images: 1-5 MB per dream
   - Metadata: ~2 KB per record
   - Total storage: Linear with user growth

✅ API Latency
   - Auth check: <20ms
   - Tier validation: <10ms
   - AI generation: 10-30 seconds (async)
   - Image upload: <2 seconds
```

---

## Admin Panel Architecture

```
┌──────────────────────────────────────────────────────┐
│                  ADMIN ROUTES (SECURED)              │
├──────────────────────────────────────────────────────┤
│ /admin                    → AdminDashboard           │
│ /admin/users              → AdminUserManagement      │
│ /admin/tasks              → AdminTasksPage           │
│ /admin/analytics          → AdminAnalytics           │
│ /admin/revenue            → AdminRevenuePage         │
│ /admin/features           → AdminFeatureManagement   │
│ /admin/email              → AdminEmailSettings       │
└──────────────────────────────────────────────────────┘
         ↓ (All wrapped in AdminRoute protection)
    ┌────────────────────────────────────────┐
    │   AdminDashboardLayout (Layout)        │
    │   - Header with navigation             │
    │   - Sidebar with menu items            │
    │   - Role-based access control          │
    └────────────────────────────────────────┘
```

---

## Next Steps

1. **Phase 1 (Now):** ✅ Admin routes implemented - add server-side tier validation
2. **Phase 2 (100K users):** Implement Stripe integration
3. **Phase 3 (500K users):** Add performance indexes
4. **Phase 4 (1M users):** Implement caching & analytics

