
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const supabase = createServiceClient();

    // Username is citext (case-insensitive), so eq should work, but use ilike for safety
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile', details: error.message, code: error.code });
    }

    if (!profile) {
      console.warn(`Profile not found for username: ${username}`);
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if viewer is blocked by this profile owner
    // Get viewer username from auth header if present
    const authHeader = req.headers.authorization;
    let viewerUsername: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      
      if (user) {
        const { data: viewerProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        viewerUsername = viewerProfile?.username || null;
      }
    }

    // If viewer is logged in, check if they are blocked by this profile
    if (viewerUsername && viewerUsername.toLowerCase() !== profile.username.toLowerCase()) {
      const { data: blockRecord } = await (supabase as any)
        .from('blocks')
        .select('blocker_username')
        .eq('blocker_username', profile.username)
        .eq('blocked_username', viewerUsername)
        .maybeSingle();

      if (blockRecord) {
        // Viewer is blocked - respond as "profile not found" (silent)
        return res.status(404).json({ error: 'Profile not found' });
      }
    }

    // Get follower count (where following matches this profile's username)
    // @ts-ignore - follows table uses follower/following columns
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following', profile.username);

    // Get following count (where follower matches this profile's username)
    // @ts-ignore - follows table uses follower/following columns
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower', profile.username);

    // Get followers list (fetching profiles where username is in the 'follower' column of follows table)
    // We first get the list of usernames that follow this user
    // @ts-ignore - follows table uses follower/following columns
    const { data: followerLinks, error: fError } = await supabase
        .from('follows')
        .select('follower')
        .eq('following', profile.username)
        .limit(50);

    let followers: any[] = [];
    if (followerLinks && followerLinks.length > 0) {
        const followerUsernames = followerLinks.map((r: any) => r.follower);
        const { data: followerProfiles } = await supabase
            .from('profiles')
            .select('id, username, name')
            .in('username', followerUsernames);
        followers = followerProfiles || [];
    }

    // Get following list (fetching profiles where username is in the 'following' column of follows table)
    // @ts-ignore - follows table uses follower/following columns
    const { data: followingLinks, error: fingError } = await supabase
        .from('follows')
        .select('following')
        .eq('follower', profile.username)
        .limit(50);
        
    let following: any[] = [];
    if (followingLinks && followingLinks.length > 0) {
        const followingUsernames = followingLinks.map((r: any) => r.following);
        const { data: followingProfiles } = await supabase
            .from('profiles')
            .select('id, username, name')
            .in('username', followingUsernames);
        following = followingProfiles || [];
    }

    // Parse interests into an array
    const interests = (profile as any).interests ? (profile as any).interests.split(/[;,]/).map((s: string) => s.trim()).filter(Boolean) : [];

    res.json({
      profile,
      followers: followers, // List might be partial
      following: following,
      followers_count: followersCount || 0, // Trust the database count
      following_count: followingCount || 0,
      interests,
    });
  } catch (err) {
    console.error('API /api/profile unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected server error', details: err instanceof Error ? err.message : err });
  }
}
