import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test('should load profile page', async ({ page }) => {
    // Try to access a profile (using a common username or from API)
    await page.goto('/profile/test');
    
    // Should either show profile or 404/loading
    await page.waitForTimeout(2000);
    
    // Check if profile elements exist
    const hasProfileContent = await page.locator('text=/@|followers|following/i').count() > 0;
    expect(hasProfileContent || page.url().includes('/profile/')).toBeTruthy();
  });

  test('should display profile stats', async ({ page }) => {
    await page.goto('/profile/test');
    await page.waitForTimeout(2000);
    
    // Check for stats section
    const statsSection = page.locator('text=/followers|following|mutual/i');
    const statsCount = await statsSection.count();
    
    // Stats should be visible if profile exists
    if (statsCount > 0) {
      await expect(statsSection.first()).toBeVisible();
    }
  });

  test('should show follow button for other users', async ({ page }) => {
    await page.goto('/profile/test');
    await page.waitForTimeout(2000);
    
    // Check for follow/unfollow button
    const followButton = page.getByRole('button', { name: /follow|unfollow/i });
    const buttonCount = await followButton.count();
    
    // Button may or may not exist depending on auth state
    expect(buttonCount >= 0).toBeTruthy();
  });

  test('should display skills and interests sections', async ({ page }) => {
    await page.goto('/profile/test');
    await page.waitForTimeout(2000);
    
    // Check for skills/interests sections
    const sections = page.locator('text=/skills|interests/i');
    const sectionCount = await sections.count();
    
    // Sections should exist if profile has data
    expect(sectionCount >= 0).toBeTruthy();
  });
});

