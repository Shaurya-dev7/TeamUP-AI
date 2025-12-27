import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';

/**
 * Debug endpoint to check database connectivity and RLS
 * GET /api/debug-profiles
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    };

    // Test with service role key - use * to see all columns
    const serviceClient = createServiceClient();
    const { data: serviceProfiles, error: serviceError, count: serviceCount } = await serviceClient
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(5);

    results.serviceRole = {
      success: !serviceError,
      error: serviceError?.message,
      code: serviceError?.code,
      count: serviceCount,
      sampleProfiles: serviceProfiles?.slice(0, 3) || [],
    };

    // Test with anon key (if available)
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: anonProfiles, error: anonError, count: anonCount } = await anonClient
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(5);

      results.anonKey = {
        success: !anonError,
        error: anonError?.message,
        code: anonError?.code,
        count: anonCount,
        sampleProfiles: anonProfiles?.slice(0, 3) || [],
      };
    }

    // Check table structure
    const { data: tableInfo } = await serviceClient
      .from('profiles')
      .select('*')
      .limit(1);

    results.tableStructure = tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [];

    res.json(results);
  } catch (err: any) {
    console.error('debug-profiles handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

