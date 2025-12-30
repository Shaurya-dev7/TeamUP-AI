import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check page title
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    
    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should load signup page', async ({ page }) => {
    await page.goto('/signup');
    
    // Check page title
    await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible();
    
    // Check form elements
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should show validation errors on empty form submission', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login/i });
    await submitButton.click();
    
    // Browser should show validation (required fields)
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeFocused();
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    
    // Click sign up link
    const signupLink = page.getByRole('link', { name: /sign up/i });
    if (await signupLink.count() > 0) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*\/signup/);
    }
    
    await page.goto('/signup');
    
    // Click login link
    const loginLink = page.getByRole('link', { name: /login/i });
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*\/login/);
    }
  });
});

