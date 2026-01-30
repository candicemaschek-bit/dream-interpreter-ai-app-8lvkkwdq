import { Page } from '@playwright/test';

/**
 * Test user credentials for E2E testing
 */
export const TEST_USERS = {
  FREE: {
    email: 'test-free@dreamcatcher.test',
    password: 'TestPassword123!',
    displayName: 'Free User',
  },
  PRO: {
    email: 'test-pro@dreamcatcher.test',
    password: 'TestPassword123!',
    displayName: 'Pro User',
  },
  ADMIN: {
    email: 'test-admin@dreamcatcher.test',
    password: 'AdminPassword123!',
    displayName: 'Admin User',
  },
};

/**
 * Helper to sign in a test user
 */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Look for sign in button (might be in navigation)
  const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
  
  if (await signInButton.isVisible()) {
    await signInButton.click();
  }
  
  // Fill in credentials
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  
  // Submit form
  await page.getByRole('button', { name: /sign in|login/i }).click();
  
  // Wait for navigation after login
  await page.waitForURL(/.*/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to sign up a new test user
 */
export async function signUp(page: Page, email: string, password: string, displayName: string) {
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Look for sign up button
  const signUpButton = page.getByRole('button', { name: /sign up|register/i }).first();
  
  if (await signUpButton.isVisible()) {
    await signUpButton.click();
  }
  
  // Fill in registration form
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  
  // Check if display name field exists
  const displayNameField = page.getByLabel(/name|display name/i);
  if (await displayNameField.isVisible()) {
    await displayNameField.fill(displayName);
  }
  
  // Submit form
  await page.getByRole('button', { name: /sign up|register|create account/i }).click();
  
  // Wait for navigation
  await page.waitForURL(/.*/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to sign out
 */
export async function signOut(page: Page) {
  // Look for user menu or sign out button
  const userMenuButton = page.getByRole('button', { name: /profile|account|user/i }).first();
  
  if (await userMenuButton.isVisible()) {
    await userMenuButton.click();
    await page.waitForTimeout(500);
  }
  
  const signOutButton = page.getByRole('button', { name: /sign out|logout/i }).first();
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Check if user is signed in
 */
export async function isSignedIn(page: Page): Promise<boolean> {
  // Check for elements that only appear when signed in
  const userMenu = page.getByRole('button', { name: /profile|account/i }).first();
  const signOutButton = page.getByRole('button', { name: /sign out/i }).first();
  
  return (await userMenu.isVisible()) || (await signOutButton.isVisible());
}
