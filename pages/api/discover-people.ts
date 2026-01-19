import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { toPublicUserList } from '@/lib/dto/public-user-dto';
import { sendSafeError, logApiError } from '@/lib/utils/error-utils';

// GET: /api/discover-people?limit=10
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const limit = parseInt(req.query.limit as string) || 10;
  const supabase = createServiceClient();
  
  // Get random or popular profiles - STRICT COLUMNS
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, name, skills, college, location')
    .limit(limit);
    
  if (error) {
    logApiError('Discover people', error);
    return sendSafeError(res, 500, 'internal_error');
  }
  
  if (!profiles || profiles.length === 0) {
    console.warn('No profiles found in discover-people');
    return res.json({ profiles: [] });
  }
  
  // Map to consistent structure using DTO (no internal IDs exposed)
  const mappedProfiles = toPublicUserList(profiles);
  
  res.json({ profiles: mappedProfiles });
}
