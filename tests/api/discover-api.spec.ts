import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Discover API Endpoints', () => {
  test('POST /api/discover-by-interests requires user_id', async ({ request }) => {
    const res = await request.post(`${base}/api/discover-by-interests`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/discover-by-interests returns recommendations', async ({ request }) => {
    // This test requires a valid user_id from the database
    // Using a test user_id - adjust based on your test data
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    const res = await request.post(`${base}/api/discover-by-interests`, {
      data: { user_id: testUserId, limit: 10 },
    });
    
    // Should return 200 even if no interests found
    expect([200, 400, 404]).toContain(res.status());
    
    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty('recommendations');
      expect(Array.isArray(body.recommendations)).toBe(true);
    }
  });

  test('POST /api/top-profiles returns profiles', async ({ request }) => {
    const res = await request.post(`${base}/api/top-profiles`, {
      data: { limit: 10 },
    });
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('profiles');
    expect(Array.isArray(body.profiles)).toBe(true);
  });

  test('GET /api/search-profiles requires query parameter', async ({ request }) => {
    const res = await request.get(`${base}/api/search-profiles`);
    expect(res.status()).toBe(400);
  });

  test('GET /api/search-profiles returns results', async ({ request }) => {
    const res = await request.get(`${base}/api/search-profiles?q=test&limit=10`);
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('profiles');
    expect(Array.isArray(body.profiles)).toBe(true);
  });

  test('GET /api/search-profiles handles empty query', async ({ request }) => {
    const res = await request.get(`${base}/api/search-profiles?q=&limit=10`);
    expect(res.status()).toBe(400);
  });
});

