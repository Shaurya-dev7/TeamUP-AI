import { createClient } from '@supabase/supabase-js';
import { type Database } from '@/database.types';

/**
 * Creates a Supabase client with service role key (bypasses RLS)
 * Use this for server-side API routes that need to read all data
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. API routes may fail due to RLS policies.');
    // Fallback to anon key (will be subject to RLS)
    return createClient<Database>(
      url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

