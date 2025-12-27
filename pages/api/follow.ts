import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';

// POST: { follower_id, following_id } to follow
// DELETE: { follower_id, following_id } to unfollow
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = await createClient();
  if (req.method === 'POST') {
    const { follower_id, following_id } = req.body;
    if (!follower_id || !following_id) {
      return res.status(400).json({ error: 'follower_id and following_id required' });
    }
    const { data, error } = await supabase
      .from('follows')
      .insert([{ follower_id, following_id }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, data });
  }
  if (req.method === 'DELETE') {
    const { follower_id, following_id } = req.body;
    if (!follower_id || !following_id) {
      return res.status(400).json({ error: 'follower_id and following_id required' });
    }
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', follower_id)
      .eq('following_id', following_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
