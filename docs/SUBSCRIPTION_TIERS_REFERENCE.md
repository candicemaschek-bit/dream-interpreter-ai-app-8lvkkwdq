# 🎯 Subscription Tiers Reference - SINGLE SOURCE OF TRUTH

**Status:** ✅ **CURRENT & AUTHORITATIVE**  
**Last Updated:** 2025-12-01  
**Version:** 3.0 (Verified against subscription.ts)  
**⚠️ DO NOT DUPLICATE - Reference this file only**

---

## 📋 Purpose

This document is the **single authoritative source** for all subscription tier information in Dreamcatcher AI. All other documents, code comments, and marketing materials should reference this file.

**Source of Truth:** `src/types/subscription.ts` - All information below is verified against this file.

---

## 🎨 Subscription Tiers Overview

### Tier Naming Convention

**Code Constants:** `'free' | 'pro' | 'premium' | 'vip'` (internal TypeScript types)  
**User-Facing Names:** Dreamer | Visionary | Architect | Star (marketing/UI)

| Code | Display Name | Monthly Price | Annual Price | Annual Savings | Status |
|------|--------------|---------------|--------------|----------------|--------|
| `free` | **Dreamer** | $0 | $0 | N/A | ✅ Available |
| `pro` | **Visionary** | $9.99 | $99.90 | ~17% | ✅ Available |
| `premium` | **Architect** | $19.99 | $199.90 | ~17% | ✅ Available |
| `vip` | **Star** | $29.99 | $299.90 | ~17% | ⭐ Coming Soon |

---

## 📊 Complete Feature Matrix

### Core Dream Analysis Features

| Feature | Dreamer | Visionary | Architect | Star |
|---------|---------|-----------|-----------|------|
| **Dream Analyses Per Month** | 2 lifetime | 10/month | 20/month | 25/month |
| **AI Dream Interpretation** | ✅ | ✅ | ✅ | ✅ |
| **HD Dream Images** | ✅ | ✅ | ✅ | ✅ + Persona Avatar |
| **Symbolic Tags** | ✅ Extract | ✅ Full | ✅ Full | ✅ Full |
| **Voice Record Your Dreams** | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Deep Insights & Analysis** | ✅ | ✅ | ✅ | ✅ |
| **Recurring Dream Detection** | ❌ | ✅ | ✅ | ✅ |
| **Nightmare Cycle Analysis** | ❌ | ✅ | ✅ | ✅ |

### Audio & Video Features

| Feature | Dreamer | Visionary | Architect | Star |
|---------|---------|-----------|-----------|------|
| **Voice Recording (Transcription)** | ✅ Unlimited (No cost limits) | ✅ Unlimited (No cost limits) | ✅ Unlimited (No cost limits) | ✅ Unlimited (No cost limits) |
| **AI Voice Narration (TTS)** | ❌ | ❌ | ❌ | ✅ $0.94/month budget |
| **6-Second Video Generation** | ❌ | ❌ | ✅ Limited | ✅ Limited |
| **DreamWorlds (45s Cinematic)** | ❌ | ❌ | ❌ | ✅ 1/month included |
| **DreamWorlds Audio** | N/A | N/A | N/A | ✅ Voice + Music |

### Community & Advanced Features

| Feature | Dreamer | Visionary | Architect | Star |
|---------|---------|-----------|-----------|------|
| **Reflection Journal (ReflectAI)** | ❌ | ❌ | ✅ | ✅ |
| **Symbol Orchard (Symbolica AI)** | ❌ | ❌ | ✅ | ✅ |
| **Emotional Guidance (LumenAI)** | ❌ | ❌ | ❌ | ✅ |
| **Exclusive AI Models (4 total)** | ❌ | ❌ | ❌ | ✅ |
| **Persona Avatar** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ❌ | ✅ |

---

## 💎 Detailed Tier Specifications

### TIER 1: Dreamer (Free)

**Pricing:**
- Monthly: $0.00
- Annual: $0.00
- Type: Freemium tier - No credit card required

**Key Features:**
- 2 dream analyses (lifetime total, not per month)
- **Full Access to All Interpretation Sections:**
  - Overall Meaning: Full access
  - Key Symbols: Full access
  - Emotional Themes: Full access
  - Potential Life Connections: Full access
  - Guidance: Full access (includes Reflect AI button)
- Voice recording (Transcription): Available (No cost limits)
- Symbolic tags for dreams
- Deep insights on interpretations
- HD dream images (no watermarks)

**Dream Analysis Limit:**
- 2 lifetime total (never resets)
- Once limit reached, shows upgrade CTA to Visionary

**Cost to Operate:** ~$0.01 per user lifetime  
**Profit Model:** Lead generation for paid tiers

