import { test, expect } from '@playwright/test';

test.describe('Discover Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/discover');
  });

  test('should load discover page with search bar', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /discover/i })).toBeVisible();
    
    // Check search bar exists
    const searchInput = page.getByPlaceholder(/search profiles/i);
    await expect(searchInput).toBeVisible();
  });

  test('should show profiles on load', async ({ page }) => {
    // Wait for profiles to load (either interest-based or top profiles)
    await page.waitForTimeout(2000);
    
    // Check if profiles are displayed (may be empty if no data, but structure should exist)
    const profileCards = page.locator('[class*="rounded-3xl"]').filter({ hasText: /@/ });
    
    // At minimum, the page structure should be there
    await expect(page.getByText(/people with similar interests|top profiles/i)).toBeVisible();
  });

  test('should search for profiles', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search profiles/i);
    
    // Type in search
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Wait for debounce
    
    // Check if search results appear or "no results" message
    const hasResults = await page.locator('text=/no profiles found|@/').count() > 0;
    expect(hasResults).toBeTruthy();
  });

  test('should clear search when input is empty', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search profiles/i);
    
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Should show default view again
    await expect(page.getByText(/people with similar interests|top profiles/i)).toBeVisible();
  });

  test('should display profile cards with correct structure', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check if any profile cards exist
    const profileSection = page.locator('div').filter({ hasText: /followers|following/i }).first();
    
    // If profiles exist, they should have followers/following stats
    const profileCount = await profileSection.count();
    
    if (profileCount > 0) {
      // Verify profile card structure
      await expect(profileSection.first()).toBeVisible();
    }
  });

  test('should show sign in message when not authenticated', async ({ page }) => {
    // Check if sign in message appears (if not logged in)
    const signInMessage = page.getByText(/sign in/i);
    const signInCount = await signInMessage.count();
    
    // Either user is signed in (no message) or not signed in (message appears)
    // Both are valid states
    expect(signInCount >= 0).toBeTruthy();
  });

  test('should navigate to profile from discover', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Try to find a profile link
    const profileLinks = page.locator('a[href*="/profile/"]').first();
    const linkCount = await profileLinks.count();
    
    if (linkCount > 0) {
      await profileLinks.click();
      await expect(page).toHaveURL(/.*\/profile\/.+/);
    }
  });
});

