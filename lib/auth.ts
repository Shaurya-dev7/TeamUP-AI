import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from './supabase/server';

/**
 * Shared Auth Utility
 * 
 * Safely fetches the current user from Supabase.
 * Uses `supabase.auth.getUser()` which performs a network call to the Supabase Auth API
 * to cryptographically verify the token and ensure the user hasn't been deleted or banned.
 * 
 * Wrapped in React's `cache` to ensure the network request is only made once per 
 * server request, even if called multiple times across layouts and components.
 * 
 * @returns The Supabase User object, or null if unauthenticated.
 */
export const getUser = cache(async () => {
  try {
    const supabase = await createClient();
    
    // IMPORTANT: Always use getUser(), never getSession() on the server
    // getSession() only reads the cookie and can be easily spoofed.
    // getUser() reaches out to the Auth API to validate the token.
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (err) {
    console.error('Error fetching user:', err);
    return null;
  }
});

/**
 * Enforces that a user must be authenticated.
 * 
 * @param redirectTo Optional path to redirect to if unauthorized (default: '/login')
 * @returns The guaranteed Supabase User object
 * @throws Redirects to the login page if the user is not authenticated
 */
export async function requireUser(redirectTo: string = '/login') {
  const user = await getUser();
  
  if (!user) {
    redirect(redirectTo);
  }
  
  return user;
}