**Upgrade CTA:** "Unlock 10 monthly dream analyses with AI voice narration. Upgrade to Visionary for $9.99/month."

---

### TIER 2: Visionary (Pro)

**Pricing:**
- Monthly: $9.99
- Annual: $99.90 (save ~$19.98 vs monthly)
- Billing Cycles: Monthly or Annual

**Key Features:**
- 10 dream analyses per month
- **Full Access to All Interpretation Sections:**
  - Overall Meaning: Full access
  - Key Symbols: Full access
  - Emotional Themes: Full access
  - Potential Life Connections: Full access
  - Guidance: Full access (includes Reflect AI button)
- Voice recording (Transcription): Available (No cost limits)
- Symbolic tags (full analytics)
- Deep insights on all analyses
- HD dream images (no watermarks)
- Advanced recurring dream detection
- Nightmare cycle analysis
- Guided resolution paths
- Tag analytics with patterns

**Dream Analysis Limit:**
- 10 per month
- Auto-resets on month boundary
- Once reached, shows upgrade CTA

**TTS (Text-to-Speech):**
- ❌ Not available on Visionary tier
- Exclusive to VIP (Star) tier only

**Add-On Access:**
- Can purchase DreamWorlds individually ($6.99 each)
- Can purchase Deep Dive Report ($4.99)
- Can purchase DreamWorlds Bundle ($14.99 for 3)

**Cost to Operate:** ~$0.51/month per user  
**Profit Margin:** ~94.9%

**Upgrade CTA:** "Generate stunning 6-second videos of your dreams. Upgrade to Architect for $19.99/month."

---

### TIER 3: Architect (Premium)

**Pricing:**
- Monthly: $19.99
- Annual: $199.90 (save ~$39.98 vs monthly)
- Billing Cycles: Monthly or Annual

**Key Features:**
- 20 dream analyses per month
- **Full Access to All Interpretation Sections:**
  - Overall Meaning: Full access
  - Key Symbols: Full access + SymbolicaAI Integration badge
  - Emotional Themes: Full access
  - Potential Life Connections: Full access
  - Guidance: Full access + Reflect AI integration + SymbolicaAI Integration
- Voice recording (Transcription): Available (No cost limits)
- Symbolic tags (full analytics)
- Deep insights on all analyses
- HD dream images (no watermarks)
- Advanced recurring dream detection
- Nightmare cycle analysis
- Guided resolution paths
- Tag analytics with patterns
- **NEW:** 6-second video generation (per dream)
- Reflection Journal (ReflectAI) access
- Symbol Orchard (Symbolica AI) access

**Dream Analysis Limit:**
- 20 per month
- Auto-resets on month boundary

**Video Generation:**
- Generate 6-second HD videos of dreams
- Limited quantity per month (exact limit TBD in code)
- HD quality (1080p)
- No watermarks
- Automatically branded with "Dreamcatcher AI"

**Voice Recording & Transcription:**
- ✅ Unlimited audio transcription (no cost limits)
- Available on all tiers (Free, Pro, Premium, VIP)
- Monthly usage tracked for analytics only
- Auto-resets each month for reporting

**TTS (Text-to-Speech):**
- ❌ Not available on Architect tier
- Exclusive to VIP (Star) tier only

**Add-On Access:**
- Can purchase additional DreamWorlds ($6.99 each)
- Can purchase Deep Dive Report ($4.99)
- Can purchase DreamWorlds Bundle ($14.99 for 3)

**Cost to Operate:** ~$2.41/month per user  
**Profit Margin:** ~87.9%

**Upgrade CTA:** "Create cinematic 45-second DreamWorlds with AI voice narration and music. Upgrade to Star for $29.99/month."

---

### TIER 4: Star (VIP) ⭐

**Pricing:**
- Monthly: $29.99
- Annual: $299.90 (save ~$59.98 vs monthly)
- Billing Cycles: Monthly or Annual
- **Status:** ⭐ **Coming Soon** (Early Access Available)

**Key Features:**
- 25 dream analyses per month
- **Full Access to All Interpretation Sections:**
  - Overall Meaning: Full access
  - Key Symbols: Full access + SymbolicaAI Integration badge
  - Emotional Themes: Full access
  - Potential Life Connections: Full access
  - Guidance: Full access + Reflect AI integration
