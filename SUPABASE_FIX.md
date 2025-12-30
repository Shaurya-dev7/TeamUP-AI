# Supabase Profile Loading Fix

## Problem
Profiles were not showing up because API endpoints were using `NEXT_PUBLIC_SUPABASE_ANON_KEY` which is subject to Row Level Security (RLS) policies. If RLS is enabled and blocking public reads, queries return empty arrays.

## Solution
All API endpoints now use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS policies and can read all data.

## Changes Made

### 1. Created Service Client Helper
- **File**: `lib/supabase/service.ts`
- Creates a Supabase client with service role key
- Falls back to anon key with warning if service key not available

### 2. Updated All API Endpoints
All endpoints now use `createServiceClient()`:
- ✅ `pages/api/top-profiles.ts`
- ✅ `pages/api/discover-by-interests.ts`
- ✅ `pages/api/suggested-for-you.ts`
- ✅ `pages/api/search-profiles.ts`
- ✅ `pages/api/discover-people.ts`
- ✅ `pages/api/profile.ts`
- ✅ `pages/api/suggest-people.ts`

### 3. Added Error Logging
All endpoints now log errors to console for debugging:
- Error messages
- Error codes
- Query details

### 4. Created Debug Endpoint
- **File**: `pages/api/debug-profiles.ts`
- **URL**: `GET /api/debug-profiles`
- Tests database connectivity with both service and anon keys
- Shows sample profiles and counts

## How to Use

### 1. Set Environment Variable
Make sure you have `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # IMPORTANT!
```

### 2. Test Database Connection
Visit: `http://localhost:3000/api/debug-profiles`

This will show:
- Whether service key is configured
- How many profiles are in database
- Sample profiles
- Any RLS errors

### 3. Check Console Logs
If profiles still don't show, check your server console for error messages. All API endpoints now log detailed errors.

## Troubleshooting

### No profiles showing
1. Check `/api/debug-profiles` - does it show profiles?
2. Check console logs for errors
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
4. Check if profiles actually exist in your Supabase database

### Service key not working
- Verify the key is correct in Supabase dashboard
- Make sure it's in `.env.local` (not committed to git)
- Restart your dev server after adding the key

### Still getting empty results
- Check Supabase dashboard to confirm profiles exist
- Check RLS policies in Supabase (though service key should bypass them)
- Use the debug endpoint to see what's happening

## Security Note
⚠️ **Never commit `SUPABASE_SERVICE_ROLE_KEY` to git!** It has full database access. Always use `.env.local` which should be in `.gitignore`.

