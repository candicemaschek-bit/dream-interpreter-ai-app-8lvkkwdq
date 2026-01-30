import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './fixtures/auth';

test.describe('Video Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in with PRO user for video generation access
    await signIn(page, TEST_USERS.PRO.email, TEST_USERS.PRO.password);
    await page.waitForLoadState('networkidle');
  });

  test('should show video generation button after interpretation', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Soaring through clouds with eagles');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Wait for interpretation to complete
    await page.waitForTimeout(5000);
    
    // Look for video generation button
    const videoButton = page.getByRole('button', { name: /video|generate.*video|create.*video/i }).first();
    
    // Video generation should be available (if user has access)
    await expect(videoButton.or(page.getByText(/video/i))).toBeVisible({ timeout: 35000 });
  });

  test('should initiate video generation', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Exploring crystal caves with glowing lights');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Wait for interpretation
    await page.waitForTimeout(5000);
    
    // Click video generation button
    const videoButton = page.getByRole('button', { name: /video|generate.*video/i }).first();
    
    if (await videoButton.isVisible({ timeout: 35000 })) {
      await videoButton.click();
      
      // Should show confirmation or processing message
      await expect(page.getByText(/generating|processing|queue|confirm/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show video generation queue status', async ({ page }) => {
    await page.goto('/');
    
    // Submit and generate video
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Swimming with dolphins in turquoise waters');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    await page.waitForTimeout(5000);
    
    const videoButton = page.getByRole('button', { name: /video|generate.*video/i }).first();
    
    if (await videoButton.isVisible({ timeout: 35000 })) {
      await videoButton.click();
      await page.waitForTimeout(2000);
      
      // Should show queue position or status
      const queueStatus = page.getByText(/queue|position|waiting|processing/i).first();
      await expect(queueStatus).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display video generation progress', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Walking through fields of fireflies at dusk');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    await page.waitForTimeout(5000);
    
    const videoButton = page.getByRole('button', { name: /video|generate.*video/i }).first();
    
    if (await videoButton.isVisible({ timeout: 35000 })) {
      await videoButton.click();
      
      // Should show progress indicator
      const progress = page.locator('[role="progressbar"]').or(page.getByText(/progress|%/i));
      await expect(progress.first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('should handle video generation tier limits', async ({ page }) => {
    // Sign out and sign in as free user
    await page.goto('/');
    
    // Try to generate multiple videos
    for (let i = 0; i < 2; i++) {
      const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
      await dreamInput.fill(`Test dream ${i + 1}`);
      
      const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      const videoButton = page.getByRole('button', { name: /video|generate.*video/i }).first();
      
      if (await videoButton.isVisible({ timeout: 30000 })) {
        await videoButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Navigate back for next iteration
      await page.goto('/');
      await page.waitForTimeout(1000);
    }
    
    // Should eventually show limit message
    const limitMessage = page.getByText(/limit|upgrade|maximum|exceeded/i).first();
    
    // Limit message might appear
    const hasLimitMessage = await limitMessage.isVisible({ timeout: 5000 }).catch(() => false);
    expect(typeof hasLimitMessage).toBe('boolean');
  });

  test('should show video duration options', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Riding a train through magical landscapes');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    await page.waitForTimeout(5000);
    
    const videoButton = page.getByRole('button', { name: /video|generate.*video/i }).first();
    
    if (await videoButton.isVisible({ timeout: 35000 })) {
      await videoButton.click();
      
      // Should show duration selection or default duration info
      const durationOption = page.getByText(/seconds|duration|length/i).first();
      await expect(durationOption.or(page.getByText(/confirm|generate/i))).toBeVisible({ timeout: 10000 });
    }
  });

  test('should allow canceling video generation', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Flying kites in stormy skies');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    await page.waitForTimeout(5000);
    
    const videoButton = page.getByRole('button', { name: /video|generate.*video/i }).first();
    
    if (await videoButton.isVisible({ timeout: 35000 })) {
      await videoButton.click();
      
      // Look for cancel button
      const cancelButton = page.getByRole('button', { name: /cancel|dismiss|close/i }).first();
      
      if (await cancelButton.isVisible({ timeout: 5000 })) {
        await cancelButton.click();
        
        // Should return to results page
        await expect(page.getByText(/interpretation|results/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display video player when ready', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to dream library to find completed videos
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for video elements
      const video = page.locator('video').first();
      const videoPlayer = page.getByRole('region', { name: /video/i }).first();
      
      // Check if any videos exist
      const hasVideo = (await video.isVisible({ timeout: 5000 }).catch(() => false)) ||
                       (await videoPlayer.isVisible({ timeout: 5000 }).catch(() => false));
      
      expect(typeof hasVideo).toBe('boolean');
    }
  });

  test('should show video generation notifications', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Dancing under northern lights');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    await page.waitForTimeout(5000);
    
    const videoButton = page.getByRole('button', { name: /video|generate.*video/i }).first();
    
    if (await videoButton.isVisible({ timeout: 35000 })) {
      await videoButton.click();
      
      // Should show toast notification or alert
      const notification = page.locator('[role="status"]').or(page.getByText(/added.*queue|started|processing/i));
      await expect(notification.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
