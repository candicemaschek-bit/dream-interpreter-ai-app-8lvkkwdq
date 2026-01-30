# Testing Guide: Running the Full Test Suite

## What "Run the Full Test Suite" Means

Running the full test suite means executing **all automated tests** across your entire project to verify that:
- Core functionality works as expected
- Recent changes didn't break existing features
- Platform compatibility is maintained (browser/mobile)
- Voice recording, image generation, and other features function correctly

## Available Test Commands

### 1. **Run Tests Once (CI Mode)**
```bash
npm test
```
**What it does:**
- Executes all test files in `src/tests/` directory
- Runs each test once and exits
- Perfect for CI/CD pipelines (GitHub Actions, etc.)
- Shows pass/fail summary at the end

**Current test files:**
- `platformCompatibility.test.ts` - Browser/mobile platform detection
- `voiceRecording.test.ts` - Audio recording lifecycle
- `imageGeneration.test.ts` - AI image generation
- `dreamIdInitialization.test.ts` - Dream ID creation

### 2. **Watch Mode (Development)**
```bash
npm run test:watch
```
**What it does:**
- Runs tests and watches for file changes
- Re-runs affected tests automatically
- Great for development/debugging
- Press `q` to exit, `?` for options

### 3. **With UI Dashboard**
```bash
npm run test:watch -- --ui
```
**What it does:**
- Opens interactive test dashboard in browser
- Visual progress tracking
- Detailed error messages
- Best for visual debugging

## How Tests Are Organized

```
src/tests/
├── platformCompatibility.test.ts    # Browser/device detection
├── voiceRecording.test.ts           # Audio recording lifecycle
├── imageGeneration.test.ts          # AI image generation features
└── dreamIdInitialization.test.ts    # Dream ID & database operations
```

Each test file covers specific functionality:

| Test File | What It Tests | Status |
|-----------|---------------|--------|
| `platformCompatibility.test.ts` | Desktop vs mobile detection, feature support, device type | ✅ Passing |
| `voiceRecording.test.ts` | Recording start/stop, blob creation, playback | ✅ Passing |
| `imageGeneration.test.ts` | AI image generation calls, error handling | ✅ Passing |
| `dreamIdInitialization.test.ts` | Dream creation, ID generation, database writes | ✅ Passing |

## Running Tests Locally

### Setup
```bash
# Install dependencies (one time)
npm install
```

### Run Full Suite
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:watch -- --ui
```

### Expected Output
```
✓ src/tests/platformCompatibility.test.ts (8 tests)
✓ src/tests/voiceRecording.test.ts (5 tests)
✓ src/tests/imageGeneration.test.ts (4 tests)
✓ src/tests/dreamIdInitialization.test.ts (3 tests)

Test Files  4 passed (4)
     Tests  20 passed (20)
  Start at  10:45:32
  Duration  2.34s
```

## Automated Testing (GitHub Actions)

Tests run automatically on every push via GitHub Actions CI pipeline.

### How to View Results

#### Option 1: PR Comments (Easiest) ✨ NEW
**For Pull Requests**, test results automatically appear as comments with:
- ✅ Pass/fail summary
- ❌ **Full stack traces** for failed tests
- 📂 File paths and line numbers
- 🔍 Expandable raw output

Simply check your PR - the bot posts results immediately!

#### Option 2: Actions Tab
1. Go to your GitHub repo
2. Click **Actions** tab
3. Click the latest workflow run
4. Scroll down to see test results

#### Option 3: Download Artifacts
1. Go to failed workflow run
2. Scroll to **Artifacts** section
3. Download `test-results-node-XX`
4. Contains:
   - `test-results.json` - Full test data
   - `test-output.txt` - Raw console output
   - `failures.md` - Formatted failures

### Workflow Details
- Triggers: Every push to main branch and all pull requests
- Matrix: Tests run on Node 18 and Node 20
- Steps:
  1. Install Node.js
  2. Install dependencies
  3. Run linting
  4. Run full test suite with stack traces
  5. Post results to PR (if applicable)
  6. Upload artifacts
- Time: ~30-60 seconds per run

### CI Status Badge
Add to your README:
```markdown
[![Tests](https://github.com/blink-new/dream-interpreter-ai-app-8lvkkwdq/actions/workflows/ci.yml/badge.svg)](https://github.com/blink-new/dream-interpreter-ai-app-8lvkkwdq/actions)
```

### Stack Trace Feature 🎯
When tests fail in a PR, you get **detailed error information** automatically:
- No need to dig through CI logs
- Stack traces with file locations
- Error messages clearly formatted
- See exactly what went wrong

**Learn more:** [PR Comment Guide](.github/PR_COMMENT_GUIDE.md)

## What Gets Tested

### Platform Compatibility Tests
- Desktop browser detection
- Mobile device detection
- Touch event support
- Microphone/camera permissions
- Canvas drawing on touch devices

### Voice Recording Tests
- Recording start/stop lifecycle
- Audio blob creation
- Playback URL generation
- Error handling (permission denied)
- Recording cleanup

### Image Generation Tests
- AI image generation API calls
- Error handling
- Response validation
- Timeout handling

### Dream Initialization Tests
- Dream ID generation
- Database record creation
- Timestamp handling
- User association

## Running Specific Tests

```bash
# Run only platform compatibility tests
npm test -- platformCompatibility

# Run only voice recording tests
npm test -- voiceRecording

# Run tests matching a pattern
npm test -- dream
```

## Debugging Failed Tests

If a test fails locally:

1. **Check the error message** - Read what exactly failed
2. **Run in watch mode** - Makes debugging easier
   ```bash
   npm run test:watch -- --reporter=verbose
   ```
3. **Check browser console** - Some issues only appear at runtime
4. **Run with UI** - Visual dashboard helps identify issues
   ```bash
   npm run test:watch -- --ui
   ```

## Testing Checklist

Before deploying, verify:

- [ ] Run `npm test` and all tests pass
- [ ] Run `npm run lint` and no errors
- [ ] Test voice recording on real device
- [ ] Test canvas drawing on mobile
- [ ] Test file upload on mobile
- [ ] Check responsive layout on various screen sizes

## Next Steps

After running tests:

1. **If all tests pass** ✅
   - Safe to deploy
   - Run `npm run build` to create production bundle

2. **If tests fail** ❌
   - Review error messages
   - Check recent code changes
   - Run in watch mode for debugging
   - Fix issues and re-run

3. **Add new tests**
   - Create new test file in `src/tests/`
   - Follow existing test patterns
   - Run `npm run test:watch` to verify

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](BROWSER_MOBILE_TESTING_GUIDE.md)
- [CI/CD Setup](https://docs.github.com/en/actions)
