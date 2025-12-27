import type { NextApiRequest, NextApiResponse } from 'next';
import { getPeopleRecommendationsByUsername } from '@/services/recommendations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, top_n = 10 } = req.body;

  try {
    const result = await getPeopleRecommendationsByUsername(username, top_n);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.message === 'Username not found') return res.status(404).json({ error: err.message });
    console.error('suggest-people error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
