import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Check what columns actually exist in the profiles table
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createServiceClient();

  // Get one profile with all columns to see structure
  const { data: sample, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ 
      error: 'Failed to query profiles', 
      details: error.message,
      code: error.code 
    });
  }

  if (!sample) {
    return res.json({ 
      message: 'No profiles found',
      columns: []
    });
  }

  // Get column names
  const columns = Object.keys(sample);
  const sampleData = sample;

  res.json({
    columns,
    sampleProfile: sampleData,
    columnCount: columns.length
  });
}

