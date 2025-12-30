import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page with correct content', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /find the right people/i })).toBeVisible();
    
    // Check featured sections
    await expect(page.getByText(/skill \+ interest matching/i)).toBeVisible();
    await expect(page.getByText(/network-aware suggestions/i)).toBeVisible();
    await expect(page.getByText(/1:1 and group chat/i)).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole('link', { name: /start discovering/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create your profile/i })).toBeVisible();
  });

  test('should navigate to discover page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /start discovering/i }).click();
    await expect(page).toHaveURL(/.*\/discover/);
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /create your profile/i }).click();
    await expect(page).toHaveURL(/.*\/signup/);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Test Discover link
    await page.getByRole('link', { name: /discover/i }).first().click();
    await expect(page).toHaveURL(/.*\/discover/);
    
    await page.goto('/');
    
    // Test Chat link
    await page.getByRole('link', { name: /chat/i }).first().click();
    await expect(page).toHaveURL(/.*\/chat/);
  });
});

