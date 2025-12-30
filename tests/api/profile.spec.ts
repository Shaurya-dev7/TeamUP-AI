import { test, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';

test.describe('API: profile & follow', () => {
  test('GET /api/profile returns profile and lists', async ({ request }) => {
    const res = await request.get(`${base}/api/profile?username=alice`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.profile).toBeTruthy();
    expect(Array.isArray(body.followers)).toBe(true);
    expect(Array.isArray(body.following)).toBe(true);
  });

  test('POST /api/follow and DELETE /api/follow cycle', async ({ request }) => {
    const aliceRes = await request.get(`${base}/api/profile?username=alice`);
    expect(aliceRes.status()).toBe(200);
    const alice = (await aliceRes.json()).profile;

    const bobRes = await request.get(`${base}/api/profile?username=bob`);
    expect(bobRes.status()).toBe(200);
    const bob = (await bobRes.json()).profile;

    expect(alice && bob).toBeTruthy();

    const post = await request.post(`${base}/api/follow`, { data: { follower_id: alice.id, following_id: bob.id } });
    expect(post.status()).toBe(201);

    const del = await request.delete(`${base}/api/follow`, { data: { follower_id: alice.id, following_id: bob.id } });
    expect(del.status()).toBe(200);
  });
});