import { test, expect } from '@playwright/test';
import { signUp } from './fixtures/auth';

test.describe('Onboarding Flow', () => {
  // Use a unique email for each run to ensure fresh onboarding
  const timestamp = Date.now();
  const testEmail = `onboarding-test-${timestamp}@dreamcatcher.test`;
  const testPassword = 'TestPassword123!';

  test('should complete onboarding successfully with verified UI updates', async ({ page }) => {
    // 1. Sign up a new user
    await signUp(page, testEmail, testPassword, 'New User');

    // 2. Verify Onboarding Step 1 (Basic Info) appears
    await expect(page.getByText('Tell us about yourself')).toBeVisible();
    await expect(page.getByText('This helps us personalize your dream interpretations')).toBeVisible();

    // 3. Verify Date of Birth input (Single field, DD/MM/YYYY)
    // Check that we no longer have 3 inputs (DD, MM, YYYY) but one
    const dobInput = page.getByPlaceholder('DD/MM/YYYY');
    await expect(dobInput).toBeVisible();
    
    // Verify it handles formatting
    await dobInput.fill('01011990');
    await expect(dobInput).toHaveValue('01/01/1990');

    // 4. Verify "Skip for now" is NOT present in Step 1
    await expect(page.getByRole('button', { name: 'Skip for now' })).not.toBeVisible();

    // 5. Verify Tooltips
    // Date of Birth Tooltip
    // We expect a help circle icon
    const tooltips = page.locator('.cursor-help');
    await expect(tooltips.first()).toBeVisible();
    
    // Hover over Date of Birth tooltip
    await tooltips.first().hover();
    // Check for tooltip content
    await expect(page.getByText('Date of Birth helps AI understand life stage context')).toBeVisible();

    // Fill form
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Male', { exact: true }).click(); // Gender
    
    // Continue
    await page.getByRole('button', { name: 'Continue' }).click();

    // 6. Verify Step 2 (Dream Experiences)
    await expect(page.getByText('Your dream experiences')).toBeVisible();
    
    // Check tooltips in Step 2 are present
    const step2Tooltips = page.locator('.cursor-help');
    await expect(step2Tooltips.first()).toBeVisible();

    // Continue to Step 3
    await page.getByRole('button', { name: 'Continue' }).click();

    // 7. Verify Step 3 (Privacy)
    await expect(page.getByText('Your Privacy Settings')).toBeVisible();
    
    // Continue
    await page.getByRole('button', { name: 'Continue to Referral' }).click();

    // 8. Verify Step 4 (Referral)
    await expect(page.getByText('Have a referral code?')).toBeVisible();
    
    // Complete
    await page.getByRole('button', { name: 'Complete Setup' }).click();

    // 9. Verify Dashboard loads (Onboarding complete)
    await expect(page.getByText('New Dream')).toBeVisible();
  });
});
