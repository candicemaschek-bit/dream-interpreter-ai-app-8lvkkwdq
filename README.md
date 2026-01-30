# Enhanced Vite React TypeScript Template

[![Tests](https://github.com/blink-new/dream-interpreter-ai-app-8lvkkwdq/workflows/Run%20Tests/badge.svg?branch=main)](https://github.com/blink-new/dream-interpreter-ai-app-8lvkkwdq/actions/workflows/run-tests.yml)
[![codecov](https://codecov.io/gh/blink-new/dream-interpreter-ai-app-8lvkkwdq/branch/main/graph/badge.svg)](https://codecov.io/gh/blink-new/dream-interpreter-ai-app-8lvkkwdq)

An AI-powered dream interpretation app that allows users to input dreams through text, symbols, or images, receive detailed interpretations, and generate beautiful 45-second dream visualization videos.

## Features

- **Multi-Modal Dream Input**: Text, symbols (drawing canvas), and image uploads
- **AI-Powered Interpretations**: Claude/Gemini-based dream analysis with psychological insights
- **Video Generation**: 45-second cinematic dream visualization videos (Premium/VIP)
- **Dream Library**: Persistent storage with trending themes and statistics
- **Subscription Tiers**: Free, Pro, Premium, and VIP with progressive feature unlock
- **DreamWorld Collections**: Curate multiple dreams into immersive 45-second cinematic videos (VIP)
- **Gamification**: Coins, badges, leaderboards, and referral system
- **Video Branding**: Professional branding overlays for all generated videos
- **Modern Stack**: Vite + React + TypeScript + Tailwind CSS + Blink SDK

## Getting Started

1. **Sign Up**: Create a free account (2 lifetime dream interpretations included)
2. **Input Your Dream**: Use text, drawing, or image to describe your dream
3. **Get AI Interpretation**: Receive detailed psychological analysis
4. **Generate Video**: Premium/VIP users can create 45-second dream videos
5. **Explore Themes**: View trending dream symbols and themes

## Video Generation

### Dreamcatcher AI Videos (6 seconds)
- **Tier**: Premium & VIP
- **Duration**: 6 seconds (3 frames)
- **Use Case**: Individual dream visualizations
- **Quality**: High (Premium), Ultra (VIP)
- **Bitrate**: 4000k (Premium), 6000k (VIP)

### Dreamworlds Videos (45 seconds)
- **Tier**: VIP only
- **Duration**: 45 seconds (15 frames)
- **Use Case**: Curated collections of interpreted dreams
- **Quality**: Ultra
- **Bitrate**: 8000k
- **FPS**: 30

### DreamWorld Extended (45 seconds)
- **Tier**: VIP Pass holders
- **Duration**: 45 seconds (15 frames)
- **Use Case**: Extended cinematic dream collections with VIP branding
- **Quality**: Ultra
- **Bitrate**: 10000k
- **FPS**: 30

## Technical Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui + Radix UI
- **Backend**: Blink Edge Functions (Deno)
- **Database**: SQLite with Blink SDK
- **Authentication**: Multi-provider (Google, Apple, Email)
- **Video Generation**: AI image generation + MP4 composition
- **Storage**: Blink Cloud Storage
- **Payments**: Stripe integration

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run tests
npm test

# Seed local SQLite database for testing
npm run seed:sqlite
```

### Testing with Different Tiers

To test features across different subscription tiers:

1. **Seed the test database**:
   ```bash
   npm run seed:sqlite
   ```

2. **Login with test accounts**:
   - Free: `test.free@dreamcatcher.local` / `TestPassword123!`
   - Pro: `test.pro@dreamcatcher.local` / `TestPassword123!`
   - Premium: `test.premium@dreamcatcher.local` / `TestPassword123!`
   - VIP: `test.vip@dreamcatcher.local` / `TestPassword123!`
   - Admin: `admin.test@dreamcatcher.local` / `AdminPassword123!`

3. **Verify tier-specific features** work as expected

See [Local SQLite Seeding Guide](./docs/LOCAL_SQLITE_SEEDING_GUIDE.md) for details.

## Subscription Tiers

| Feature | Free | Pro | Premium | VIP |
|---------|------|-----|---------|-----|
| Monthly Analyses | 2 | 10 | 30 | Unlimited |
| Dream Videos (6s) | ❌ | ❌ | 20/mo | Unlimited |
| DreamWorlds (45s) | ❌ | ❌ | ❌ | 1/mo |
| Video Quality | - | - | High | Ultra |
| Gamification | ✅ | ✅ | ✅ | ✅ |
| Price | Free | $4.99 | $14.99 | $29.99 |

## Video Generation Parameters

**45-Second Video Specifications**:
- **Frame Count**: 15 frames per video
- **Duration Per Frame**: 3 seconds
- **FPS (Playback)**: 30 FPS
- **Bitrate**: 8000k (Dreamworlds), 10000k (VIP)
- **Codec**: H.264
- **Resolution**: 1024x1024
- **Format**: MP4

## Documentation

See `/docs` folder for detailed documentation:
- `PRICING_AND_SUBSCRIPTIONS_MASTER.md` - Complete pricing implementation guide
- `PROJECT_PLAN.md` - Comprehensive project roadmap
- `EXECUTIVE_SUMMARY.md` - Project status and assessment
- `QUICK_REFERENCE.md` - Developer handbook with common tasks
- `ARCHITECTURE_DIAGRAM.md` - Visual system architecture
- `DOCUMENTATION_INDEX.md` - Master index of all documentation guides (in root)

## Cache Management

### Fresh Dev Starts
- Run `npm run dev:fresh` whenever the preview behaves oddly; it purges `.vite`, `node_modules/.vite`, `dist`, `build`, and other temp artifacts before piping you into a clean `npm run dev` session.
- If you only need the cleanup step, `npm run clean:cache` (or `npm run clean:cache:verbose`) performs the same purges without launching Vite.

### CDN Headers
- The new `public/_headers` file forces HTML to revalidate with the edge while allowing hashed JS, CSS, and font files to be cached for a year (`immutable`), keeping deployments fast without stale markup.
- Update `_headers` whenever you add new static asset patterns so the edge keeps respecting the correct TTLs.

### Local Build Artifacts
- The cleanup script removes local build folders (`dist`, `build`) and the temporary entry point (`temp_index.ts`), ensuring a completely fresh bundle.
- Rebuild with `npm run build` after cleaning to regenerate artifacts before deploying; redeploying with a new version suffix automatically invalidates CDN caches that respect the headers above.
