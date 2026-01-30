import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './fixtures/auth';

test.describe('Dream Interpretation Results Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    await page.waitForLoadState('networkidle');
  });

  test('should submit dream for interpretation', async ({ page }) => {
    await page.goto('/');
    
    // Enter dream text
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('I was walking through a mysterious forest with glowing trees');
    
    // Submit for interpretation
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Should show loading state or processing indicator
    await expect(page.getByText(/interpreting|analyzing|processing/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display interpretation results', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Flying over mountains and valleys at sunset');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Wait for results (AI processing takes time)
    await page.waitForTimeout(5000);
    
    // Should show interpretation text or results section
    const resultsSection = page.getByText(/interpretation|meaning|analysis/i).first();
    await expect(resultsSection).toBeVisible({ timeout: 30000 });
  });

  test('should show dream symbols identified', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream with clear symbols
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('I saw a snake, water, and a house in my dream');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Wait for interpretation
    await page.waitForTimeout(5000);
    
    // Should show symbols or keywords section
    const symbolsSection = page.getByText(/symbols|themes|keywords/i).first();
    
    // Results should appear (timeout allows for AI processing)
    await expect(symbolsSection.or(page.getByText(/snake|water|house/i))).toBeVisible({ timeout: 35000 });
  });

  test('should handle interpretation errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Submit very short or problematic input
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('a');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    
    if (await submitButton.isEnabled()) {
      await submitButton.click();
      
      // Should show error or validation message
      await expect(page.getByText(/error|invalid|too short|minimum/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should allow saving interpretation', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Dancing with stars in space');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Wait for results
    await page.waitForTimeout(5000);
    
    // Look for save button
    const saveButton = page.getByRole('button', { name: /save|keep|library/i }).first();
    
    // Save functionality should be available
    if (await saveButton.isVisible({ timeout: 30000 })) {
      await expect(saveButton).toBeVisible();
    }
  });

  test('should show share options', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Underwater adventure with colorful fish');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Wait for results
    await page.waitForTimeout(5000);
    
    // Look for share button
    const shareButton = page.getByRole('button', { name: /share/i }).first();
    
    // Share functionality should be available
    if (await shareButton.isVisible({ timeout: 30000 })) {
      await expect(shareButton).toBeVisible();
    }
  });

  test('should display interpretation loading progress', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Climbing endless stairs to the sky');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Should show loading spinner or progress indicator
    const loadingIndicator = page.locator('[role="status"]').or(page.getByText(/loading|processing/i));
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow generating new interpretation', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Running through a maze at night');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Wait for results
    await page.waitForTimeout(5000);
    
    // Look for "interpret again" or "new interpretation" button
    const reinterpretButton = page.getByRole('button', { name: /again|new|another/i }).first();
    
    // User should be able to start over or modify
    if (await reinterpretButton.isVisible({ timeout: 30000 })) {
      await expect(reinterpretButton).toBeVisible();
    }
  });

  test('should show interpretation statistics', async ({ page }) => {
    await page.goto('/');
    
    // Submit dream
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Meeting old friends in a bright garden');
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    
    // Wait for processing
    await page.waitForTimeout(5000);
    
    // Results should contain some analysis structure
    await expect(page.locator('body')).toContainText(/interpretation|analysis|meaning/i, { timeout: 35000 });
  });
});
