# Setup Instructions - Get Profiles Working

## Step 1: Check/Create .env.local File

1. **Check if `.env.local` exists** in your project root
2. **If it doesn't exist**, create it
3. **Add these variables:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Where to find these:
- Go to your Supabase Dashboard
- Project Settings → API
- Copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Keep this secret!)

## Step 2: Restart Your Dev Server

After creating/updating `.env.local`:

```bash
# Stop the server (Ctrl+C if running)
# Then start it again:
npm run dev
```

## Step 3: Test Database Connection

Open in your browser:
```
http://localhost:3000/api/debug-profiles
```

**What to look for:**
- ✅ `hasServiceKey: true` - Service key is set
- ✅ `serviceRole.success: true` - Can read from database
- ✅ `serviceRole.count: [number]` - Should show your profile count (5000 if you have 5k profiles)
- ✅ `serviceRole.sampleProfiles` - Should show actual profile data

**If you see errors:**
- Check that `SUPABASE_SERVICE_ROLE_KEY` is correct
- Make sure you copied the full key (no spaces, no quotes)

## Step 4: Test Specific Usernames

Open in your browser:
```
http://localhost:3000/api/test-usernames
```

This will test these 9 usernames:
- anay_shanker91
- nirvaan_choudhury13
- sara_behl45
- kiara_kakar43
- aniruddh_batra47
- mehul_krishnan41
- jhanvi_chaudhary18
- madhup_kapur27
- zoya_virk42

**What to look for:**
- ✅ `found: [array]` - Shows which usernames exist
- ✅ `totalProfilesInDB: [number]` - Total profiles
- ✅ `sampleUsernamesInDB` - Shows actual usernames in your DB

## Step 5: Check Discover Page

1. Go to: `http://localhost:3000/discover`
2. **You should see:**
   - Profiles loading
   - "Suggested for you" section (if logged in)
   - Search bar working
   - Profile cards with names/usernames

**If still empty:**
- Open browser console (F12)
- Check for errors
- Check Network tab - see if API calls are failing

## Step 6: Test Search

1. Go to: `http://localhost:3000/discover`
2. Type a username in the search bar
3. **Should show:**
   - Search results
   - Profile cards
   - Follow buttons

## Troubleshooting

### No profiles showing?
1. ✅ Check `/api/debug-profiles` - does it show profiles?
2. ✅ Check server console for errors
3. ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
4. ✅ Make sure profiles exist in Supabase dashboard

### Service key not working?
- Verify key is correct (no extra spaces)
- Restart dev server after adding key
- Check Supabase dashboard → API → service_role key

### Still getting empty results?
- Check Supabase dashboard → Table Editor → profiles
- Verify you have data in the `profiles` table
- Check if RLS policies are blocking (service key should bypass)

## Quick Checklist

- [ ] `.env.local` file exists with all 3 variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- [ ] Dev server restarted after adding env vars
- [ ] `/api/debug-profiles` shows profiles
- [ ] `/api/test-usernames` shows found profiles
- [ ] Discover page shows profiles
- [ ] Search works

## Next Steps After Setup

Once profiles are loading:
1. ✅ Test follow/unfollow functionality
2. ✅ Test chat search
3. ✅ Test profile pages
4. ✅ Verify "Suggested for you" section works

