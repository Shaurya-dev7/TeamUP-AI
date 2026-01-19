import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { toPublicUserWithMetrics } from '@/lib/dto/public-user-dto';
import { sendSafeError, logApiError } from '@/lib/utils/error-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const { q, limit = 20 } = req.query;
  
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const supabase = createServiceClient();

  const searchQuery = q.trim().toLowerCase();

  // Search profiles using the database function if available, otherwise use client-side search
  try {
    const { data: results, error } = await supabase.rpc('search_profiles', {
      p_query: searchQuery,
      p_limit: parseInt(limit as string) || 20
    });

    if (!error && results) {
      // Get follower counts for each profile
      const profileIds = results.map((r: any) => r.id);
      const { data: followerCounts } = await supabase
        .from('follows')
        .select('following_id')
        .in('following_id', profileIds);

      const followerMap = new Map();
      (followerCounts || []).forEach((fc: any) => {
        followerMap.set(fc.following_id, (followerMap.get(fc.following_id) || 0) + 1);
      });

      // Map to consistent structure using DTO
      const profilesWithCounts = results.map((p: any) =>
        toPublicUserWithMetrics(p, { followers_count: followerMap.get(p.id) || 0 })
      );

      return res.json({ profiles: profilesWithCounts });
    }
  } catch (e) {
    // Fallback to client-side search if RPC doesn't work
  }

  // Fallback: client-side search - STRICT COLUMNS
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, name, skills, college, location')
    .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,skills.ilike.%${searchQuery}%`)
    .limit(parseInt(limit as string) || 20);

  if (error) {
    logApiError('Search profiles fallback', error, { query: searchQuery });
    return sendSafeError(res, 500, 'internal_error');
  }

  // Get follower counts
  const profileIds = (profiles || []).map((p: any) => p.id);
  const { data: followerCounts } = profileIds.length > 0
    ? await supabase
        .from('follows')
        .select('following_id')
        .in('following_id', profileIds)
    : { data: [] };

  const followerMap = new Map();
  (followerCounts || []).forEach((fc: any) => {
    followerMap.set(fc.following_id, (followerMap.get(fc.following_id) || 0) + 1);
  });

  // Map to consistent structure using DTO
  const profilesWithCounts = (profiles || []).map((p: any) =>
    toPublicUserWithMetrics(p, { followers_count: followerMap.get(p.id) || 0 })
  );

  res.json({ profiles: profilesWithCounts });
}

