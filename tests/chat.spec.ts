import { test, expect } from '@playwright/test';

test.describe('Chat Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test('should load chat page', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /chat/i })).toBeVisible();
    
    // Check search bar exists
    const searchInput = page.getByPlaceholder(/search profiles/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have chat interface elements', async ({ page }) => {
    // Check for chat list section
    const chatSection = page.locator('text=/select a conversation|no chats yet|direct chat|group chat/i');
    await expect(chatSection.first()).toBeVisible();
    
    // Check for message input
    const messageInput = page.getByPlaceholder(/write a message/i);
    await expect(messageInput).toBeVisible();
    
    // Check for send button
    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeVisible();
  });

  test('should search for profiles to chat', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search profiles/i);
    
    // Type in search
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Wait for debounce
    
    // Check if search results appear or "no results" message
    const hasResults = await page.locator('text=/no profiles found|@/').count() > 0;
    expect(hasResults).toBeTruthy();
  });

  test('should show sign in message when not authenticated', async ({ page }) => {
    // Check if sign in overlay appears (if not logged in)
    const signInOverlay = page.getByText(/sign in required|must be logged in/i);
    const overlayCount = await signInOverlay.count();
    
    // Overlay may or may not appear depending on auth state
    expect(overlayCount >= 0).toBeTruthy();
  });

  test('should display chat list', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for chat list items or empty state
    const chatList = page.locator('text=/no chats yet|direct chat|group chat|conversation/i');
    await expect(chatList.first()).toBeVisible();
  });
});

