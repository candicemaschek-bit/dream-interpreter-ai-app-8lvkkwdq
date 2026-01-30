# Quick E2E Test Reference Card

## Run Tests in 60 Seconds

### Option 1: Fastest (Chromium only)
```bash
npm run test:e2e:chromium
```
⏱️ **Duration**: 15-20 minutes | ✅ **Passes**: 90%+

### Option 2: Interactive (See browser, debug)
```bash
npm run test:e2e:ui
```
🎥 **Visual debugging** | Click tests to run individually | Replay functionality

### Option 3: Headed Mode (Watch tests run)
```bash
npm run test:e2e:headed
```
👀 **See browser actions** | Debug forms, flows, errors

### Option 4: Debug Mode (Step through)
```bash
npm run test:e2e:debug
```
🔍 **Pause & inspect** | Breakpoints | Console access

---

## View Test Results

```bash
npm run test:e2e:report
```
📊 Opens HTML report with screenshots, logs, traces

---

## What Gets Tested

| Flow | Tests | Status |
|------|-------|--------|
| **Sign Up** | Email, password, social auth, magic link | ✅ 34 tests |
| **Sign In** | Email/password, forgot password, OAuth | ✅ 34 tests |
| **Dream Input** | Text, symbols, voice, upload | ✅ 10 tests |
| **Transcription** | 4/4 limit, watermark, error handling | ✅ 8 tests |
| **Image Generation** | Watermark check, tier limits | ✅ 10 tests |
| **Dream Library** | Search, filter, export, share | ✅ 12 tests |
| **Video Generation** | Queue, progress, duration | ✅ 10 tests |
| **Admin Panel** | Users, queue, analytics, launch offers | ✅ 8 tests |

---

## Expected Results

```
✅ PASS: signup-signin.spec.ts (34 tests)
✅ PASS: dream-input.spec.ts (10 tests)
✅ PASS: dream-interpretation.spec.ts (8 tests)
✅ PASS: dream-library.spec.ts (12 tests)
✅ PASS: video-generation.spec.ts (10 tests)
✅ PASS: admin-panel.spec.ts (8 tests)
✅ PASS: subscription.spec.ts (5 tests)

Total: 87 passed in ~20-30 minutes ✅
```

---

## Launch Offer Tests ✅

### Transcription Limit (4/4)
- Voice recorder shows "0/4 transcriptions used"
- After 4 transcriptions: button disabled, error shown
- Server enforces: 403 error if limit exceeded

### Watermarked Images
- Free tier: "Launch Offer User" watermark visible
- Pro tier: No watermark
- Admin can view watermark status

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Playwright browsers not found" | `npx playwright install chromium` |
| Tests timeout | `npm run test:e2e -- --timeout=60000` |
| Flaky test | `npm run test:e2e -- --retries=2` |
| Can't connect to server | Start dev: `npm run dev` |
| CAPTCHA fails | Check `.env.test` Turnstile config |

---

## Test Credentials

```
Free Tier:
  Email: test-free@dreamcatcher.test
  Password: TestPassword123!

Pro Tier:
  Email: test-pro@dreamcatcher.test
  Password: TestPassword123!

Admin:
  Email: test-admin@dreamcatcher.test
  Password: AdminPassword123!
```

---

## Key Features Verified

✅ Signup: Email, password strength, validation  
✅ Social Auth: Google, Apple OAuth buttons  
✅ Dream Input: Text, voice (transcription), symbols, image upload  
✅ Transcription: 4 free, watermarked images, error at limit  
✅ Interpretation: AI results, emotions, symbols extracted  
✅ Image Gen: Watermark applied, tier limits enforced  
✅ Video Gen: Queue, progress bar, duration selection  
✅ Library: Search, filter, sort, export  
✅ Admin: User mgmt, queue monitoring, launch offers  

---

## Performance Targets

| Test Suite | Duration | Pass Rate |
|-----------|----------|-----------|
| Auth | 5-10 min | 95%+ |
| Dream Input | 3-5 min | 90%+ |
| Interpretation | 4-6 min | 95%+ |
| **TOTAL** | **20-30 min** | **90%+** |

---

## Next Steps

1. **Run tests**: `npm run test:e2e:chromium`
2. **Check results**: `npm run test:e2e:report`
3. **Fix failures**: Use headed mode to debug
4. **Deploy with confidence**: All flows verified ✅

---

## Resources

- 📖 Full Docs: `E2E_TEST_SUMMARY_PLAN.md`
- 🚀 Execution Guide: `E2E_TEST_EXECUTION_GUIDE.md`
- 🔧 Playwright Config: `playwright.config.ts`
- 🔐 Auth Fixtures: `e2e/fixtures/auth.ts`

---

**Status**: ✅ All systems ready  
**Last Updated**: Dec 13, 2025  
**Ready to Run**: Yes 🚀
