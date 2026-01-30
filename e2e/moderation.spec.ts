import { test, expect } from '@playwright/test';
import { setupAuth } from './fixtures/auth';

test.describe('Dreamstream Moderation Flow', () => {
  test('should share, report, and auto-moderate a dream', async ({ page }) => {
    // 1. Sign in as a dreamer
    const { userId } = await setupAuth(page, 'dreamer');
    
    // 2. Go to Dashboard and create a dream
    await page.goto('/dashboard');
    await page.click('text=Interpret New Dream');
    
    const dreamTitle = `Harmful Dream ${Date.now()}`;
    await page.fill('textarea[placeholder*="dream"]', `This dream contains extreme violence and graphic details that violate community guidelines. Severity score should be high. ${dreamTitle}`);
    await page.click('button:has-text("Interpret Dream")');
    
    // Wait for interpretation
    await page.waitForSelector('text=Dream Analysis', { timeout: 30000 });
    
    // 3. Share to Community
    await page.click('button:has-text("Share to Community")');
    await page.selectOption('select', 'nightmare'); // Territory
    await page.click('button:has-text("Confirm Share")');
    await expect(page.locator('text=Dream shared to community')).toBeVisible();

    // 4. Sign in as another user to report
    await setupAuth(page, 'moderator');
    await page.goto('/community');
    
    // Find the dream in the feed
    await page.click('text=Nightmares');
    const dreamCard = page.locator(`card:has-text("${dreamTitle}")`);
    await expect(dreamCard).toBeVisible();
    
    // 5. Report the dream
    await dreamCard.locator('button:has-text("Report")').click();
    await page.selectOption('select', 'violence');
    await page.fill('textarea', 'Extremely graphic violence detected.');
    await page.click('button:has-text("Submit Report")');
    
    // 6. Verify auto-moderation
    // If it was auto-hidden, it should disappear from the feed
    await expect(dreamCard).not.toBeVisible({ timeout: 10000 });
    
    // 7. Verify status in Admin Dashboard (if admin)
    await page.goto('/admin/moderation');
    await expect(page.locator(`text=${dreamTitle}`)).toBeVisible();
    await expect(page.locator(`text=hidden`)).toBeVisible();
  });
});
