# 🧪 Testing Dreamcatcher AI - Quick Start Guide

You have **3 main testing approaches** available. Choose based on your needs:

---

## 1️⃣ **Unit Tests** (Fastest - 2 seconds)
Test individual functions and components.

### Run All Unit Tests
```bash
npm test
```

### Run in Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Run with Visual Dashboard
```bash
npm run test:watch -- --ui
```
Opens browser dashboard showing test progress, failures, and stack traces.

### Run Specific Tests
```bash
# Run only voice recording tests
npm test -- voiceRecording

# Run tests matching pattern
npm test -- dream
```

**What's Tested:**
- ✅ Platform compatibility (desktop vs mobile)
- ✅ Voice recording lifecycle
- ✅ Image generation API calls
- ✅ Dream ID initialization
- ✅ Input validation
- ✅ Emotion analysis

**Expected Output:**
```
✓ src/tests/platformCompatibility.test.ts (8 tests)
✓ src/tests/voiceRecording.test.ts (5 tests)
✓ src/tests/imageGeneration.test.ts (4 tests)
✓ src/tests/dreamIdInitialization.test.ts (3 tests)

Test Files  4 passed (4)
     Tests  20 passed (20)
  Duration  2.34s
```

---

## 2️⃣ **End-to-End Tests** (Real browser simulation - 30 seconds)
Test complete user workflows in a real browser (Playwright).

### Prerequisites
Install Playwright browsers (first time only):
```bash
npx playwright install
```

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run with Browser Visible
```bash
npm run test:e2e:headed
```
See the browser execute tests in real-time. Great for debugging!

### Run with Interactive Mode
```bash
npm run test:e2e:ui
```
Opens UI where you can run/debug tests individually with step-by-step execution.

### Run in Debug Mode
```bash
npm run test:e2e:debug
```
Launches debugger - inspect, pause, step through tests.

### View Test Report
```bash
npm run test:e2e:report
```
Opens HTML report showing passed/failed tests with details.

### Run Specific Test File
```bash
# Test authentication
npx playwright test e2e/auth.spec.ts

# Test dream input
npx playwright test e2e/dream-input.spec.ts

# Test video generation
npx playwright test e2e/video-generation.spec.ts
```

### Run Tests Matching Pattern
```bash
npx playwright test -g "should sign in"
```

### Test on Specific Browser
```bash
npm run test:e2e:chromium    # Chrome
npm run test:e2e:firefox     # Firefox
npm run test:e2e:webkit      # Safari
```

**What's Tested:**
- ✅ User authentication (sign up, sign in, sign out)
- ✅ Dream input methods (text, symbols, image upload)
- ✅ AI interpretation generation
- ✅ Video generation workflow
- ✅ Dream library management
- ✅ Subscription tier flows
- ✅ Admin dashboard functions

**Test Coverage:**
- `auth.spec.ts` - 5+ authentication scenarios
- `dream-input.spec.ts` - 4+ input method tests
- `dream-interpretation.spec.ts` - 3+ result interaction tests
- `video-generation.spec.ts` - Video queue and playback
- `dream-library.spec.ts` - Search, filter, delete
- `subscription.spec.ts` - Pricing and checkout
- `admin-panel.spec.ts` - Admin operations

---

## 3️⃣ **Manual Testing** (Real experience - 5-10 minutes)
Test features manually in the live app.

### Start Development Server
```bash
npm run dev
```
Opens `http://localhost:5173` in your browser.

### Quick Test Checklist

**Authentication:**
- [ ] Sign up with email
- [ ] Verify email confirmation (if enabled)
- [ ] Sign in with email
- [ ] Sign in with Google/Apple
- [ ] Sign out

**Dream Input:**
- [ ] Input text description → Get interpretation
- [ ] Draw symbols on canvas → Get interpretation
- [ ] Upload dream image → Get interpretation
- [ ] Record voice memo → Get interpretation