- Voice recording (Transcription): Available (No cost limits)
- **AI voice narration (TTS)** - AI Voice Narration for Dream Interpretation ($0.94/month budget)
- Symbolic tags (full analytics)
- Deep insights on all analyses
- HD dream images with **Persona Avatar**
- Advanced recurring dream detection
- Nightmare cycle analysis
- Guided resolution paths
- Tag analytics with patterns
- **6-second video generation** (enhanced)
- **1 DreamWorlds cinematic video per month (included)**
- Reflection Journal (ReflectAI) access
- Symbol Orchard (Symbolica AI) access
- Emotional Guidance & Mindfulness (LumenAI) access
- **4 exclusive AI models:**
  - AtlasAI (dream mapping & visualization)
  - ReflectAI (reflection journal)
  - SymbolicaAI (symbol analysis)
  - LumenAI (personalized guidance & mindfulness)
- Priority support
- Persona avatars on all dream images

**Dream Analysis Limit:**
- 25 per month
- Auto-resets on month boundary

**Video Generation:**
- Generate 6-second HD videos (enhanced quality)
- Limited quantity per month (exact limit TBD)
- Generate 1 DreamWorlds 45-second cinematic video per month (included)
- Can purchase additional DreamWorlds at $6.99 each
- Can purchase DreamWorlds bundle at $14.99 for 3
- Premium video quality (1080p cinematic)
- No watermarks

**TTS (Text-to-Speech):**
- ✅ Exclusive to VIP tier
- $0.94 monthly budget for AI voice narration
- Budget resets automatically each month
- Voice narration + music on DreamWorlds videos

**Voice Recording & Transcription:**
- ✅ Unlimited audio transcription (no cost limits)
- Available on all tiers (Free, Pro, Premium, VIP)
- Monthly usage tracked for analytics only
- Auto-resets each month for reporting

**Add-On Access:**
- Can purchase additional DreamWorlds ($6.99 each)
- Can purchase Deep Dive Report ($4.99)
- Can purchase DreamWorlds Bundle ($14.99 for 3)
- **Priority access** to new DreamWorlds features

**Cost to Operate:** ~$7.19/month per user  
**Profit Margin:** ~76.0%

---

## 🛍️ Add-Ons & Power-Ups

All add-ons are **marked as "Coming Soon"** with yellow badges on pricing pages.

### Add-On 1: Dream Deep Dive Report

**Price:** $4.99 (one-time purchase)  
**Available to:** All tiers (free, pro, premium, vip)  
**Status:** ⭐ Coming Soon

**Features:**
- Cross-dream pattern analysis
- Recurring theme identification
- Emotional arc mapping
- Personalized insights report
- PDF export of findings

**Cost per Report:** ~$0.13  
**Profit Margin:** ~97%

---

### Add-On 2: Additional DreamWorld

**Price:** $6.99 (one-time purchase)  
**Available to:** All tiers  
**Status:** ⭐ Coming Soon

**Features:**
- Single 45-second DreamWorld generation
- Full cinematic video quality (1080p)
- AI voice narration + ambient music
- Unlimited replays
- Professional editing tools

**Cost per Video:** ~$2.70  
**Profit Margin:** ~96%

---

### Add-On 3: DreamWorlds Bundle

**Price:** $14.99 (one-time purchase)  
**Available to:** All tiers  
**Status:** ⭐ Coming Soon  
**Savings:** $6.97 (vs buying 3 individually)

**Features:**
- 3 DreamWorlds generations
- Full cinematic video quality (1080p)
- AI voice narration + ambient music for each
- Unlimited replays
- Professional editing tools

**Equivalent Pricing:** 3 × $6.99 = $20.97 → **Save $6.97 with bundle**

---

## 💰 Financial Analysis

### Monthly Profit Per Subscription

| Tier | Price | Cost/User | Profit/User | Margin |
|------|-------|-----------|-------------|--------|
| Dreamer | $0.00 | ~$0.01 | -$0.01 | Lead Gen |
| Visionary | $9.99 | ~$0.51 | ~$9.48 | 94.9% |
| Architect | $19.99 | ~$2.41 | ~$17.58 | 87.9% |
| Star | $29.99 | ~$7.19 | ~$22.80 | 76.0% |

**Average across paid tiers:** ~85.9% profit margin ✅

---

## 🔄 Monthly Usage Reset Logic

### Auto-Reset Behavior

**Trigger:** First user interaction after month boundary  
**When Month Changes:** Month portion of date changes (e.g., Nov → Dec)

**Reset These Fields:**
- `dreams_analyzed_this_month` → 0
- `tts_generations_this_month` → 0
- `tts_cost_this_month_usd` → 0.0
- `transcriptions_this_month` → 0
- `last_reset_date` → current timestamp
- `tts_last_reset_date` → current timestamp
- `transcription_last_reset_date` → current timestamp

**What Does NOT Reset:**
- Lifetime achievement data
- Total dream count across all time
- Profile settings
- Referral bonuses
- Gamification level/XP
- Subscription tier

**Implementation File:** `src/utils/subscriptionHelpers.ts`  
**Function:** `shouldResetMonthlyUsage(lastResetDate)`

