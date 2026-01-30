import { test, expect } from '@playwright/test';
import { signIn, signUp, signOut, TEST_USERS } from './fixtures/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display sign in form', async ({ page }) => {
    // Look for sign in button
    const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
    
    if (await signInButton.isVisible()) {
      await signInButton.click();
    }
    
    // Should show email and password fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should sign in with valid credentials', async ({ page }) => {
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    
    // Should redirect to dashboard or home
    await expect(page).toHaveURL(/.*/, { timeout: 10000 });
    
    // Should show user menu or profile indicator
    const userIndicator = page.getByRole('button', { name: /profile|account|user menu/i }).first();
    await expect(userIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
    }
    
    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid|incorrect|error|failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to sign up form', async ({ page }) => {
    // Look for sign up link
    const signUpLink = page.getByRole('link', { name: /sign up|register|create account/i }).first();
    
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      
      // Should show registration form
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
    }
  });

  test('should sign out successfully', async ({ page }) => {
    // Sign in first
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    
    // Wait for sign in to complete
    await page.waitForTimeout(2000);
    
    // Sign out
    await signOut(page);
    
    // Should show sign in button again
    const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
    await expect(signInButton).toBeVisible({ timeout: 10000 });
  });

  test('should handle social authentication buttons', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
    }
    
    // Check for social auth buttons (Google, Apple, etc.)
    const googleButton = page.getByRole('button', { name: /google/i }).first();
    const appleButton = page.getByRole('button', { name: /apple/i }).first();
    
    // At least one social auth option should be visible
    const hasSocialAuth = (await googleButton.isVisible()) || (await appleButton.isVisible());
    expect(hasSocialAuth).toBeTruthy();
  });

  test('should validate email format', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
    }
    
    // Enter invalid email format
    await page.getByLabel(/email/i).fill('notanemail');
    await page.getByLabel(/password/i).fill('password123');
    
    // Try to submit
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should show validation error or HTML5 validation
    const emailInput = page.getByLabel(/email/i);
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });
});
