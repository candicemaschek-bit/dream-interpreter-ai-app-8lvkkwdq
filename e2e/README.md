# E2E Tests for Dreamcatcher AI

This directory contains end-to-end tests using Playwright that simulate complete user flows through the application.

## Quick Start

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

## Test Files

- **auth.spec.ts** - Authentication flows (sign in, sign up, sign out)
- **dream-input.spec.ts** - Dream input methods (text, symbols, images)
- **dream-interpretation.spec.ts** - AI interpretation results and interactions
- **video-generation.spec.ts** - Video generation queue and playback
- **dream-library.spec.ts** - Dream history, search, and management
- **subscription.spec.ts** - Pricing plans and subscription flows
- **admin-panel.spec.ts** - Admin dashboard and management features

## Test Users

Test user credentials are defined in `fixtures/auth.ts`:

```typescript
FREE: 'test-free@dreamcatcher.test' / 'TestPassword123!'
PRO: 'test-pro@dreamcatcher.test' / 'TestPassword123!'
ADMIN: 'test-admin@dreamcatcher.test' / 'AdminPassword123!'
```

**Important**: Create these users in your development database before running tests.

## Running Specific Tests

```bash
# Run a single test file
npx playwright test e2e/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "should sign in"

# Run in debug mode
npm run test:e2e:debug

# Run on specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

## Writing Tests

See the [E2E Testing Guide](../docs/E2E_TESTING_GUIDE.md) for detailed information on:
- Test structure and best practices
- Using authentication helpers
- Handling dynamic content
- Debugging failed tests

## CI/CD

Tests are configured to run in CI with:
- Retry on failure (2 retries)
- Screenshot and video capture on failure
- HTML report generation

## Documentation

Full documentation available at: [docs/E2E_TESTING_GUIDE.md](../docs/E2E_TESTING_GUIDE.md)
