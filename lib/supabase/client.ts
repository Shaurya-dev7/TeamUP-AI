import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/database.types';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env variables are missing");
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}
