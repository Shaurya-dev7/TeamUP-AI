import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';

// POST: { username, team_size }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, team_size = 6 } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  const supabase = await createClient();
  // Get the user's profile id by username
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();
  if (userError || !userProfile) {
    return res.status(404).json({ error: 'Username not found' });
  }
  // Call a stored procedure or implement logic for team recommendations
  // For now, just return top N recommended profiles (excluding the user)
  const { data: recommendations, error: recError } = await supabase
    .rpc('recommend_profiles', { p_profile_id: userProfile.id, p_limit: team_size });
  if (recError) {
    return res.status(500).json({ error: 'Failed to get team recommendations', details: recError.message });
  }
  // Add the user to the start of the team
  const team = [{ ...userProfile }, ...(recommendations || [])];
  res.json({ team });
}
