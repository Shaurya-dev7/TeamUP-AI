import { test, expect } from '@playwright/test';

test.describe('End-to-End User Flow', () => {
  test('complete user journey: home -> discover -> profile -> chat', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /find the right people/i })).toBeVisible();
    
    // Navigate to discover
    await page.getByRole('link', { name: /discover/i }).first().click();
    await expect(page).toHaveURL(/.*\/discover/);
    await expect(page.getByRole('heading', { name: /discover/i })).toBeVisible();
    
    // Wait for profiles to load
    await page.waitForTimeout(2000);
    
    // Try to click on a profile if available
    const profileLink = page.locator('a[href*="/profile/"]').first();
    const profileLinkCount = await profileLink.count();
    
    if (profileLinkCount > 0) {
      await profileLink.click();
      await expect(page).toHaveURL(/.*\/profile\/.+/);
      
      // Check profile page loaded
      await page.waitForTimeout(1000);
      const profileContent = page.locator('text=/@|followers|following/i');
      const contentCount = await profileContent.count();
      expect(contentCount > 0).toBeTruthy();
    }
    
    // Navigate to chat
    await page.goto('/chat');
    await expect(page.getByRole('heading', { name: /chat/i })).toBeVisible();
    
    // Check chat interface
    const messageInput = page.getByPlaceholder(/write a message/i);
    await expect(messageInput).toBeVisible();
  });

  test('search flow: discover -> search -> view profile', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(1000);
    
    // Perform search
    const searchInput = page.getByPlaceholder(/search profiles/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    // Check search results or empty state
    const searchResults = page.locator('text=/no profiles found|@/');
    const resultsCount = await searchResults.count();
    expect(resultsCount > 0).toBeTruthy();
    
    // Try to click on a search result
    const resultLink = page.locator('a[href*="/profile/"]').first();
    const linkCount = await resultLink.count();
    
    if (linkCount > 0) {
      await resultLink.click();
      await expect(page).toHaveURL(/.*\/profile\/.+/);
    }
  });

  test('navigation persistence across pages', async ({ page }) => {
    const pages = ['/', '/discover', '/chat', '/notifications'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForTimeout(500);
      
      // Header should always be visible
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Logo should be visible
      const logo = page.getByText(/teamup/i);
      await expect(logo.first()).toBeVisible();
    }
  });
});

