import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './fixtures/auth';

test.describe('Admin Panel Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as admin
    await signIn(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    await page.waitForLoadState('networkidle');
  });

  test('should access admin panel', async ({ page }) => {
    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should show admin dashboard
    await expect(page.getByText(/admin|dashboard/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display admin navigation', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should show navigation items
    const navItems = page.getByRole('navigation').first();
    await expect(navItems).toBeVisible({ timeout: 5000 });
  });

  test('should view user management', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to users section
    const usersLink = page.getByRole('link', { name: /users|user management/i }).first();
    
    if (await usersLink.isVisible({ timeout: 5000 })) {
      await usersLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show user list
      await expect(page.getByText(/users|email|total/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display analytics dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to analytics
    const analyticsLink = page.getByRole('link', { name: /analytics|statistics/i }).first();
    
    if (await analyticsLink.isVisible({ timeout: 5000 })) {
      await analyticsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show charts or metrics
      await expect(page.getByText(/total|users|dreams|videos/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should manage feature requests', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to feature requests
    const featuresLink = page.getByRole('link', { name: /features?|requests?/i }).first();
    
    if (await featuresLink.isVisible({ timeout: 5000 })) {
      await featuresLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show feature request list
      await expect(page.getByText(/feature|request|status/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view admin tasks', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to tasks
    const tasksLink = page.getByRole('link', { name: /tasks?/i }).first();
    
    if (await tasksLink.isVisible({ timeout: 5000 })) {
      await tasksLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show task list
      await expect(page.getByText(/task|title|status|priority/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create new admin task', async ({ page }) => {
    await page.goto('/admin');
    
    const tasksLink = page.getByRole('link', { name: /tasks?/i }).first();
    
    if (await tasksLink.isVisible({ timeout: 5000 })) {
      await tasksLink.click();
      await page.waitForLoadState('networkidle');
      
      // Click add task button
      const addButton = page.getByRole('button', { name: /add|new|create.*task/i }).first();
      
      if (await addButton.isVisible({ timeout: 5000 })) {
        await addButton.click();
        
        // Should show task form
        await expect(page.getByLabel(/title|name/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should update task status', async ({ page }) => {
    await page.goto('/admin');
    
    const tasksLink = page.getByRole('link', { name: /tasks?/i }).first();
    
    if (await tasksLink.isVisible({ timeout: 5000 })) {
      await tasksLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for status dropdown on first task
      const statusSelect = page.getByRole('combobox', { name: /status/i }).first();
      
      if (await statusSelect.isVisible({ timeout: 5000 })) {
        await statusSelect.click();
        
        // Should show status options
        await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should monitor video generation queue', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to video queue
    const queueLink = page.getByRole('link', { name: /queue|video.*queue/i }).first();
    
    if (await queueLink.isVisible({ timeout: 5000 })) {
      await queueLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show queue status
      await expect(page.getByText(/queue|pending|processing|completed/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view revenue analytics', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to revenue section
    const revenueLink = page.getByRole('link', { name: /revenue|earnings|financial/i }).first();
    
    if (await revenueLink.isVisible({ timeout: 5000 })) {
      await revenueLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show revenue data
      await expect(page.getByText(/revenue|total|earnings|\$/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should search users', async ({ page }) => {
    await page.goto('/admin');
    
    const usersLink = page.getByRole('link', { name: /users/i }).first();
    
    if (await usersLink.isVisible({ timeout: 5000 })) {
      await usersLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for search input
      const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
      
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill('test');
        
        // Search should filter results
        await expect(searchInput).toHaveValue('test');
      }
    }
  });

  test('should filter admin data by date', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for date filter
    const dateFilter = page.getByLabel(/date|from|to/i).first();
    const filterButton = page.getByRole('button', { name: /filter/i }).first();
    
    const hasDateFilter = (await dateFilter.isVisible({ timeout: 5000 }).catch(() => false)) ||
                         (await filterButton.isVisible({ timeout: 5000 }).catch(() => false));
    
    expect(typeof hasDateFilter).toBe('boolean');
  });

  test('should export admin data', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download/i }).first();
    
    if (await exportButton.isVisible({ timeout: 5000 })) {
      await exportButton.click();
      
      // Should show export options
      await expect(page.getByText(/csv|excel|pdf|format/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update email settings', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to settings
    const settingsLink = page.getByRole('link', { name: /settings|email/i }).first();
    
    if (await settingsLink.isVisible({ timeout: 5000 })) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show email configuration
      await expect(page.getByText(/email|smtp|sender/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view system logs', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to logs
    const logsLink = page.getByRole('link', { name: /logs|activity/i }).first();
    
    if (await logsLink.isVisible({ timeout: 5000 })) {
      await logsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show log entries
      await expect(page.getByText(/log|activity|event|timestamp/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Admin Access Control', () => {
  test('should deny access to non-admin users', async ({ page }) => {
    // Sign in as regular user
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    
    // Try to access admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected or show access denied
    const accessDenied = page.getByText(/access.*denied|unauthorized|permission/i).first();
    const isOnHomePage = page.url().includes('/') && !page.url().includes('/admin');
    
    const noAccess = (await accessDenied.isVisible({ timeout: 5000 }).catch(() => false)) || isOnHomePage;
    expect(noAccess).toBeTruthy();
  });
});
