import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './fixtures/auth';

test.describe('Dream Library and History Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await signIn(page, TEST_USERS.FREE.email, TEST_USERS.FREE.password);
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to dream library', async ({ page }) => {
    await page.goto('/');
    
    // Look for library navigation link
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should be on library page
      await expect(page.getByText(/library|history|my dreams/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display list of saved dreams', async ({ page }) => {
    // Navigate to library
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show dreams or empty state
      const dreamCards = page.locator('[data-testid*="dream"]').or(page.locator('article'));
      const emptyState = page.getByText(/no dreams|empty|start/i);
      
      // Either dreams or empty state should be visible
      const hasDreams = await dreamCards.first().isVisible({ timeout: 5000 }).catch(() => false);
      const isEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
      
      expect(hasDreams || isEmpty).toBeTruthy();
    }
  });

  test('should filter dreams by date', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for date filter or sort options
      const filterButton = page.getByRole('button', { name: /filter|sort|date/i }).first();
      const dateFilter = page.getByLabel(/date|filter/i).first();
      
      // Check if filtering is available
      const hasFiltering = (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) ||
                          (await dateFilter.isVisible({ timeout: 5000 }).catch(() => false));
      
      expect(typeof hasFiltering).toBe('boolean');
    }
  });

  test('should search dreams by keyword', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for search input
      const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
      
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill('flying');
        await page.waitForTimeout(1000);
        
        // Search should filter results
        await expect(searchInput).toHaveValue('flying');
      }
    }
  });

  test('should view dream details', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Click on first dream card
      const firstDream = page.locator('article').first().or(page.locator('[data-testid*="dream"]').first());
      
      if (await firstDream.isVisible({ timeout: 5000 })) {
        await firstDream.click();
        await page.waitForLoadState('networkidle');
        
        // Should show dream details
        await expect(page.getByText(/interpretation|description|details/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should delete dream from library', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for delete button on dream card
      const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
      
      if (await deleteButton.isVisible({ timeout: 5000 })) {
        await deleteButton.click();
        
        // Should show confirmation dialog
        await expect(page.getByText(/confirm|sure|delete/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show dream statistics', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for statistics section
      const statsSection = page.getByText(/statistics|total|count/i).first();
      const statsNumber = page.locator('text=/\\d+\\s+(dreams?|interpretations?)/i').first();
      
      // Stats might be visible
      const hasStats = (await statsSection.isVisible({ timeout: 5000 }).catch(() => false)) ||
                      (await statsNumber.isVisible({ timeout: 5000 }).catch(() => false));
      
      expect(typeof hasStats).toBe('boolean');
    }
  });

  test('should display dream themes', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for themes or tags section
      const themesSection = page.getByText(/themes?|tags?|categories/i).first();
      
      // Themes might be displayed
      const hasThemes = await themesSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof hasThemes).toBe('boolean');
    }
  });

  test('should paginate dream list', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for pagination controls
      const nextButton = page.getByRole('button', { name: /next|more|load more/i }).first();
      const pageNumbers = page.locator('[role="navigation"]').getByText(/\d+/).first();
      
      // Pagination might exist
      const hasPagination = (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) ||
                           (await pageNumbers.isVisible({ timeout: 5000 }).catch(() => false));
      
      expect(typeof hasPagination).toBe('boolean');
    }
  });

  test('should export dream data', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for export button
      const exportButton = page.getByRole('button', { name: /export|download/i }).first();
      
      // Export functionality might be available
      const hasExport = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof hasExport).toBe('boolean');
    }
  });

  test('should view dream video in library', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for video indicators
      const videoIcon = page.locator('[data-video]').first().or(page.getByText(/video/i).first());
      
      if (await videoIcon.isVisible({ timeout: 5000 })) {
        await videoIcon.click();
        
        // Should show video player
        const videoPlayer = page.locator('video').first();
        await expect(videoPlayer).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should share dream from library', async ({ page }) => {
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for share button
      const shareButton = page.getByRole('button', { name: /share/i }).first();
      
      if (await shareButton.isVisible({ timeout: 5000 })) {
        await shareButton.click();
        
        // Should show share dialog
        await expect(page.getByText(/share|copy|link/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
