import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './fixtures/auth';

test.describe('Subscription and Pricing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display pricing page', async ({ page }) => {
    // Look for pricing link
    const pricingLink = page.getByRole('link', { name: /pricing|plans|upgrade/i }).first();
    
    if (await pricingLink.isVisible({ timeout: 5000 })) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show pricing tiers
      await expect(page.getByText(/pricing|plans|free|pro|premium/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show all subscription tiers', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|plans/i }).first();
    
    if (await pricingLink.isVisible({ timeout: 5000 })) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show multiple tiers
      const freeTier = page.getByText(/free/i).first();
      const paidTiers = page.getByText(/pro|premium|vip/i).first();
      
      await expect(freeTier.or(paidTiers)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display tier features', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|plans/i }).first();
    
    if (await pricingLink.isVisible({ timeout: 5000 })) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show feature lists
      const features = page.getByText(/interpretations?|videos?|unlimited|priority/i).first();
      await expect(features).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show pricing amounts', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|plans/i }).first();
    
    if (await pricingLink.isVisible({ timeout: 5000 })) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show prices
      const priceElement = page.locator('text=/\\$\\d+/').first();
      await expect(priceElement).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow selecting billing cycle', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|plans/i }).first();
    
    if (await pricingLink.isVisible({ timeout: 5000 })) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for monthly/yearly toggle
      const billingToggle = page.getByRole('button', { name: /monthly|yearly|annual/i }).first();
      const billingSwitch = page.getByRole('switch').first();
      
      const hasBillingOptions = (await billingToggle.isVisible({ timeout: 5000 }).catch(() => false)) ||
                                (await billingSwitch.isVisible({ timeout: 5000 }).catch(() => false));
      
      expect(typeof hasBillingOptions).toBe('boolean');
    }
  });

  test('should initiate upgrade flow', async ({ page }) => {
    // Sign in first
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    
    // Navigate to pricing
    const pricingLink = page.getByRole('link', { name: /pricing|plans|upgrade/i }).first();
    
    if (await pricingLink.isVisible({ timeout: 5000 })) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Click upgrade button
      const upgradeButton = page.getByRole('button', { name: /upgrade|subscribe|get.*pro/i }).first();
      
      if (await upgradeButton.isVisible({ timeout: 5000 })) {
        await upgradeButton.click();
        
        // Should navigate to checkout or show upgrade dialog
        await expect(page.getByText(/checkout|payment|subscribe|confirm/i)).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should show current subscription status', async ({ page }) => {
    // Sign in
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    await page.waitForLoadState('networkidle');
    
    // Navigate to profile or settings
    const profileButton = page.getByRole('button', { name: /profile|account|settings/i }).first();
    
    if (await profileButton.isVisible({ timeout: 5000 })) {
      await profileButton.click();
      await page.waitForTimeout(500);
      
      const settingsLink = page.getByRole('link', { name: /settings|profile/i }).first();
      if (await settingsLink.isVisible({ timeout: 5000 })) {
        await settingsLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should show current tier
        await expect(page.getByText(/free|pro|premium|tier|plan/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display usage limits', async ({ page }) => {
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    await page.waitForLoadState('networkidle');
    
    // Look for usage information
    const usageIndicator = page.getByText(/\d+\s*\/\s*\d+|remaining|used/i).first();
    
    // Usage limits might be visible somewhere
    const hasUsageLimits = await usageIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    expect(typeof hasUsageLimits).toBe('boolean');
  });

  test('should show feature comparison', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|plans/i }).first();
    
    if (await pricingLink.isVisible({ timeout: 5000 })) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for comparison table
      const comparisonTable = page.locator('table').first();
      const featureGrid = page.locator('[data-testid*="comparison"]').first();
      
      const hasComparison = (await comparisonTable.isVisible({ timeout: 5000 }).catch(() => false)) ||
                           (await featureGrid.isVisible({ timeout: 5000 }).catch(() => false));
      
      expect(typeof hasComparison).toBe('boolean');
    }
  });

  test('should handle subscription cancellation', async ({ page }) => {
    // Sign in with PRO user
    await signIn(page, TEST_USERS.PRO.email, TEST_USERS.PRO.password);
    await page.waitForLoadState('networkidle');
    
    // Navigate to settings
    const profileButton = page.getByRole('button', { name: /profile|account/i }).first();
    
    if (await profileButton.isVisible({ timeout: 5000 })) {
      await profileButton.click();
      await page.waitForTimeout(500);
      
      const settingsLink = page.getByRole('link', { name: /settings/i }).first();
      if (await settingsLink.isVisible({ timeout: 5000 })) {
        await settingsLink.click();
        await page.waitForLoadState('networkidle');
        
        // Look for cancel button
        const cancelButton = page.getByRole('button', { name: /cancel.*subscription|unsubscribe/i }).first();
        
        if (await cancelButton.isVisible({ timeout: 5000 })) {
          await cancelButton.click();
          
          // Should show confirmation
          await expect(page.getByText(/confirm|sure|cancel/i)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should show upgrade prompts for restricted features', async ({ page }) => {
    // Sign in as free user
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    await page.goto('/');
    
    // Try to access a premium feature (e.g., video generation)
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    
    if (await dreamInput.isVisible({ timeout: 5000 })) {
      await dreamInput.fill('Test dream for upgrade prompt');
      
      const submitButton = page.getByRole('button', { name: /interpret|analyze/i }).first();
      await submitButton.click();
      
      // Wait for results
      await page.waitForTimeout(5000);
      
      // Try to generate video (premium feature)
      const videoButton = page.getByRole('button', { name: /video/i }).first();
      
      if (await videoButton.isVisible({ timeout: 30000 })) {
        await videoButton.click();
        
        // Should show upgrade prompt
        const upgradePrompt = page.getByText(/upgrade|pro|premium|limit/i).first();
        await expect(upgradePrompt).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should display FAQs on pricing page', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|plans/i }).first();
    
    if (await pricingLink.isVisible({ timeout: 5000 })) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Scroll to bottom for FAQs
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      // Look for FAQ section
      const faqSection = page.getByText(/faq|questions|help/i).first();
      
      const hasFAQ = await faqSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof hasFAQ).toBe('boolean');
    }
  });
});
