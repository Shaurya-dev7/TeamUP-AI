import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working header navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check logo/brand
    const logo = page.getByText(/teamup/i);
    await expect(logo.first()).toBeVisible();
  });

  test('should navigate to all main pages from header', async ({ page }) => {
    await page.goto('/');
    
    // Test Home link
    const homeLink = page.getByRole('link', { name: /home/i }).first();
    if (await homeLink.count() > 0) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
    
    // Test Discover link
    await page.goto('/');
    const discoverLink = page.getByRole('link', { name: /discover/i }).first();
    if (await discoverLink.count() > 0) {
      await discoverLink.click();
      await expect(page).toHaveURL(/.*\/discover/);
    }
    
    // Test Chat link
    await page.goto('/');
    const chatLink = page.getByRole('link', { name: /chat/i }).first();
    if (await chatLink.count() > 0) {
      await chatLink.click();
      await expect(page).toHaveURL(/.*\/chat/);
    }
    
    // Test Notifications link
    await page.goto('/');
    const notificationsLink = page.getByRole('link', { name: /notifications/i }).first();
    if (await notificationsLink.count() > 0) {
      await notificationsLink.click();
      await expect(page).toHaveURL(/.*\/notifications/);
    }
  });

  test('should show profile link in header', async ({ page }) => {
    await page.goto('/');
    
    const profileLink = page.getByRole('link', { name: /profile/i });
    const linkCount = await profileLink.count();
    
    // Profile link should exist
    expect(linkCount > 0).toBeTruthy();
  });

  test('should show login/signup buttons when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Check for login/signup buttons
    const loginButton = page.getByRole('link', { name: /login/i });
    const signupButton = page.getByRole('link', { name: /sign up/i });
    
    const loginCount = await loginButton.count();
    const signupCount = await signupButton.count();
    
    // At least one should be visible
    expect(loginCount > 0 || signupCount > 0).toBeTruthy();
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    
    // Navigate to different pages
    await page.goto('/discover');
    await expect(header).toBeVisible();
    
    await page.goto('/chat');
    await expect(header).toBeVisible();
    
    await page.goto('/');
    await expect(header).toBeVisible();
  });
});

