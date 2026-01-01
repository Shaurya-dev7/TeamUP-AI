import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';

/**
 * Follow Status API
 * 
 * GET /api/follow-status?target=username
 *   Returns: { isFollowing: boolean, followersCount: number, followingCount: number }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServiceClient();
  const { target } = req.query;

  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'target username required' });
  }

  // Get current user from auth header (optional for public counts)
  let currentUsername: string | null = null;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      currentUsername = profile?.username || null;
    }
  }

  // Get followers count for target
  const { count: followersCount } = await (supabase as any)
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following', target);

  // Get following count for target
  const { count: followingCount } = await (supabase as any)
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower', target);

  // Check if current user follows target
  let isFollowing = false;
  if (currentUsername && currentUsername.toLowerCase() !== target.toLowerCase()) {
    const { data: followRecord } = await (supabase as any)
      .from('follows')
      .select('follower')
      .eq('follower', currentUsername)
      .eq('following', target)
      .maybeSingle();
    
    isFollowing = !!followRecord;
  }

  return res.json({
    isFollowing,
    followersCount: followersCount || 0,
    followingCount: followingCount || 0
  });
}