---

## 📱 User-Facing Messaging

### Tier Upgrade CTAs

**When user reaches Dreamer limit:**
> "You've used your 2 free dream analyses. Unlock 10 monthly analyses with AI voice narration for $9.99/month."

**Visionary → Architect upgrade:**
> "Generate stunning 6-second videos of your dreams. Upgrade to Architect for $19.99/month."

**Architect → Star upgrade:**
> "Create cinematic 45-second DreamWorlds with AI voice narration and music. Plus get a Persona Avatar. Upgrade to Star for $29.99/month."

### Feature Descriptions

**AI Voice Narration:**
> "Listen to your dream interpretation narrated by our AI in a clear, engaging voice. Perfect for listening while commuting or before bed."

**6-Second Video Generation:**
> "Watch your dream come to life in a stunning 6-second HD video with smooth transitions and professional branding."

**DreamWorlds (45s):**
> "Experience your dreams as cinematic 45-second videos with multi-scene narratives, AI voice narration, and ambient music."

**Persona Avatar:**
> "See yourself in your dreams. Star tier members get custom persona avatars on all dream images, making interpretations more personal and immersive."

**Exclusive AI Modules:**
> "Star tier unlocks access to four exclusive AI models: AtlasAI (dream mapping), ReflectAI (reflection journal), SymbolicaAI (symbol analysis), and LumenAI (personalized guidance)."

---

## 🔗 Implementation Reference

### Database Schema

**Table:** `user_profiles`

```sql
subscription_tier TEXT DEFAULT 'free'  -- free|pro|premium|vip
dreams_analyzed_this_month INTEGER DEFAULT 0
last_reset_date TEXT
tts_generations_this_month INTEGER DEFAULT 0
tts_cost_this_month_usd REAL DEFAULT 0.0
tts_last_reset_date TEXT
transcriptions_this_month INTEGER DEFAULT 0
transcription_last_reset_date TEXT
```

### TypeScript Types

**File:** `src/types/subscription.ts`

```typescript
export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'vip'

export const SUBSCRIPTION_PLANS = {
  free: { /* Dreamer config */ },
  pro: { /* Visionary config */ },
  premium: { /* Architect config */ },
  vip: { /* Star config */ }
}
```

### Helper Functions

**File:** `src/utils/subscriptionHelpers.ts`

```typescript
canCreateDreamAnalysis(tier, count)    // Check dream limit
canGenerateVideo(tier)                  // Check video access
shouldResetMonthlyUsage(lastResetDate) // Check if reset needed
getFeatureAccess(tier, feature)        // Generic feature check
```

---

## 🎯 Tier Selection Guide

### Who Should Use Each Tier?

**Dreamer (Free)** - Curious, occasional dreamers
- Just trying out the app
- Want to see if dream interpretation helps them
- Not ready to commit financially
- Typical usage: 1-2 dreams per year

**Visionary (Pro)** - Regular dreamers, journaling enthusiasts
- Dream multiple times per month
- Want AI narration for dream stories
- Want to track recurring themes
- Typical usage: 5-10 dreams per month

**Architect (Premium)** - Power users, dream enthusiasts
- Dedicated to dream analysis
- Want to see dreams visualized as videos
- Want advanced features (reflection journal, symbol orchard)
- Typical usage: 15-20 dreams per month

**Star (VIP)** - Dream professionals, content creators
- Maximum dream analysis (25/month)
- Want cinematic DreamWorlds videos
- Need exclusive AI models
- Want persona avatars in videos
- Typical usage: 20-25+ dreams per month

---

## ✅ Quick Verification Checklist

When making subscription changes, ensure ALL of these are updated:

- [ ] `src/types/subscription.ts` - Type definitions
- [ ] `src/utils/subscriptionHelpers.ts` - Business logic
- [ ] `src/components/PricingPlans.tsx` - UI component
- [ ] `src/pages/PricingPage.tsx` - Pricing page
- [ ] `SUBSCRIPTION_TIERS_REFERENCE.md` - This file
- [ ] `PRICING_SUMMARY.md` - Financial analysis
- [ ] `PRICING_AND_SUBSCRIPTIONS_MASTER.md` - Master reference
- [ ] `QUICK_REFERENCE.md` - Quick lookup
- [ ] All other docs that reference pricing

---

**Status:** ✅ **CURRENT & VERIFIED AGAINST subscription.ts**  
**Last Reviewed:** 2025-12-01  
**Next Review:** When subscription changes occur  
**Maintained by:** Blink AI Development Team  
**Project:** Dreamcatcher AI (dream-interpreter-ai-app-8lvkkwdq)

---

**⚠️ This is the SINGLE SOURCE OF TRUTH for subscription information**
