import { test, expect } from '@playwright/test';
import { signUp } from './fixtures/auth';

test.describe('Launch Offer', () => {
  const timestamp = Date.now();
  const testEmail = `launch-offer-${timestamp}@dreamcatcher.test`;
  const testPassword = 'TestPassword123!';

  test('should grant launch offer to new user', async ({ page }) => {
    // 1. Listen for console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    // 2. Sign up
    await signUp(page, testEmail, testPassword, 'Launch User');

    // 3. Complete onboarding
    await expect(page.getByText('Tell us about yourself')).toBeVisible();
    await page.getByLabel('Name').fill('Test User');
    await page.getByPlaceholder('DD').fill('01');
    await page.getByPlaceholder('MM').fill('01');
    await page.getByPlaceholder('YYYY').fill('1990');
    await page.getByLabel('Male', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Your dream experiences')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Your Privacy Settings')).toBeVisible();
    await page.getByRole('button', { name: 'Continue to Referral' }).click();

    await expect(page.getByText('Have a referral code?')).toBeVisible();
    await page.getByRole('button', { name: 'Complete Setup' }).click();

    // 4. Verify Dashboard
    await expect(page.getByText('New Dream')).toBeVisible();

    // 5. Check logs for launch offer grant
    // We expect "✅ Launch offer granted to user #..."
    const grantedLog = consoleLogs.find(log => log.includes('✅ Launch offer granted'));
    
    // Note: It might have happened during signup or onboarding submit. 
    // Since we capture logs from the start, we should see it.
    
    if (grantedLog) {
      console.log('Launch offer verified:', grantedLog);
    } else {
      console.log('Console logs:', consoleLogs);
    }
    
    // We assert that the log exists OR we check via UI if possible
    // But since the UI doesn't show it explicitly to the user (per code), 
    // we rely on the log which is added in Onboarding.tsx line 189.
    
    expect(grantedLog).toBeTruthy();
  });
});
