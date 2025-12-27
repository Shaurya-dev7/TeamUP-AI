import type { NextApiRequest, NextApiResponse } from 'next';
import { getTeamRecommendationByUsername } from '@/services/recommendations';

// POST: { username, team_size }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, team_size = 6 } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  try {
    const result = await getTeamRecommendationByUsername(username, team_size);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.message === 'Username not found') return res.status(404).json({ error: err.message });
    console.error('team-recommendation error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
