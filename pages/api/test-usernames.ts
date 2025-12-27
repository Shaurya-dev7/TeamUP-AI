import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const testUsernames = [
    'anay_shanker91',
    'nirvaan_choudhury13',
    'sara_behl45',
    'kiara_kakar43',
    'aniruddh_batra47',
    'mehul_krishnan41',
    'jhanvi_chaudhary18',
    'madhup_kapur27',
    'zoya_virk42'
  ];

  const supabase = createServiceClient();
  const results: any = {
    timestamp: new Date().toISOString(),
    totalUsernames: testUsernames.length,
    found: [],
    notFound: [],
    errors: []
  };

  // Test each username
  for (const username of testUsernames) {
    try {
      // Try with ilike (case-insensitive) - query all columns first to see what exists
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .maybeSingle();

      if (error) {
        results.errors.push({
          username,
          error: error.message,
          code: error.code
        });
      } else if (profile) {
        // Map to available columns (handle different schema)
        results.found.push({
          username: profile.username,
          id: profile.id,
          display_name: profile.display_name || profile.name || profile.full_name || null,
          bio: profile.bio || profile.description || null,
          avatar_url: profile.avatar_url || profile.avatar || null,
          allColumns: Object.keys(profile) // Include all available columns for debugging
        });
      } else {
        results.notFound.push(username);
      }
    } catch (err: any) {
      results.errors.push({
        username,
        error: err.message
      });
    }
  }

  // Also get total profile count
  const { count: totalCount, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  results.totalProfilesInDB = totalCount || 0;
  results.countError = countError?.message;

  // Get sample of all usernames in DB - use * to see all columns
  const { data: sampleProfiles, error: sampleError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  results.sampleUsernamesInDB = sampleProfiles?.map(p => p.username) || [];
  results.sampleError = sampleError?.message;
  // Include sample profile structure to see actual columns
  if (sampleProfiles && sampleProfiles.length > 0) {
    results.sampleProfileStructure = {
      columns: Object.keys(sampleProfiles[0]),
      example: sampleProfiles[0]
    };
  }

  res.json(results);
}

