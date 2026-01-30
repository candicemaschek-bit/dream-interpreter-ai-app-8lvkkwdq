# E2E Test Execution Guide for Dreamcatcher AI

## Quick Start

### Prerequisites
```bash
# Install Playwright browsers (required once)
npx playwright install chromium

# Or install all browsers
npx playwright install
```

### Run Tests

```bash
# Run all tests (all browsers)
npm run test:e2e

# Run tests on Chromium only (faster)
npm run test:e2e:chromium

# Run tests with visible browser
npm run test:e2e:headed

# Interactive UI mode (recommended for debugging)
npm run test:e2e:ui

# View HTML report
npm run test:e2e:report

# Debug mode (pauses for inspection)
npm run test:e2e:debug
```

## Test Files Structure

```
e2e/
├── fixtures/
│   └── auth.ts                          # Test user credentials and helpers
├── signup-signin.spec.ts               # Authentication tests (34 tests)
├── dream-input.spec.ts                 # Dream input methods
├── dream-interpretation.spec.ts        # AI interpretation flow
├── dream-library.spec.ts               # Dream history and management
├── video-generation.spec.ts            # Video generation flow
├── video-screenshot-capture.spec.ts    # Screenshot capture
├── admin-panel.spec.ts                 # Admin dashboard
├── subscription.spec.ts                # Tier management
└── auth.spec.ts                        # General auth flows
```

## Test Execution Matrix

### Authentication Tests (signup-signin.spec.ts)
- ✅ Sign Up Flow (password mode, magic link mode)
- ✅ Sign In Flow (email/password, forgot password)
- ✅ Social Authentication (Google, Apple)
- ✅ Form Validation (email format, password strength)
- ✅ CAPTCHA Integration (Turnstile)
- ✅ Accessibility (labels, focus states, visibility toggles)
- ✅ Error Handling (invalid credentials, weak password)
- ✅ Mode Toggling (sign up ↔ sign in)

**Total: 34 test cases**

### Dream Input Tests (dream-input.spec.ts)
- ✅ Text input with validation
- ✅ Symbol/drawing canvas
- ✅ Image upload and preview
- ✅ Character counting
- ✅ Voice recording detection
- ✅ Draft auto-save
- ✅ Form submission

**Total: 10 test cases**

### Interpretation Tests (dream-interpretation.spec.ts)
- ✅ Result display
- ✅ Symbol extraction
- ✅ Emotion analysis
- ✅ Interpretation updates
- ✅ Sharing functionality
- ✅ Error handling

**Total: 8 test cases**

### Dream Library Tests (dream-library.spec.ts)
- ✅ Dream list display
- ✅ Search and filtering
- ✅ Detail viewing
- ✅ Sorting
- ✅ Export/sharing
- ✅ Delete operations
- ✅ Pagination

**Total: 12 test cases**

### Video Generation Tests (video-generation.spec.ts)
- ✅ Video button visibility
- ✅ Queue status
- ✅ Progress tracking
- ✅ Video player
- ✅ Tier limits
- ✅ Notifications
- ✅ Error handling
- ✅ Duration options

**Total: 10 test cases**

### Admin Tests (admin-panel.spec.ts)
- ✅ Admin authentication
- ✅ User management
- ✅ Video queue monitoring
- ✅ Analytics dashboard
- ✅ Feature management

**Total: 8 test cases**

### Subscription Tests (subscription.spec.ts)
- ✅ Plan comparison
- ✅ Pricing display
- ✅ Upgrade/downgrade
- ✅ Payment integration

**Total: 5 test cases**

## Launch Offer System Verification

### Transcription Limit Tests
```typescript
// Test case: Verify 4-transcription limit for free users
const transcriptionsUsed = 4; // Launch offer users can transcribe 4 times
expect(transcriptionsUsed).toBeLessThanOrEqual(4);

// Test case: Verify error when limit reached
// Expected: "Transcription limit reached. Upgrade to continue."
```

### Watermark Tests
```typescript
// Test case: Verify watermark on launch offer user images
const hasWatermark = imageContainer.includes("Launch Offer");
expect(hasWatermark).toBe(true);

// Test case: No watermark for paid users
const paidUserImage = await generateImage(premiumUser);
expect(paidUserImage).not.toContain("Launch Offer");
```

### Server-Side Enforcement
```
GET /api/launch-offers/{userId}
{
  "launchOfferActive": true,
  "transcriptionsUsed": 2,
  "transcriptionsRemaining": 2,
  "offersWatermark": true
}

POST /api/transcribe
{
  "userId": "...",
  "audioData": "...",
  "launchOfferUser": true
}
// If transcriptionsUsed >= 4: 403 Forbidden
```

