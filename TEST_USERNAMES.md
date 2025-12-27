# Testing Usernames

I've created test endpoints and scripts to check if the usernames exist in your database.

## Quick Test (Recommended)

### Option 1: Use the API Endpoint

1. **Make sure your dev server is running:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000/api/test-usernames
   ```

This will show you:
- Which of the 9 usernames were found
- Which are missing
- Total profiles in database
- Sample of other usernames

### Option 2: Use the Debug Endpoint

Visit: `http://localhost:3000/api/debug-profiles`

This shows:
- Database connectivity
- Total profile count
- Sample profiles
- RLS status

## Testing These Usernames:

1. anay_shanker91
2. nirvaan_choudhury13
3. sara_behl45
4. kiara_kakar43
5. aniruddh_batra47
6. mehul_krishnan41
7. jhanvi_chaudhary18
8. madhup_kapur27
9. zoya_virk42

## If .env.local is Missing

Create `.env.local` in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Then restart your dev server.

## What to Check

1. ✅ Are profiles loading in the discover page?
2. ✅ Can you search for these usernames?
3. ✅ Do the API endpoints return data?

If profiles still don't show, check the browser console and server logs for errors.

