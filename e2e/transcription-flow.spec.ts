import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './fixtures/auth';

test.describe('Transcription Flow', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    await page.waitForLoadState('networkidle');
  });

  test('should handle successful transcription flow', async ({ page }) => {
    await page.route('**/transcribe-audio*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'I dreamt of flying over a golden city',
          provider: 'replicate',
          didFallback: false
        })
      });
    });

    await page.route('**/storage/upload*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          publicUrl: 'https://example.com/audio.webm'
        })
      });
    });

    await page.goto('/');

    const voiceTab = page.getByRole('tab', { name: /voice|record/i });
    if (await voiceTab.getAttribute('aria-selected') !== 'true') {
      await voiceTab.click();
    }

    await expect(page.getByRole('button', { name: /record|microphone/i })).toBeVisible();
  });
});
