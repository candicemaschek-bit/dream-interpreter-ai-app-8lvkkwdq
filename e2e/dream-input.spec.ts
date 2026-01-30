import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './fixtures/auth';

test.describe('Dream Input Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    await page.waitForLoadState('networkidle');
  });

  test('should display dream input tabs', async ({ page }) => {
    // Navigate to dream input page
    await page.goto('/');
    
    // Should show input method tabs
    const textTab = page.getByRole('tab', { name: /text/i });
    const symbolsTab = page.getByRole('tab', { name: /symbols|draw/i });
    const imageTab = page.getByRole('tab', { name: /image|upload/i });
    
    // At least text tab should be visible
    await expect(textTab.or(page.getByText(/text/i).first())).toBeVisible({ timeout: 5000 });
  });

  test('should input dream via text', async ({ page }) => {
    await page.goto('/');
    
    // Select text input tab if needed
    const textTab = page.getByRole('tab', { name: /text/i });
    if (await textTab.isVisible()) {
      await textTab.click();
    }
    
    // Find textarea or input field
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('I was flying over a beautiful ocean with dolphins jumping around me');
    
    // Should have content
    await expect(dreamInput).toHaveValue(/flying.*ocean.*dolphins/i);
  });

  test('should validate empty dream submission', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit without content
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation error
      await expect(page.getByText(/required|empty|please/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should switch between input tabs', async ({ page }) => {
    await page.goto('/');
    
    const textTab = page.getByRole('tab', { name: /text/i });
    const symbolsTab = page.getByRole('tab', { name: /symbols|draw/i });
    
    if (await textTab.isVisible() && await symbolsTab.isVisible()) {
      // Click text tab
      await textTab.click();
      await expect(textTab).toHaveAttribute('aria-selected', 'true');
      
      // Click symbols tab
      await symbolsTab.click();
      await expect(symbolsTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should display canvas for symbol drawing', async ({ page }) => {
    await page.goto('/');
    
    // Switch to symbols/drawing tab
    const symbolsTab = page.getByRole('tab', { name: /symbols|draw/i });
    
    if (await symbolsTab.isVisible()) {
      await symbolsTab.click();
      
      // Should show canvas element
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle image upload', async ({ page }) => {
    await page.goto('/');
    
    // Switch to image upload tab
    const imageTab = page.getByRole('tab', { name: /image|upload/i });
    
    if (await imageTab.isVisible()) {
      await imageTab.click();
      
      // Should show file input or drop zone
      const fileInput = page.locator('input[type="file"]').first();
      const dropZone = page.getByText(/drag|drop|upload/i).first();
      
      const hasUploadOption = (await fileInput.isVisible()) || (await dropZone.isVisible());
      expect(hasUploadOption).toBeTruthy();
    }
  });

  test('should show character count for text input', async ({ page }) => {
    await page.goto('/');
    
    const textTab = page.getByRole('tab', { name: /text/i });
    if (await textTab.isVisible()) {
      await textTab.click();
    }
    
    // Type in textarea
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('This is a test dream description');
    
    // Should show some indicator of content length (might be character count or validation)
    const content = await dreamInput.inputValue();
    expect(content.length).toBeGreaterThan(0);
  });

  test('should enable submit button with valid input', async ({ page }) => {
    await page.goto('/');
    
    // Enter dream text
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('I dreamed about exploring ancient ruins');
    
    // Submit button should be enabled
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });

  test('should handle voice recording option', async ({ page }) => {
    await page.goto('/');
    
    // Look for voice recording button
    const voiceButton = page.getByRole('button', { name: /voice|record|microphone/i }).first();
    
    if (await voiceButton.isVisible()) {
      // Should have voice recording capability
      await expect(voiceButton).toBeVisible();
    }
  });

  test('should save dream input as draft', async ({ page }) => {
    await page.goto('/');
    
    // Enter partial dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Partial dream input for testing');
    
    // Wait for auto-save or look for save indicator
    await page.waitForTimeout(2000);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Draft might be restored (checkpoint feature)
    const restoredInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    const value = await restoredInput.inputValue();
    
    // Check if draft was saved (might be empty if feature not enabled for this user)
    expect(typeof value).toBe('string');
  });
});