## Expected Results

### Signup Flow
- **Expected**: All 34 tests pass
- **Duration**: ~5-10 minutes
- **Success Criteria**:
  - User can create account with email/password
  - Social auth buttons appear
  - Magic link option available
  - Form validation works
  - CAPTCHA integrates correctly

### Transcription Flow
- **Expected**: All transcription tests pass
- **Duration**: ~3-5 minutes
- **Success Criteria**:
  - Voice recorder button visible
  - Recording starts/stops correctly
  - Transcription limit displayed (0/4)
  - Error when limit reached
  - Watermark visible on generated images

### Image Generation Flow
- **Expected**: All image tests pass
- **Duration**: ~5-8 minutes
- **Success Criteria**:
  - Image generation button appears after interpretation
  - Progress bar displays during generation
  - Watermark applied for launch offer users
  - Download/share buttons work
  - Tier limits enforced

### Complete E2E Journey
- **Expected**: All flows work end-to-end
- **Duration**: ~10-15 minutes
- **Success Criteria**:
  - User can signup
  - Can input dream (text/voice)
  - Gets interpretation
  - Can generate image (watermarked if free)
  - Can generate video (if Pro)
  - Can access dream library

## Troubleshooting

### "Playwright browsers not found"
```bash
npx playwright install chromium
```

### "No space left on device"
- Browsers require ~500MB
- Clean node_modules: `rm -rf node_modules && npm install`
- Or use headless mode in CI

### Tests timing out
- Increase timeout: `--timeout=60000`
- Check network connectivity
- Verify dev server is running: `npm run dev`

### Flaky tests
- Use `--retries=2` flag
- Run individually to isolate issues
- Check console logs for errors

### CAPTCHA failures
- Ensure test env has Turnstile test key
- CAPTCHA auto-passes in test mode
- If failing, check `.env` configuration

## Performance Benchmarks

| Test Suite | Expected Duration | Pass Rate |
|------------|------------------|-----------|
| Signup/Auth | 5-10 min | 95%+ |
| Dream Input | 3-5 min | 90%+ |
| Interpretation | 4-6 min | 95%+ |
| Dream Library | 3-4 min | 95%+ |
| Video Generation | 5-8 min | 85%+ |
| Admin Panel | 4-5 min | 90%+ |
| **Total** | **30-50 min** | **90%+** |

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npx playwright install chromium
      
      - run: npm run dev &
      - run: sleep 10
      
      - run: npm run test:e2e:chromium
      
      - if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Test User Credentials

### Free Tier Users
- Email: `test-free@dreamcatcher.test`
- Password: `TestPassword123!`
- Features: Text input, 4 transcriptions, watermarked images

### Pro Tier Users
- Email: `test-pro@dreamcatcher.test`
- Password: `TestPassword123!`
- Features: All free + video generation, no watermarks

### Admin Users
- Email: `test-admin@dreamcatcher.test`
- Password: `AdminPassword123!`
- Access: Full admin dashboard

### Launch Offer Users (Auto-granted to first 500 signups)
- New signup users
- Same as free tier + limited benefits
- Watermark on generated images
- 4 free transcriptions

## Monitoring & Reporting

### View Test Report
```bash
npm run test:e2e:report
```

### Export Results
```bash
npm run test:e2e -- --reporter=json > test-results.json
npm run test:e2e -- --reporter=html
```

### Track Metrics
- Pass rate trend
- Average duration per test
- Flaky test identification
- Error categories

## Best Practices

1. **Run locally before pushing**
   ```bash
   npm run test:e2e:chromium
   ```

2. **Use headed mode for debugging**
   ```bash
   npm run test:e2e:headed
   ```

3. **Check console logs**
   - Look for auth errors
   - Check API call failures
   - Verify timing issues

4. **Update tests with UI changes**
   - When selectors change, update locators
   - When flows change, update test steps
   - Keep tests maintainable

5. **Document flaky tests**
   - Add retry logic: `.retry(2)`
   - Increase timeouts if needed
   - File issues for infrastructure problems

## Support & Documentation

- Playwright Docs: https://playwright.dev
- Test Config: See `playwright.config.ts`
- Auth Fixtures: See `e2e/fixtures/auth.ts`
- E2E Summary: See `E2E_TEST_SUMMARY_PLAN.md`

---

**Last Updated**: December 13, 2025
**Test Suite Version**: Complete
**Status**: Ready for CI/CD Integration
