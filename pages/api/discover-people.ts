import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

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
    console.error('Discover people error:', error);
    return res.status(500).json({ error: 'Failed to get profiles', details: error.message, code: error.code });
  }
  
  if (!profiles || profiles.length === 0) {
    console.warn('No profiles found in discover-people');
    return res.json({ profiles: [] });
  }
  
  // Map to consistent structure
  const mappedProfiles = profiles.map((p: any) => ({
    id: p.id,
    username: p.username,
    name: p.name,
    skills: p.skills || null,
    college: p.college || null,
    location: p.location || null
  }));
  
  res.json({ profiles: mappedProfiles });
}
