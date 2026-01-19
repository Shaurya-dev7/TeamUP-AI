import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { logApiError } from '@/lib/utils/error-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, top_n = 10 } = req.body;
  const supabase = createServiceClient();

  // Get the user's profile and skills
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id,username,skills')
    .eq('username', username)
    .single();

  if (userError || !userProfile) {
    logApiError('Suggest people user lookup', userError, { username });
    return res.status(404).json({ error: 'Username not found' });
  }

  // Parse user's skills
  const userSkills = (userProfile.skills || '').split(/[,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!userSkills.length) {
    return res.status(200).json({ recommendations: [], message: 'No skills found for user. Add skills to your profile for better recommendations.' });
  }

  // Find other profiles with overlapping skills
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('id,username,skills')
    .neq('username', username);
  if (allError) {
    logApiError('Suggest people fetch all', allError, { username });
    return res.status(500).json({ error: 'Failed to fetch profiles' });
  }

  // Score by number of overlapping skills
  const scored = (allProfiles || []).map((p: any) => {
    const theirSkills = (p.skills || '').split(/[,;]+/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    const overlap = theirSkills.filter((s: string) => userSkills.includes(s));
    return { ...p, score: overlap.length };
  }).filter(p => p.score > 0);

  // Sort by score descending, limit
  const recommendations = scored.sort((a, b) => b.score - a.score).slice(0, top_n);

  if (!recommendations.length) {
    // Fallback: show popular profiles by followers_count
    const { data: popular, error: popErr } = await supabase
      .from('profiles')
      .select('id,username,skills,followers_count')
      .neq('username', username)
      .order('followers_count', { ascending: false })
      .limit(top_n);
    if (popErr) {
      return res.status(200).json({ recommendations: [], message: 'No recommendations found and failed to load popular profiles.' });
    }
    return res.status(200).json({ recommendations: popular || [], message: 'No skill-based matches found. Showing popular profiles instead.' });
  }

  res.json({ recommendations });
}