**Dream Interpretation:**
- [ ] View AI interpretation results
- [ ] Click "Generate Video" → See video queue
- [ ] Wait for video → Play video
- [ ] Share dream

**Dream Library:**
- [ ] View all dreams
- [ ] Search dreams by keyword
- [ ] Filter by mood/theme
- [ ] Delete dream (if applicable)
- [ ] View dream statistics/trends

**Subscriptions:**
- [ ] View pricing page
- [ ] Upgrade to Pro
- [ ] Check usage limits
- [ ] View billing

**Mobile Testing:**
- [ ] Test on phone (toggle in browser devtools)
- [ ] Test touch drawing
- [ ] Test microphone recording
- [ ] Test responsive layout

---

## 🚀 Complete Testing Workflow

### Before Deployment (Full Test Suite)
```bash
# 1. Run unit tests
npm test

# 2. Run linter
npm run lint

# 3. Run E2E tests
npm run test:e2e

# 4. Manual smoke test
npm run dev
# Test 3-4 key user flows manually

# 5. Build
npm run build

# 6. Deploy
npm run deploy
```

**Total Time: ~5-10 minutes**

### Quick Development Check
```bash
# Just run unit tests + watch
npm run test:watch

# Code and tests auto-update
```

### Debug Failed E2E Test
```bash
# 1. Run with browser visible
npm run test:e2e:headed

# 2. Or use UI mode to step through
npm run test:e2e:ui

# 3. Or use debugger
npm run test:e2e:debug
```

---

## 📊 Test Commands Reference

| Command | Purpose | Time |
|---------|---------|------|
| `npm test` | Run all unit tests once | 2s |
| `npm run test:watch` | Run unit tests + watch | N/A |
| `npm run test:watch -- --ui` | Interactive test dashboard | N/A |
| `npm run test:e2e` | Run all E2E tests | 30s |
| `npm run test:e2e:headed` | E2E tests with browser visible | 30s |
| `npm run test:e2e:ui` | E2E interactive mode | N/A |
| `npm run test:e2e:debug` | E2E with debugger | N/A |
| `npm run test:e2e:report` | View E2E HTML report | N/A |
| `npm run lint` | Check code quality | 5s |
| `npm run dev` | Start dev server (manual testing) | N/A |

---

## 🎯 When to Use Each Approach

| Situation | Use |
|-----------|-----|
| Writing new features | `npm run test:watch` (fastest feedback) |
| Testing specific functionality | E2E tests in UI mode (`--ui`) |
| Catching regressions | `npm test` before commit |
| Debugging browser issues | E2E headed mode (`--headed`) |
| Final pre-deployment check | Full workflow (all 3 approaches) |
| Testing on multiple browsers | E2E on chromium/firefox/webkit |
| Mobile-specific bugs | Manual testing with devtools |

---

## ❓ Common Questions

**Q: Tests fail locally but pass in CI?**
- Clear browser cache: `npm run test:e2e -- --headed`
- Run on same Node version: Check `.node-version` or `package.json`

**Q: How do I add new tests?**
- Unit tests: Create file in `src/tests/`
- E2E tests: Create file in `e2e/` following existing patterns

**Q: How do I debug a failing E2E test?**
```bash
# Option 1: See browser
npm run test:e2e:headed

# Option 2: Step through UI
npm run test:e2e:ui

# Option 3: Use debugger
npm run test:e2e:debug
```

**Q: Can I run tests in CI/GitHub?**
- Yes! Tests auto-run on every push (GitHub Actions)
- View results in **Actions** tab or PR comments

**Q: How do I test across devices?**
- Unit tests: Automatically platform-agnostic
- E2E tests: Run with `--headed`, toggle mobile in devtools
- Manual testing: Test on physical device

---

## 📈 Next Steps

1. **Try unit tests:** `npm test`
2. **Try E2E tests:** `npm run test:e2e`
3. **Set up manual testing:** `npm run dev`
4. **Add to workflow:** Run tests before each commit

Happy testing! 🎉
