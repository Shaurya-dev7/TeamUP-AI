# Playwright Test Suite

This directory contains comprehensive end-to-end tests for the TeamUP-AI website.

## Test Files

### `home.spec.ts`
Tests the home page functionality:
- Page loading and content
- Navigation links
- Featured sections

### `discover.spec.ts`
Tests the discover page:
- Search functionality
- Profile recommendations (interest-based and top profiles)
- Profile cards display
- Follow/unfollow interactions

### `profile.spec.ts`
Tests profile pages:
- Profile display
- Stats (followers, following, mutuals)
- Follow/unfollow buttons
- Skills and interests sections

### `chat.spec.ts`
Tests the chat functionality:
- Chat interface
- Profile search
- Message input
- Chat list

### `auth.spec.ts`
Tests authentication pages:
- Login page
- Signup page
- Form validation
- Navigation between auth pages

### `navigation.spec.ts`
Tests site-wide navigation:
- Header navigation
- Link functionality
- Navigation persistence

### `api/discover-api.spec.ts`
Tests the discover API endpoints:
- Interest-based recommendations
- Top profiles
- Profile search

### `api/profile.spec.ts`
Tests profile API endpoints:
- Profile retrieval
- Follow/unfollow operations

### `e2e-flow.spec.ts`
End-to-end user journey tests:
- Complete user flows
- Cross-page navigation
- Search flows

## Running Tests

### Run all tests
```bash
npm test
# or
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/home.spec.ts
```

### Run tests in UI mode (interactive)
```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests with debug mode
```bash
npx playwright test --debug
```

### Generate test report
```bash
npx playwright show-report
```

## Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:3000` (or set `BASE_URL` env variable)
- Timeout: 30 seconds per test
- Retries: 2 in CI, 0 locally
- Browsers: Chromium, Firefox, WebKit

## Test Data

Some tests use placeholder data. For full functionality:
1. Ensure your Supabase database has test data
2. Update test user IDs in API tests if needed
3. Some tests are designed to work with or without data

## CI/CD

Tests are configured to:
- Run in parallel (except in CI)
- Retry failed tests in CI
- Generate HTML reports
- Take screenshots on failure
- Record traces on retry

## Writing New Tests

1. Create a new `.spec.ts` file in the `tests` directory
2. Use Playwright's test API:
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test('my test', async ({ page }) => {
     await page.goto('/');
     await expect(page.getByText('Hello')).toBeVisible();
   });
   ```
3. Run tests to verify they work
4. Add to appropriate test file or create new one

